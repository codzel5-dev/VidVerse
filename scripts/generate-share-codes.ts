import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import path from 'path'
import crypto from 'crypto'

const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

function generateShareCode(): string {
  const bytes = crypto.randomBytes(8)
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += CHARSET[bytes[i] % CHARSET.length]
  }
  return code
}

async function main() {
  const dbPath = path.join(process.cwd(), 'db', 'custom.db')
  const adapter = new PrismaBetterSqlite3({ url: 'file:' + dbPath })
  const db = new PrismaClient({ adapter })

  const videos = await db.video.findMany({ select: { id: true, shareCode: true } })
  console.log(`Found ${videos.length} videos`)
  
  const usedCodes = new Set<string>()
  
  for (const video of videos) {
    let code = generateShareCode()
    while (usedCodes.has(code)) {
      code = generateShareCode()
    }
    usedCodes.add(code)
    
    await db.video.update({
      where: { id: video.id },
      data: { shareCode: code }
    })
    console.log(`Updated video ${video.id} -> shareCode: ${code}`)
  }
  
  console.log('Done! All videos now have unique shareCodes.')
  await db.$disconnect()
}

main().catch(console.error)
