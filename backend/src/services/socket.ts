import { Server } from 'socket.io';
import { logger } from '../utils/logger';

class SocketService {
  private io: Server | null = null;

  /**
   * Initializes the Socket.IO server instance.
   */
  init(ioInstance: Server) {
    this.io = ioInstance;
    logger.info('Socket.IO service registry initialized.');
  }

  /**
   * Returns the underlying Socket.IO Server instance.
   */
  getIo(): Server | null {
    return this.io;
  }

  /**
   * Sends an event to all sockets joined to a specific room.
   */
  emitToRoom(room: string, event: string, data: any) {
    if (this.io) {
      this.io.to(room).emit(event, data);
      logger.debug(`Socket emit [${event}] to room [${room}]`);
    } else {
      logger.warn(`Failed to emit socket event [${event}] to room [${room}]. Socket.IO is not initialized.`);
    }
  }

  /**
   * Emits an event globally to all connected clients.
   */
  emitGlobal(event: string, data: any) {
    if (this.io) {
      this.io.emit(event, data);
      logger.debug(`Socket global emit [${event}]`);
    } else {
      logger.warn(`Failed to emit global socket event [${event}]. Socket.IO is not initialized.`);
    }
  }
}

export const socketService = new SocketService();
