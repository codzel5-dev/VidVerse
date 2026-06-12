import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'غير مصرح به' }, { status: 401 })
    }

    const body = await request.json()
    const { content, videoId, parentId } = body

    if (!content) {
      return NextResponse.json(
        { error: 'محتوى التعليق مطلوب' },
        { status: 400 }
      )
    }

    if (!videoId) {
      return NextResponse.json(
        { error: 'معرف الفيديو مطلوب' },
        { status: 400 }
      )
    }

    const video = await db.video.findUnique({ where: { id: videoId } })
    if (!video) {
      return NextResponse.json(
        { error: 'الفيديو غير موجود' },
        { status: 404 }
      )
    }

    if (parentId) {
      const parentComment = await db.comment.findUnique({
        where: { id: parentId },
      })
      if (!parentComment) {
        return NextResponse.json(
          { error: 'التعليق الأصلي غير موجود' },
          { status: 404 }
        )
      }
    }

    const comment = await db.comment.create({
      data: {
        content,
        videoId,
        userId,
        parentId,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        likes: true,
        replies: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
      },
    })

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    console.error('Create comment error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء التعليق' },
      { status: 500 }
    )
  }
}
