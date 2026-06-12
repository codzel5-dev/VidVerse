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

    const { id: commentId } = await params

    const comment = await db.comment.findUnique({ where: { id: commentId } })
    if (!comment) {
      return NextResponse.json(
        { error: 'التعليق غير موجود' },
        { status: 404 }
      )
    }

    const existingLike = await db.like.findFirst({
      where: { userId, commentId },
    })

    if (existingLike) {
      await db.like.delete({ where: { id: existingLike.id } })
      return NextResponse.json({ action: 'unliked' })
    } else {
      await db.like.create({
        data: { userId, commentId, type: 'like' },
      })
      return NextResponse.json({ action: 'liked' })
    }
  } catch (error) {
    console.error('Toggle comment like error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تبديل الإعجاب' },
      { status: 500 }
    )
  }
}
