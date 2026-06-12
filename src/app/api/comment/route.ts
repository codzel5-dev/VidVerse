import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { resolveVideoId } from '@/lib/video-utils'

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'غير مصرح به' }, { status: 401 })
    }

    const body = await request.json()
    const { content, videoId: rawVideoId, parentId } = body

    if (!content) {
      return NextResponse.json(
        { error: 'محتوى التعليق مطلوب' },
        { status: 400 }
      )
    }

    if (!rawVideoId) {
      return NextResponse.json(
        { error: 'معرف الفيديو مطلوب' },
        { status: 400 }
      )
    }

    // Resolve shareCode to actual video ID
    const videoId = await resolveVideoId(rawVideoId)
    if (!videoId) {
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
