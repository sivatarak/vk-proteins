// lib/prisma.ts - UPDATED FOR PRODUCTION
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'production' 
    ? ['error'] 
    : ['query', 'error', 'warn'],
  
  // ✅ Optimize for Vercel/serverless
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  
  // ✅ Connection pool optimization
  ...(process.env.NODE_ENV === 'production' && {
    connection: {
      connectionLimit: 10,
      acquireTimeout: 60000,
    }
  })
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma