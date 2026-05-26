import { config } from '../config';
import { prisma } from '../utils/db';
import { getAllMachineKeys, getLatestMachineState, setLatestMachineState } from '../utils/redis';
import { logger } from '../utils/logger';
import { socketService } from './socket';
import { checkAndTriggerAlert } from './processor';

/**
 * Checks all active machine states in Redis to flag silence timeouts.
 * Triggers database models and broadcasts connectivity drop alerts.
 */
export async function checkConnectivityHeartbeats() {
  try {
    const keys = await getAllMachineKeys();
    const now = Date.now();

    for (const key of keys) {
      const machineId = key.split(':')[1];
      const state = await getLatestMachineState(machineId);

      if (!state) continue;

      const lastUpdatedTime = new Date(state.lastUpdated).getTime();
      const ageMs = now - lastUpdatedTime;

      // Check if telemetry age exceeds timeout threshold (60 seconds)
      if (ageMs > config.heartbeatTimeoutMs && state.status !== 'DOWN') {
        logger.warn(`Lost communication channel on machine [${machineId}]. Silence age: ${Math.floor(ageMs / 1000)}s.`);

        const timestamp = new Date();

        // 1. Mark status as DOWN in Redis state cache
        const updatedState = {
          ...state,
          status: 'DOWN',
          lastUpdated: timestamp.toISOString()
        };
        await setLatestMachineState(machineId, updatedState);

        // 2. Mark status as DOWN in PostgreSQL
        await prisma.machine.update({
          where: { id: machineId },
          data: {
            status: 'DOWN',
            lastUpdated: timestamp
          }
        });

        // 3. Record a DowntimeEvent flagged with SYSTEM_TIMEOUT
        await prisma.downtimeEvent.create({
          data: {
            machineId,
            startTime: timestamp,
            source: 'SYSTEM_TIMEOUT',
            reason: 'Heartbeat timeout'
          }
        });

        // 4. Fire CRITICAL CONNECTIVITY alert
        await checkAndTriggerAlert(
          machineId,
          'CONNECTIVITY',
          'TIMEOUT',
          {
            severity: 'CRITICAL',
            messageTemplate: 'Lost communication channel. Heartbeat missing for > 60 seconds.'
          },
          timestamp,
          true
        );

        // 5. Broadcast to Socket.IO rooms
        socketService.emitToRoom(`line:${state.lineId}`, 'telemetry:update', updatedState);
      }
    }
  } catch (error: any) {
    logger.error(`Heartbeat monitor check cycle failed: ${error.message}`);
  }
}

let checkInterval: NodeJS.Timeout | null = null;

export function startHeartbeatMonitor() {
  logger.info('Starting passive heartbeat connectivity monitor daemon (interval: 10s)...');
  checkInterval = setInterval(checkConnectivityHeartbeats, 10000);
}

export function stopHeartbeatMonitor() {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
    logger.info('Heartbeat connectivity monitor daemon stopped.');
  }
}
