import mqtt from 'mqtt';
import { z } from 'zod';
import { config } from '../config';
import { logger } from '../utils/logger';
import { handleTelemetryMsg, handleCameraEventMsg } from './processor';

// Validation Schema for Machine Telemetry
export const TelemetryPayloadSchema = z.object({
  machine_id: z.string().min(1, "machine_id is required"),
  timestamp: z.string().datetime({ message: "timestamp must be a valid ISO-8601 datetime" }),
  status: z.enum(['RUNNING', 'IDLE', 'DOWN', 'MAINTENANCE', 'UNKNOWN']),
  metrics: z.object({
    temperature: z.number({ required_error: "temperature metric is required" }),
    vibration: z.number({ required_error: "vibration metric is required" }),
    power_consumption: z.number({ required_error: "power_consumption metric is required" })
  })
});

// Validation Schema for Computer Vision Camera Events
export const CameraEventPayloadSchema = z.object({
  camera_id: z.string().min(1, "camera_id is required"),
  zone: z.string().min(1, "zone is required"),
  timestamp: z.string().datetime({ message: "timestamp must be a valid ISO-8601 datetime" }),
  event_type: z.enum([
    'restricted_zone_entry',
    'ppe_violation',
    'machine_blockage',
    'forklift_near_miss',
    'unauthorized_access'
  ]),
  confidence: z.number().min(0).max(1),
  image_url: z.string().url("image_url must be a valid URL")
});

export type TelemetryPayload = z.infer<typeof TelemetryPayloadSchema>;
export type CameraEventPayload = z.infer<typeof CameraEventPayloadSchema>;

export function startMqttIngestion() {
  logger.info(`Connecting to MQTT Broker at ${config.mqttUrl}...`);
  const client = mqtt.connect(config.mqttUrl);

  client.on('connect', () => {
    logger.info('Connected to MQTT Broker.');
    
    // Subscribe with QoS 1 for sensor telemetry (At-least-once delivery)
    client.subscribe('factory/line/+/machine/+/telemetry', { qos: 1 }, (err) => {
      if (err) {
        logger.error(err, 'Subscription error for telemetry');
      } else {
        logger.info('Subscribed to telemetry wildcard topic: factory/line/+/machine/+/telemetry [QoS 1]');
      }
    });

    // Subscribe with QoS 2 for safety CCTV alerts (Exactly-once delivery)
    client.subscribe('factory/camera/+/event', { qos: 2 }, (err) => {
      if (err) {
        logger.error(err, 'Subscription error for camera events');
      } else {
        logger.info('Subscribed to camera events wildcard topic: factory/camera/+/event [QoS 2]');
      }
    });
  });

  client.on('message', async (topic, message) => {
    try {
      const payloadStr = message.toString();
      logger.debug(`MQTT raw packet received on [${topic}]`);

      if (topic.includes('/telemetry')) {
        const parsed = JSON.parse(payloadStr);
        const result = TelemetryPayloadSchema.safeParse(parsed);
        
        if (!result.success) {
          logger.warn(`Malformed Telemetry ignored on ${topic}. Error: ${result.error.message}`);
          return;
        }
        
        // Pass verified payload to stream processor
        await handleTelemetryMsg(result.data, topic);
        
      } else if (topic.includes('/event')) {
        const parsed = JSON.parse(payloadStr);
        const result = CameraEventPayloadSchema.safeParse(parsed);
        
        if (!result.success) {
          logger.warn(`Malformed Camera Event ignored on ${topic}. Error: ${result.error.message}`);
          return;
        }
        
        // Pass verified safety event to stream processor
        await handleCameraEventMsg(result.data);
      }
    } catch (e: any) {
      logger.error(`Failed to handle MQTT message on topic ${topic}: ${e.message}`);
    }
  });

  client.on('error', (err) => {
    logger.error(err, 'MQTT Broker Connection Error');
  });

  client.on('offline', () => {
    logger.warn('MQTT Client went offline. Re-establishing connection...');
  });

  return client;
}
