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
    const type = body.type || 'like'

    if (!['like', 'dislike'].includes(type)) {
      return NextResponse.json(
        { error: 'نوع غير صالح' },
        { status: 400 }
      )
    }

    const existingLike = await db.like.findFirst({
      where: { userId, videoId },
    })

    if (existingLike) {
      if (existingLike.type === type) {
        await db.like.delete({ where: { id: existingLike.id } })
        return NextResponse.json({ action: 'removed', type })
      } else {
        await db.like.update({
          where: { id: existingLike.id },
          data: { type },
        })
        return NextResponse.json({ action: 'updated', type })
      }
    } else {
      await db.like.create({
        data: { userId, videoId, type },
      })
      return NextResponse.json({ action: 'created', type })
    }
  } catch (error) {
    console.error('Toggle like error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تبديل الإعجاب' },
      { status: 500 }
    )
  }
}
