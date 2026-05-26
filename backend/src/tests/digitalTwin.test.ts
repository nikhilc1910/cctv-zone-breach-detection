import { handleTelemetryMsg, checkAndTriggerAlert, stopTelemetryBatcher } from '../services/processor';
import { checkConnectivityHeartbeats } from '../services/timeout';
import { prisma } from '../utils/db';
import { getLatestMachineState, setLatestMachineState } from '../utils/redis';

// Mock PostgreSQL Database Layer via Prisma singleton mock mapping
jest.mock('../utils/db', () => {
  return {
    prisma: {
      machine: {
        upsert: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({})
      },
      telemetryReading: {
        createMany: jest.fn().mockResolvedValue({})
      },
      downtimeEvent: {
        create: jest.fn().mockResolvedValue({ id: 'mock-downtime-id' }),
        update: jest.fn().mockResolvedValue({}),
        findFirst: jest.fn().mockResolvedValue(null)
      },
      alert: {
        create: jest.fn().mockImplementation((args) => Promise.resolve({ id: 'mock-alert-id', ...args.data })),
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue({})
      },
      cameraEvent: {
        create: jest.fn().mockResolvedValue({ id: 'mock-camera-id' })
      }
    }
  };
});

let mockRedisStore: Record<string, string> = {};

// Mock Redis memory store cache in a local object store mapping
jest.mock('../utils/redis', () => {
  return {
    connectRedis: jest.fn().mockResolvedValue({}),
    getLatestMachineState: jest.fn().mockImplementation((machineId) => {
      const val = mockRedisStore[`machine:${machineId}:state`];
      return Promise.resolve(val ? JSON.parse(val) : null);
    }),
    setLatestMachineState: jest.fn().mockImplementation((machineId, state) => {
      mockRedisStore[`machine:${machineId}:state`] = JSON.stringify(state);
      return Promise.resolve();
    }),
    getAllMachineKeys: jest.fn().mockImplementation(() => {
      return Promise.resolve(Object.keys(mockRedisStore));
    }),
    getActiveAlertCache: jest.fn().mockImplementation((machineId, alertType) => {
      return Promise.resolve(mockRedisStore[`active_alert:${machineId}:${alertType}`] || null);
    }),
    setActiveAlertCache: jest.fn().mockImplementation((machineId, alertType, alertId) => {
      mockRedisStore[`active_alert:${machineId}:${alertType}`] = alertId;
      return Promise.resolve();
    }),
    deleteActiveAlertCache: jest.fn().mockImplementation((machineId, alertType) => {
      delete mockRedisStore[`active_alert:${machineId}:${alertType}`];
      return Promise.resolve();
    })
  };
});

// Mock WebSocket Gateway to block network emissions during testing runs
jest.mock('../services/socket', () => {
  return {
    socketService: {
      emitToRoom: jest.fn(),
      emitGlobal: jest.fn(),
      init: jest.fn()
    }
  };
});

describe('Digital Twin Observability System Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRedisStore = {};
  });

  afterAll(() => {
    stopTelemetryBatcher();
  });

  describe('1. Unit Test: Alert Threshold Logic', () => {
    it('should trigger a HIGH severity alert when temperature exceeds 80°C', async () => {
      const machineId = 'MACHINE_01';
      const timestamp = new Date();

      // Mock database returning null (no active alert already exists)
      (prisma.alert.findFirst as jest.Mock).mockResolvedValueOnce(null);

      await checkAndTriggerAlert(machineId, 'HIGH_TEMPERATURE', 85.5, {
        severity: 'HIGH',
        messageTemplate: 'Machine temperature exceeds critical limit of 80°C (Current: {val}°C)'
      }, timestamp, true);

      // Verify db insertion was invoked with correct parameters
      expect(prisma.alert.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            machineId,
            alertType: 'HIGH_TEMPERATURE',
            severity: 'HIGH',
            status: 'ACTIVE'
          })
        })
      );
    });

    it('should mitigate alert storm by updating and not creating duplicates when active alert exists', async () => {
      const machineId = 'MACHINE_01';
      const timestamp = new Date();

      // Mock active alert exists
      (prisma.alert.findFirst as jest.Mock).mockResolvedValueOnce({
        id: 'existing-alert-uuid',
        machineId,
        alertType: 'HIGH_TEMPERATURE',
        status: 'ACTIVE'
      });

      await checkAndTriggerAlert(machineId, 'HIGH_TEMPERATURE', 85.5, {
        severity: 'HIGH',
        messageTemplate: 'Machine temperature exceeds critical limit of 80°C (Current: {val}°C)'
      }, timestamp, true);

      // Verify alert is updated (updatedAt) and create is NOT called
      expect(prisma.alert.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'existing-alert-uuid' }
        })
      );
      expect(prisma.alert.create).not.toHaveBeenCalled();
    });
  });

  describe('2. Integration Test: Ingestion Ingress Flow', () => {
    it('should process telemetry payloads, caching in Redis immediately and registering in DB', async () => {
      const payload = {
        machine_id: 'MACHINE_01',
        timestamp: new Date().toISOString(),
        status: 'RUNNING' as const,
        metrics: {
          temperature: 75.0,
          vibration: 2.1,
          power_consumption: 10.5
        }
      };

      const topic = 'factory/line/line_1/machine/MACHINE_01/telemetry';

      // Pre-seed Redis cache state
      await setLatestMachineState('MACHINE_01', {
        id: 'MACHINE_01',
        status: 'RUNNING',
        lastUpdated: new Date(Date.now() - 5000).toISOString()
      });

      await handleTelemetryMsg(payload, topic);

      // Verify Redis cache is updated with fresh telemetry values
      const cached = await getLatestMachineState('MACHINE_01');
      expect(cached).not.toBeNull();
      expect(cached.status).toBe('RUNNING');
      expect(cached.lastTemperature).toBe(75.0);

      // Verify machine upsert metadata synchronization was triggered
      expect(prisma.machine.upsert).toHaveBeenCalled();
    });
  });

  describe('3. Integration Test: Passive Timeout Detection', () => {
    it('should flag unresponsive machine as DOWN and trigger CONNECTIVITY alert', async () => {
      const machineId = 'MACHINE_SILENT';
      const staleTime = new Date(Date.now() - 75000).toISOString(); // 75 seconds ago (stale heartbeat)

      // Seed stale state in Redis mock store
      await setLatestMachineState(machineId, {
        id: machineId,
        lineId: 'line_1',
        status: 'RUNNING',
        lastUpdated: staleTime
      });

      (prisma.alert.findFirst as jest.Mock).mockResolvedValueOnce(null);

      // Execute connectivity heartbeats timeout sweep
      await checkConnectivityHeartbeats();

      // Verify state was marked DOWN in Redis
      const updatedState = await getLatestMachineState(machineId);
      expect(updatedState.status).toBe('DOWN');

      // Verify SYSTEM_TIMEOUT DowntimeEvent was logged
      expect(prisma.downtimeEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            machineId,
            source: 'SYSTEM_TIMEOUT',
            reason: 'Heartbeat timeout'
          })
        })
      );

      // Verify CRITICAL CONNECTIVITY alert was created
      expect(prisma.alert.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            machineId,
            alertType: 'CONNECTIVITY',
            severity: 'CRITICAL',
            status: 'ACTIVE'
          })
        })
      );
    });
  });
});
