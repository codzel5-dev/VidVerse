import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { anonMP4 } from '@/lib/anonmp4'

export const maxDuration = 300 // 5 minutes for large uploads

/**
 * Server-side proxy for AnonMP4 video upload
 * Avoids CORS issues and keeps API usage server-side
 *
 * Flow: Frontend → POST /api/anonmp4/upload → AnonMP4 API → return video data
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin role
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'غير مصرح به' }, { status: 401 })
    }
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'غير مصرح به' }, { status: 403 })
    }

    // Parse FormData from frontend
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const fileName = formData.get('fileName') as string | null

    if (!file) {
      return NextResponse.json({ error: 'ملف الفيديو مطلوب' }, { status: 400 })
    }

    const name = fileName || file.name || 'video.mp4'
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2)

    console.log(`[AnonMP4 Upload] Starting: ${name} (${fileSizeMB} MB)`)

    // Upload to AnonMP4 API (server-to-server, no CORS issues)
    const result = await anonMP4.uploadVideo(file, name)

    if (!result.success || !result.video_id) {
      console.error('[AnonMP4 Upload] Upload failed:', result)
      return NextResponse.json(
        { error: 'فشل رفع الفيديو إلى AnonMP4' },
        { status: 502 }
      )
    }

    console.log(`[AnonMP4 Upload] Success! Video ID: ${result.video_id}`)

    return NextResponse.json({
      videoId: result.video_id,
      title: result.title,
      thumbnail: result.thumbnail,
      watchUrl: result.watch_url,
      embedUrl: result.embed_url,
      deleteUrl: result.delete_url,
      uploadDate: result.upload_date,
      message: result.message,
    }, { status: 200 })

  } catch (error) {
    console.error('[AnonMP4 Upload] Error:', error)
    const message = error instanceof Error ? error.message : 'حدث خطأ أثناء رفع الفيديو'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
