import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'غير مصرح به' }, { status: 401 })
    }

    const { id: videoId } = await params

    const video = await db.video.findUnique({ where: { id: videoId } })
    if (!video) {
      return NextResponse.json(
        { error: 'الفيديو غير موجود' },
        { status: 404 }
      )
    }

    const existing = await db.savedVideo.findUnique({
      where: { userId_videoId: { userId, videoId } },
    })

    if (existing) {
      await db.savedVideo.delete({ where: { id: existing.id } })
      return NextResponse.json({ action: 'unsaved' })
    } else {
      await db.savedVideo.create({
        data: { userId, videoId },
      })
      return NextResponse.json({ action: 'saved' })
    }
  } catch (error) {
    console.error('Toggle save error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حفظ الفيديو' },
      { status: 500 }
    )
  }
}
