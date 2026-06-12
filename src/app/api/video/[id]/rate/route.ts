import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { resolveVideoId } from '@/lib/video-utils'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'غير مصرح به' }, { status: 401 })
    }

    const { id: identifier } = await params
    const videoId = await resolveVideoId(identifier)
    if (!videoId) {
      return NextResponse.json(
        { error: 'الفيديو غير موجود' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { score } = body

    if (!score || score < 1 || score > 5) {
      return NextResponse.json(
        { error: 'التقييم يجب أن يكون بين 1 و 5' },
        { status: 400 }
      )
    }

    const rating = await db.rating.upsert({
      where: { userId_videoId: { userId, videoId } },
      update: { score },
      create: { userId, videoId, score },
    })

    const ratings = await db.rating.findMany({
      where: { videoId },
      select: { score: true },
    })

    const avgRating =
      ratings.length > 0
        ? Math.round(
            (ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length) * 10
          ) / 10
        : 0

    return NextResponse.json({ rating, avgRating, totalRatings: ratings.length })
  } catch (error) {
    console.error('Rate video error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تقييم الفيديو' },
      { status: 500 }
    )
  }
}
