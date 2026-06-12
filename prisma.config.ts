// @ts-nocheck
import path from 'node:path'
import { defineConfig } from 'prisma/config'

const dbUrl = `file:${path.join(__dirname, 'db', 'custom.db')}`

export default defineConfig({
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  migrate: {
    async url() {
      return dbUrl
    },
  },
  db: {
    async url() {
      return dbUrl
    },
  },
  datasourceUrl: dbUrl,
  migrations: {
    seed: 'npx tsx prisma/seed.ts',
  },
})
