// lib/prisma.ts - FIXED VERSION
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
};

// Prevent multiple instances in development
export const prisma = globalForPrisma.prisma ?? (() => {
  const client = new PrismaClient({
    // Logging configuration
    log: process.env.NODE_ENV === 'production' 
      ? ['error'] 
      : ['query', 'error', 'warn'],
  });

  // Clean shutdown
  if (typeof window === 'undefined') {
    process.on('beforeExit', () => {
      client.$disconnect();
    });
  }

  return client;
})();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}