import express from 'express';
import http from 'http';
import cors from 'cors';
import { config } from './config';
import { logger } from './utils/logger';
import { connectRedis } from './utils/redis';
import { setupWebsockets } from './gateways/websocket';
import { startMqttIngestion } from './services/ingestion';
import { startHeartbeatMonitor } from './services/timeout';
import apiRouter from './controllers/api';

const app = express();
const server = http.createServer(app);

// Middlewares
app.use(cors());
app.use(express.json());

// Logging middleware for HTTP requests
app.use((req, res, next) => {
  logger.info(`HTTP Request: ${req.method} ${req.url}`);
  next();
});

// Serve public asset folders (e.g. CCTV snapshot frames)
app.use('/public', express.static('public'));

// Mount REST router
app.use('/api', apiRouter);

// Endpoint diagnostics
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString()
  });
});

async function bootstrap() {
  try {
    logger.info('Initializing Digital Twin Observability Backend...');

    // 1. Establish cache context
    await connectRedis();

    // 2. Bootstrap WebSockets (Socket.IO)
    setupWebsockets(server);

    // 3. Launch MQTT Ingestion
    startMqttIngestion();

    // 4. Launch timeout checking daemon
    startHeartbeatMonitor();

    // 5. Fire HTTP Server listening
    server.listen(config.port, () => {
      logger.info(`Digital Twin Backend Server listening on port ${config.port} [NODE_ENV=${config.nodeEnv}]`);
    });
  } catch (error: any) {
    logger.error(`Critical Bootstrap Failure: ${error.message}`);
    process.exit(1);
  }
}

bootstrap();
