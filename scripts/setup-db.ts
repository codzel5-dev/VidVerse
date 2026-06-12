import { Client } from 'pg'
import crypto from 'crypto'

// Generate CUID-like IDs
function cuid(): string {
  const timestamp = Date.now().toString(36)
  const random = crypto.randomBytes(12).toString('hex')
  return `c${timestamp}${random}`
}

const DATABASE_URL = process.env.DATABASE_URL || ''

async function main() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()
  console.log('✅ Connected to Supabase PostgreSQL')

  // Drop existing tables if any (in reverse dependency order)
  const dropTables = [
    'DROP TABLE IF EXISTS "CourseTag" CASCADE',
    'DROP TABLE IF EXISTS "VideoTag" CASCADE',
    'DROP TABLE IF EXISTS "SiteSettings" CASCADE',
    'DROP TABLE IF EXISTS "Activity" CASCADE',
    'DROP TABLE IF EXISTS "Order" CASCADE',
    'DROP TABLE IF EXISTS "Notification" CASCADE',
    'DROP TABLE IF EXISTS "WatchHistory" CASCADE',
    'DROP TABLE IF EXISTS "Rating" CASCADE',
    'DROP TABLE IF EXISTS "SavedVideo" CASCADE',
    'DROP TABLE IF EXISTS "Like" CASCADE',
    'DROP TABLE IF EXISTS "Comment" CASCADE',
    'DROP TABLE IF EXISTS "Enrollment" CASCADE',
    'DROP TABLE IF EXISTS "Lesson" CASCADE',
    'DROP TABLE IF EXISTS "Course" CASCADE',
    'DROP TABLE IF EXISTS "Video" CASCADE',
    'DROP TABLE IF EXISTS "Tag" CASCADE',
    'DROP TABLE IF EXISTS "Category" CASCADE',
    'DROP TABLE IF EXISTS "User" CASCADE',
  ]

  console.log('🧹 Cleaning existing tables...')
  for (const sql of dropTables) {
    await client.query(sql)
  }

  // Create all tables
  const tables = [
    `CREATE TABLE "User" (
      "id" TEXT PRIMARY KEY,
      "name" TEXT NOT NULL,
      "email" TEXT NOT NULL UNIQUE,
      "password" TEXT NOT NULL,
      "avatar" TEXT,
      "bio" TEXT,
      "role" TEXT NOT NULL DEFAULT 'user',
      "isBanned" BOOLEAN NOT NULL DEFAULT false,
      "emailVerified" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE "Category" (
      "id" TEXT PRIMARY KEY,
      "name" TEXT NOT NULL,
      "slug" TEXT NOT NULL UNIQUE,
      "description" TEXT,
      "icon" TEXT,
      "color" TEXT,
      "order" INTEGER NOT NULL DEFAULT 0,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE "Tag" (
      "id" TEXT PRIMARY KEY,
      "name" TEXT NOT NULL UNIQUE,
      "slug" TEXT NOT NULL UNIQUE,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE "Video" (
      "id" TEXT PRIMARY KEY,
      "title" TEXT NOT NULL,
      "slug" TEXT NOT NULL UNIQUE,
      "shareCode" TEXT NOT NULL UNIQUE DEFAULT 'pending',
      "description" TEXT,
      "thumbnail" TEXT,
      "duration" INTEGER NOT NULL DEFAULT 0,
      "views" INTEGER NOT NULL DEFAULT 0,
      "isFree" BOOLEAN NOT NULL DEFAULT true,
      "isPublished" BOOLEAN NOT NULL DEFAULT false,
      "isFeatured" BOOLEAN NOT NULL DEFAULT false,
      "seekVideoId" TEXT UNIQUE,
      "seekStatus" TEXT,
      "seekPlayerId" TEXT,
      "embedUrl" TEXT,
      "categoryId" TEXT REFERENCES "Category"("id"),
      "userId" TEXT NOT NULL REFERENCES "User"("id"),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE "Course" (
      "id" TEXT PRIMARY KEY,
      "title" TEXT NOT NULL,
      "slug" TEXT NOT NULL UNIQUE,
      "description" TEXT,
      "thumbnail" TEXT,
      "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "currency" TEXT NOT NULL DEFAULT 'USD',
      "level" TEXT NOT NULL DEFAULT 'beginner',
      "isPublished" BOOLEAN NOT NULL DEFAULT false,
      "isFeatured" BOOLEAN NOT NULL DEFAULT false,
      "categoryId" TEXT REFERENCES "Category"("id"),
      "userId" TEXT NOT NULL REFERENCES "User"("id"),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE "Lesson" (
      "id" TEXT PRIMARY KEY,
      "title" TEXT NOT NULL,
      "description" TEXT,
      "order" INTEGER NOT NULL DEFAULT 0,
      "duration" INTEGER NOT NULL DEFAULT 0,
      "videoId" TEXT UNIQUE REFERENCES "Video"("id"),
      "courseId" TEXT NOT NULL REFERENCES "Course"("id") ON DELETE CASCADE,
      "isFree" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE "Enrollment" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL REFERENCES "User"("id"),
      "courseId" TEXT NOT NULL REFERENCES "Course"("id"),
      "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "lastLessonId" TEXT,
      "isCompleted" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE("userId", "courseId")
    )`,

    `CREATE TABLE "Comment" (
      "id" TEXT PRIMARY KEY,
      "content" TEXT NOT NULL,
      "isReported" BOOLEAN NOT NULL DEFAULT false,
      "userId" TEXT NOT NULL REFERENCES "User"("id"),
      "videoId" TEXT REFERENCES "Video"("id"),
      "parentId" TEXT REFERENCES "Comment"("id"),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE "Like" (
      "id" TEXT PRIMARY KEY,
      "type" TEXT NOT NULL DEFAULT 'like',
      "userId" TEXT NOT NULL REFERENCES "User"("id"),
      "videoId" TEXT REFERENCES "Video"("id"),
      "commentId" TEXT REFERENCES "Comment"("id"),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE "SavedVideo" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL REFERENCES "User"("id"),
      "videoId" TEXT NOT NULL REFERENCES "Video"("id"),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE("userId", "videoId")
    )`,

    `CREATE TABLE "Rating" (
      "id" TEXT PRIMARY KEY,
      "score" INTEGER NOT NULL,
      "userId" TEXT NOT NULL REFERENCES "User"("id"),
      "videoId" TEXT NOT NULL REFERENCES "Video"("id"),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE("userId", "videoId")
    )`,

    `CREATE TABLE "WatchHistory" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL REFERENCES "User"("id"),
      "videoId" TEXT NOT NULL REFERENCES "Video"("id"),
      "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "lastPosition" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE("userId", "videoId")
    )`,

    `CREATE TABLE "Notification" (
      "id" TEXT PRIMARY KEY,
      "title" TEXT NOT NULL,
      "message" TEXT NOT NULL,
      "type" TEXT NOT NULL DEFAULT 'info',
      "isRead" BOOLEAN NOT NULL DEFAULT false,
      "link" TEXT,
      "userId" TEXT NOT NULL REFERENCES "User"("id"),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE "Order" (
      "id" TEXT PRIMARY KEY,
      "amount" DOUBLE PRECISION NOT NULL,
      "currency" TEXT NOT NULL DEFAULT 'USD',
      "status" TEXT NOT NULL DEFAULT 'pending',
      "paymentMethod" TEXT,
      "paymentId" TEXT,
      "userId" TEXT NOT NULL REFERENCES "User"("id"),
      "courseId" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE "Activity" (
      "id" TEXT PRIMARY KEY,
      "type" TEXT NOT NULL,
      "metadata" TEXT,
      "userId" TEXT NOT NULL REFERENCES "User"("id"),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE "SiteSettings" (
      "id" TEXT PRIMARY KEY,
      "key" TEXT NOT NULL UNIQUE,
      "value" TEXT NOT NULL,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE "VideoTag" (
      "videoId" TEXT NOT NULL REFERENCES "Video"("id") ON DELETE CASCADE,
      "tagId" TEXT NOT NULL REFERENCES "Tag"("id") ON DELETE CASCADE,
      UNIQUE("videoId", "tagId")
    )`,

    `CREATE TABLE "CourseTag" (
      "courseId" TEXT NOT NULL REFERENCES "Course"("id") ON DELETE CASCADE,
      "tagId" TEXT NOT NULL REFERENCES "Tag"("id") ON DELETE CASCADE,
      UNIQUE("courseId", "tagId")
    )`,
  ]

  // Create indexes
  const indexes = [
    `CREATE INDEX "Video_userId_idx" ON "Video"("userId")`,
    `CREATE INDEX "Video_categoryId_idx" ON "Video"("categoryId")`,
    `CREATE INDEX "Video_shareCode_idx" ON "Video"("shareCode")`,
    `CREATE INDEX "Comment_videoId_idx" ON "Comment"("videoId")`,
    `CREATE INDEX "Comment_userId_idx" ON "Comment"("userId")`,
    `CREATE INDEX "Like_videoId_idx" ON "Like"("videoId")`,
    `CREATE INDEX "Like_commentId_idx" ON "Like"("commentId")`,
    `CREATE INDEX "Enrollment_userId_idx" ON "Enrollment"("userId")`,
    `CREATE INDEX "Enrollment_courseId_idx" ON "Enrollment"("courseId")`,
  ]

  console.log('📦 Creating tables...')
  for (const sql of tables) {
    await client.query(sql)
  }
  console.log('✅ Tables created')

  console.log('📦 Creating indexes...')
  for (const sql of indexes) {
    await client.query(sql)
  }
  console.log('✅ Indexes created')

  await client.end()
  console.log('🎉 Database setup complete!')
}

main().catch(err => {
  console.error('Error:', err.message || err)
  process.exit(1)
})
