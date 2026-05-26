import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { logger } from '../utils/logger';
import { socketService } from '../services/socket';
import { getAllMachineKeys, getLatestMachineState } from '../utils/redis';

/**
 * Bootstraps Socket.IO and configures client messaging pipelines.
 */
export function setupWebsockets(server: HttpServer) {
  const io = new Server(server, {
    cors: {
      origin: '*', // Allow all client connections in sandbox
      methods: ['GET', 'POST']
    }
  });

  // Register Socket.IO instance in the socket wrapper service to decouple logic
  socketService.init(io);

  io.on('connection', async (socket) => {
    logger.info(`Operator connection established (socket ID: ${socket.id})`);

    // Automatically join the alerts room to receive global warnings
    socket.join('alerts');
    logger.debug(`Socket [${socket.id}] joined room [alerts]`);

    // Pre-populate client state by pushing current Redis cache states immediately
    try {
      const keys = await getAllMachineKeys();
      const initialStates = [];
      for (const key of keys) {
        const machineId = key.split(':')[1];
        const state = await getLatestMachineState(machineId);
        if (state) {
          initialStates.push(state);
        }
      }
      
      // Emit bulk initialization payload
      socket.emit('telemetry:init', initialStates);
      logger.debug(`Pushed cache initialization data for ${initialStates.length} machines to socket [${socket.id}]`);
    } catch (error: any) {
      logger.error(`Failed to dispatch initial cache state: ${error.message}`);
    }

    // Subscribe client to specific line updates
    socket.on('join:line', (payload: { lineId: string }) => {
      if (payload?.lineId) {
        const roomName = `line:${payload.lineId}`;
        socket.join(roomName);
        logger.info(`Socket [${socket.id}] subscribed to line room: ${roomName}`);
      }
    });

    // Unsubscribe client from specific line updates
    socket.on('leave:line', (payload: { lineId: string }) => {
      if (payload?.lineId) {
        const roomName = `line:${payload.lineId}`;
        socket.leave(roomName);
        logger.info(`Socket [${socket.id}] unsubscribed from line room: ${roomName}`);
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Operator connection terminated (socket ID: ${socket.id})`);
    });
  });

  return io;
}
