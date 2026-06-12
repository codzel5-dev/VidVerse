import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { resolveVideoId } from '@/lib/video-utils'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id')
    const { id: identifier } = await params
    const videoId = await resolveVideoId(identifier)
    if (!videoId) {
      return NextResponse.json(
        { error: 'الفيديو غير موجود' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { progress, lastPosition } = body

    // Increment view count
    await db.video.update({
      where: { id: videoId },
      data: { views: { increment: 1 } },
    })

    // Track watch history if user is logged in
    if (userId) {
      const video = await db.video.findUnique({
        where: { id: videoId },
        select: { title: true },
      })

      await db.watchHistory.upsert({
        where: { userId_videoId: { userId, videoId } },
        update: {
          progress: progress ?? undefined,
          lastPosition: lastPosition ?? undefined,
        },
        create: {
          userId,
          videoId,
          progress: progress ?? 0,
          lastPosition: lastPosition ?? 0,
        },
      })

      // Log activity
      await db.activity.create({
        data: {
          type: 'watch',
          userId,
          metadata: JSON.stringify({ videoId, title: video?.title }),
        },
      })
    }

    return NextResponse.json({ message: 'تم تسجيل المشاهدة' })
  } catch (error) {
    console.error('View video error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تسجيل المشاهدة' },
      { status: 500 }
    )
  }
}
