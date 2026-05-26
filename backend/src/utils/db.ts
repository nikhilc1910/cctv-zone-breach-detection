import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

export const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'info', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' },
    { level: 'error', emit: 'stdout' }
  ]
});

// Log SQL queries in dev mode
if (process.env.NODE_ENV === 'development') {
  (prisma as any).$on('query', (e: any) => {
    logger.debug(`Prisma SQL: ${e.query} | Params: ${e.params} | Duration: ${e.duration}ms`);
  });
}
