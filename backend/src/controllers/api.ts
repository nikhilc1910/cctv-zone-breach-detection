import { Request, Response, Router } from 'express';
import { prisma } from '../utils/db';
import { logger } from '../utils/logger';
import { socketService } from '../services/socket';
import { handleCameraEventMsg } from '../services/processor';
import { deleteActiveAlertCache } from '../utils/redis';
import { CameraEventPayloadSchema } from '../services/ingestion';

const router = Router();

/**
 * GET /api
 * Diagnostic API root health endpoint.
 */
router.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Autonex Digital Twin API',
    uptime: process.uptime()
  });
});

/**
 * GET /api/machines
 * Retrieves all registered machines and their last known metrics.
 */
router.get('/machines', async (req: Request, res: Response) => {
  try {
    const machines = await prisma.machine.findMany({
      orderBy: { id: 'asc' }
    });
    res.json(machines);
  } catch (error: any) {
    logger.error(`API Fetch Machines Failed: ${error.message}`);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * GET /api/machines/:id/telemetry
 * Fetches paginated time-series telemetry data for charts.
 */
router.get('/machines/:id/telemetry', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string || '50', 10), 500);
    const offset = Math.max(parseInt(req.query.offset as string || '0', 10), 0);

    const totalCount = await prisma.telemetryReading.count({
      where: { machineId: id }
    });

    const readings = await prisma.telemetryReading.findMany({
      where: { machineId: id },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset
    });

    // Expose pagination metadata headers in CORS context
    res.header('Access-Control-Expose-Headers', 'X-Total-Count, X-Limit, X-Offset');
    res.header('X-Total-Count', totalCount.toString());
    res.header('X-Limit', limit.toString());
    res.header('X-Offset', offset.toString());

    res.json(readings.reverse()); // Return chronologically ordered
  } catch (error: any) {
    logger.error(`API Fetch Telemetry Failed: ${error.message}`);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * GET /api/alerts
 * Fetches paginated active and historical alarms.
 */
router.get('/alerts', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string || '50', 10), 500);
    const offset = Math.max(parseInt(req.query.offset as string || '0', 10), 0);
    const status = req.query.status as string; // ACTIVE, ACKNOWLEDGED, RESOLVED

    const filter: any = {};
    if (status) {
      filter.status = status;
    }

    const totalCount = await prisma.alert.count({ where: filter });

    const alerts = await prisma.alert.findMany({
      where: filter,
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
      include: {
        cameraEvent: true
      }
    });

    res.header('Access-Control-Expose-Headers', 'X-Total-Count, X-Limit, X-Offset');
    res.header('X-Total-Count', totalCount.toString());
    res.header('X-Limit', limit.toString());
    res.header('X-Offset', offset.toString());

    res.json(alerts);
  } catch (error: any) {
    logger.error(`API Fetch Alerts Failed: ${error.message}`);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * POST /api/alerts/:id/acknowledge
 * Updates alert state to ACKNOWLEDGED.
 */
router.post('/alerts/:id/acknowledge', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { operatorId } = req.body;

    const alert = await prisma.alert.update({
      where: { id },
      data: {
        status: 'ACKNOWLEDGED',
        acknowledgedAt: new Date(),
        operatorId: operatorId || null
      },
      include: {
        cameraEvent: true
      }
    });

    if (alert.machineId && alert.alertType) {
      await deleteActiveAlertCache(alert.machineId, alert.alertType);
    }

    logger.info(`Alert ${id} acknowledged by operator: ${operatorId || 'system'}`);
    socketService.emitToRoom('alerts', 'alert:update', alert);
    res.json(alert);
  } catch (error: any) {
    logger.error(`API Acknowledge Alert Failed: ${error.message}`);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * POST /api/alerts/:id/resolve
 * Updates alert state to RESOLVED.
 */
router.post('/alerts/:id/resolve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { operatorId } = req.body;

    const alert = await prisma.alert.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        operatorId: operatorId || null
      },
      include: {
        cameraEvent: true
      }
    });

    if (alert.machineId && alert.alertType) {
      await deleteActiveAlertCache(alert.machineId, alert.alertType);
    }

    logger.info(`Alert ${id} resolved by operator: ${operatorId || 'system'}`);
    socketService.emitToRoom('alerts', 'alert:update', alert);
    res.json(alert);
  } catch (error: any) {
    logger.error(`API Resolve Alert Failed: ${error.message}`);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * POST /api/machines/:id/downtime
 * Assigns operator reason classification to downtime events.
 */
router.post('/machines/:id/downtime', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { eventId, reason } = req.body;

    if (!eventId || !reason) {
      return res.status(400).json({ error: 'eventId and reason are required' });
    }

    const updatedEvent = await prisma.downtimeEvent.update({
      where: { id: eventId },
      data: {
        reason,
        source: 'MANUAL'
      }
    });

    logger.info(`Manual downtime classification added to event ${eventId}: ${reason}`);
    res.json(updatedEvent);
  } catch (error: any) {
    logger.error(`API Downtime Reason Log Failed: ${error.message}`);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * GET /api/machines/:id/downtime
 * Fetches recent downtime events for a specific machine.
 */
router.get('/machines/:id/downtime', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string || '10', 10), 100);
    const offset = Math.max(parseInt(req.query.offset as string || '0', 10), 0);
    
    const events = await prisma.downtimeEvent.findMany({
      where: { machineId: id },
      orderBy: { startTime: 'desc' },
      take: limit,
      skip: offset
    });
    res.json(events);
  } catch (error: any) {
    logger.error(`API Fetch Machine Downtime Failed: ${error.message}`);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * GET /api/reports/downtime/export
 * Generates OEE auditing reports and streams them as CSV text file attachments.
 */
router.get('/reports/downtime/export', async (req: Request, res: Response) => {
  try {
    const events = await prisma.downtimeEvent.findMany({
      orderBy: { startTime: 'desc' },
      include: { machine: true }
    });

    const csvRows = ['event_id,machine_id,machine_name,line_id,start_time,end_time,duration_seconds,reason,source'];
    
    for (const e of events) {
      const startTime = e.startTime.toISOString();
      const endTime = e.endTime ? e.endTime.toISOString() : '';
      const duration = e.duration !== null ? e.duration : '';
      const reason = e.reason ? `"${e.reason.replace(/"/g, '""')}"` : '';
      const source = e.source;
      const machineName = e.machine ? `"${e.machine.name.replace(/"/g, '""')}"` : '';
      const lineId = e.machine ? e.machine.lineId : '';

      csvRows.push(`${e.id},${e.machineId},${machineName},${lineId},${startTime},${endTime},${duration},${reason},${source}`);
    }

    const csvContent = csvRows.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=downtime_audit_report.csv');
    res.status(200).send(csvContent);
  } catch (error: any) {
    logger.error(`API CSV Report Export Failed: ${error.message}`);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * POST /api/simulate/camera
 * Mock integration endpoint for edge camera simulators.
 */
router.post('/simulate/camera', async (req: Request, res: Response) => {
  try {
    const result = CameraEventPayloadSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Invalid camera event payload',
        details: result.error.flatten()
      });
    }
    // Execute identical CV parsing logic as MQTT ingestion
    await handleCameraEventMsg(result.data);
    res.status(201).json({ status: 'success', message: 'Camera event processed.' });
  } catch (error: any) {
    logger.error(`API Camera Ingestion Simulation Failed: ${error.message}`);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
