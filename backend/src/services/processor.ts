import { prisma } from '../utils/db';
import { setLatestMachineState, getLatestMachineState } from '../utils/redis';
import { config } from '../config';
import { logger } from '../utils/logger';
import { socketService } from './socket';
import { TelemetryPayload, CameraEventPayload } from './ingestion';

// In-memory batch write buffer for PostgreSQL telemetry readings
let telemetryBuffer: {
  machineId: string;
  timestamp: Date;
  temperature: number;
  vibration: number;
  powerConsumption: number;
}[] = [];

const BATCH_INTERVAL_MS = 5000;

// Periodic job to commit buffered telemetry in bulk to PostgreSQL
setInterval(async () => {
  if (telemetryBuffer.length === 0) return;
  
  const batch = [...telemetryBuffer];
  telemetryBuffer = []; // Clear buffer immediately to avoid race conditions
  
  try {
    // Write records in a single database transaction query to prevent connection overhead
    await prisma.telemetryReading.createMany({
      data: batch
    });
    logger.debug(`Successfully committed batch of ${batch.length} telemetry readings to Postgres.`);
  } catch (error: any) {
    logger.error(`Database write amplification mitigation batch failed: ${error.message}`);
    // Put records back in the buffer to avoid data loss
    telemetryBuffer = [...batch, ...telemetryBuffer];
  }
}, BATCH_INTERVAL_MS);

/**
 * Handles verified machine sensor telemetry packets.
 * Decouples immediate Redis state caching from batched PostgreSQL storage.
 */
export async function handleTelemetryMsg(payload: TelemetryPayload, topic: string) {
  try {
    const parts = topic.split('/');
    const lineId = parts[2] || 'unknown_line';
    const machineId = parts[4] || payload.machine_id;
    const timestamp = new Date(payload.timestamp);

    // 1. Immediately and synchronously update Redis state cache to keep heartbeat metrics fresh
    const previousState = await getLatestMachineState(machineId);
    const updatedState = {
      id: machineId,
      name: previousState?.name || `Machine ${machineId}`,
      lineId,
      status: payload.status,
      lastTemperature: payload.metrics.temperature,
      lastVibration: payload.metrics.vibration,
      lastPower: payload.metrics.power_consumption,
      lastUpdated: timestamp.toISOString()
    };
    await setLatestMachineState(machineId, updatedState);
    logger.debug(`Redis cache state updated for machine: ${machineId}`);

    // 2. Buffer telemetry for batched database inserts
    telemetryBuffer.push({
      machineId,
      timestamp,
      temperature: payload.metrics.temperature,
      vibration: payload.metrics.vibration,
      powerConsumption: payload.metrics.power_consumption
    });

    // 3. Upsert machine metadata configuration in Postgres (so new machines auto-register)
    await prisma.machine.upsert({
      where: { id: machineId },
      update: {
        status: payload.status,
        lastTemperature: payload.metrics.temperature,
        lastVibration: payload.metrics.vibration,
        lastPower: payload.metrics.power_consumption,
        lastUpdated: timestamp
      },
      create: {
        id: machineId,
        name: `Machine ${machineId}`,
        lineId,
        status: payload.status,
        lastTemperature: payload.metrics.temperature,
        lastVibration: payload.metrics.vibration,
        lastPower: payload.metrics.power_consumption,
        lastUpdated: timestamp
      }
    });

    // 4. Downtime Transition Logic (Active Sensor State Ingress)
    if (previousState) {
      const wasDown = previousState.status === 'DOWN';
      const isDown = payload.status === 'DOWN';

      if (!wasDown && isDown) {
        // Transition: Not-Down -> Down. Record start of downtime.
        await prisma.downtimeEvent.create({
          data: {
            machineId,
            startTime: timestamp,
            source: 'SENSOR'
          }
        });
        logger.info(`Downtime Event started for machine ${machineId} (Status: DOWN received)`);

        // Generate critical DOWNTIME alert
        await checkAndTriggerAlert(machineId, 'DOWNTIME', 'DOWN', {
          severity: 'HIGH',
          messageTemplate: 'Machine reported status as DOWN.'
        }, timestamp, true);
      } 
      else if (wasDown && !isDown) {
        // Transition: Down -> Recovered. Close open downtime event.
        const openEvent = await prisma.downtimeEvent.findFirst({
          where: { machineId, endTime: null },
          orderBy: { startTime: 'desc' }
        });

        if (openEvent) {
          const endTime = timestamp;
          // Calculate and store derived duration in seconds atomically
          const duration = Math.floor((endTime.getTime() - openEvent.startTime.getTime()) / 1000);
          
          await prisma.downtimeEvent.update({
            where: { id: openEvent.id },
            data: {
              endTime,
              duration
            }
          });
          logger.info(`Downtime Event resolved for machine ${machineId}. Duration: ${duration}s`);
        }

        // Auto-resolve downtime alert
        await checkAndTriggerAlert(machineId, 'DOWNTIME', 'RECOVERED', {
          severity: 'HIGH',
          messageTemplate: 'Machine reported status as DOWN.'
        }, timestamp, false);
      }
    }

    // 5. Evaluate Threshold Rules (Alert Engine)
    await checkAndTriggerAlert(
      machineId,
      'HIGH_TEMPERATURE',
      payload.metrics.temperature,
      {
        severity: 'HIGH',
        messageTemplate: 'Machine temperature exceeds critical limit of 80°C (Current: {val}°C)'
      },
      timestamp,
      payload.metrics.temperature > config.thresholds.temperature
    );

    await checkAndTriggerAlert(
      machineId,
      'HIGH_VIBRATION',
      payload.metrics.vibration,
      {
        severity: 'CRITICAL',
        messageTemplate: 'Vibration signature indicates imminent structural fatigue (Current: {val} mm/s)'
      },
      timestamp,
      payload.metrics.vibration > config.thresholds.vibration
    );

    // 6. Broadcast updated telemetry to UI line subscribers
    socketService.emitToRoom(`line:${lineId}`, 'telemetry:update', updatedState);

  } catch (error: any) {
    logger.error(`Error processing telemetry message: ${error.message}`);
  }
}

/**
 * Handles verified computer vision camera event alerts.
 * Registers database models and emits safety overrides.
 */
export async function handleCameraEventMsg(payload: CameraEventPayload) {
  try {
    const timestamp = new Date(payload.timestamp);

    // 1. Persist the raw CameraEvent entry in the DB
    const event = await prisma.cameraEvent.create({
      data: {
        cameraId: payload.camera_id,
        zone: payload.zone,
        timestamp,
        eventType: payload.event_type,
        confidence: payload.confidence,
        imageUrl: payload.image_url
      }
    });

    // 2. Map event type rules to severity scales and alert templates
    let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'HIGH';
    let message = `Computer vision event detected: ${payload.event_type}`;
    let alertType = 'SAFETY_VIOLATION';

    if (payload.event_type === 'restricted_zone_entry') {
      severity = 'CRITICAL';
      message = `Restricted zone breached! Operator detected in zone: ${payload.zone}.`;
    } else if (payload.event_type === 'ppe_violation') {
      severity = 'HIGH';
      message = `Safety violation: Operator detected missing mandatory PPE in zone: ${payload.zone}.`;
    } else if (payload.event_type === 'machine_blockage') {
      severity = 'HIGH';
      alertType = 'HARDWARE_ALERT';
      message = `Critical blockage detected on machine conveyor system in zone: ${payload.zone}.`;
    } else if (payload.event_type === 'forklift_near_miss') {
      severity = 'CRITICAL';
      message = `Hazardous event: Near-miss collision warning involving forklift in zone: ${payload.zone}.`;
    } else if (payload.event_type === 'unauthorized_access') {
      severity = 'HIGH';
      alertType = 'SECURITY_ALERT';
      message = `Security warning: Personnel entered unauthorized sector in zone: ${payload.zone}.`;
    }

    // 3. Create Alert linking directly to CameraEvent via FK
    const alert = await prisma.alert.create({
      data: {
        cameraId: payload.camera_id,
        cameraEventId: event.id,
        alertType,
        severity,
        message,
        status: 'ACTIVE',
        timestamp
      }
    });

    // 4. Emit to global WebSocket room 'alerts'
    socketService.emitToRoom('alerts', 'camera:event', event);
    socketService.emitToRoom('alerts', 'alert:new', alert);
    
    logger.info(`CCTV Alert registered successfully [${alertType}] - Severity: ${severity}`);
  } catch (error: any) {
    logger.error(`Error processing camera safety event: ${error.message}`);
  }
}

/**
 * Checks, creates, and clears threshold-based alerts while mitigating duplicate alert storms.
 */
export async function checkAndTriggerAlert(
  machineId: string,
  alertType: string,
  val: any,
  rule: { severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; messageTemplate: string },
  timestamp: Date,
  isViolating: boolean
) {
  // Check if an active alert of the same type is already stored
  const activeAlert = await prisma.alert.findFirst({
    where: {
      machineId,
      alertType,
      status: 'ACTIVE'
    }
  });

  if (!isViolating) {
    // If the violation has ceased, automatically resolve the existing active alert
    if (activeAlert) {
      const resolvedAlert = await prisma.alert.update({
        where: { id: activeAlert.id },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date()
        }
      });
      logger.info(`Alert ${activeAlert.id} auto-resolved for machine ${machineId} (${alertType})`);
      socketService.emitToRoom('alerts', 'alert:update', resolvedAlert);
    }
    return;
  }

  if (activeAlert) {
    // Alert Storm Mitigation: Update update timestamp to show active presence, but skip creating new row
    await prisma.alert.update({
      where: { id: activeAlert.id },
      data: { updatedAt: new Date() }
    });
    return;
  }

  // Create new active alert record
  const newAlert = await prisma.alert.create({
    data: {
      machineId,
      alertType,
      severity: rule.severity,
      message: rule.messageTemplate.replace('{val}', val.toString()),
      status: 'ACTIVE',
      timestamp
    }
  });

  logger.warn(`New Threshold Alert triggered on ${machineId}: ${newAlert.message}`);
  
  // Broadcast to global alerts feed
  socketService.emitToRoom('alerts', 'alert:new', newAlert);
}
