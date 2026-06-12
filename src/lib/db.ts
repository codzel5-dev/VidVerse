import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  // Check if we're using SQLite with the better-sqlite3 adapter (local dev)
  const dbUrl = process.env.DATABASE_URL || ''
  const isSQLite = dbUrl.startsWith('file:') || dbUrl.includes('.db')

  if (isSQLite && process.env.NODE_ENV !== 'production') {
    try {
      // Dynamic import for SQLite adapter (local development only)
      const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3')
      const path = require('path')
      const dbPath = path.join(process.cwd(), 'db', 'custom.db')
      const adapter = new PrismaBetterSqlite3({ url: 'file:' + dbPath })
      return new PrismaClient({ adapter })
    } catch {
      // Fallback to standard client if adapter not available
      return new PrismaClient()
    }
  }

  // Standard PrismaClient for production (PostgreSQL, MySQL, etc.)
  return new PrismaClient()
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

export default db
