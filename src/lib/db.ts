import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Ensure DATABASE_URL is set before creating PrismaClient
if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is not set.')
  console.error('For local development, set it in .env file.')
  console.error('For Vercel deployment, set it in Project Settings > Environment Variables.')
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
