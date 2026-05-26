import { createClient } from 'redis';
import { config } from '../config';
import { logger } from './logger';

export const redisClient = createClient({
  url: config.redisUrl
});

redisClient.on('error', (err) => logger.error('Redis Client Error', err));
redisClient.on('connect', () => logger.info('Redis Client Connected'));

export async function connectRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
}

// Caching helper functions
export async function getLatestMachineState(machineId: string) {
  await connectRedis();
  const stateStr = await redisClient.get(`machine:${machineId}:state`);
  return stateStr ? JSON.parse(stateStr) : null;
}

export async function setLatestMachineState(machineId: string, state: any) {
  await connectRedis();
  // Store the state with no expiry (until overridden or cleared)
  await redisClient.set(`machine:${machineId}:state`, JSON.stringify(state));
}

export async function getAllMachineKeys() {
  await connectRedis();
  return await redisClient.keys('machine:*:state');
}
