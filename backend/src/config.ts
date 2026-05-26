import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from backend directory or project root
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://twin_operator:SecretDbPassword123@localhost:5432/digital_twin?schema=public',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  mqttUrl: process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883',
  
  // Timeout settings
  heartbeatTimeoutMs: parseInt(process.env.HEARTBEAT_TIMEOUT_MS || '60000', 10), // 60s
  
  // Alarm Thresholds
  thresholds: {
    temperature: parseFloat(process.env.THRESHOLD_TEMPERATURE || '80.0'), // °C
    vibration: parseFloat(process.env.THRESHOLD_VIBRATION || '5.0'),     // mm/s
  }
};
