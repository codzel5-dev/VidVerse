import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Resolve DATABASE_URL - prefer PostgreSQL URL from .env over system SQLite URL
function getDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL
  if (envUrl && envUrl.startsWith('postgresql://')) {
    return envUrl
  }
  // System env has SQLite URL, but we need PostgreSQL
  // Hardcode the Supabase URL for now (will be overridden by Vercel env vars in production)
  return process.env.DIRECT_URL || 'postgresql://postgres.vtqsdfcfvtcxazrdqwnl:70Cz1v34oLnJckcR@aws-0-eu-west-1.pooler.supabase.com:6543/postgres'
}

function createPrismaClient() {
  const connectionString = getDatabaseUrl()

  const isSupabase = connectionString.includes('supabase') || connectionString.includes('pooler')

  const pool = new pg.Pool({
    connectionString,
    ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
    max: isSupabase ? 5 : undefined,
    connectionTimeoutMillis: 15000,
    idleTimeoutMillis: 30000,
  })

  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

export default db
