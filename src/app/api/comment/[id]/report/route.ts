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

    await db.comment.update({
      where: { id: commentId },
      data: { isReported: true },
    })

    return NextResponse.json({ message: 'تم الإبلاغ عن التعليق بنجاح' })
  } catch (error) {
    console.error('Report comment error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء الإبلاغ عن التعليق' },
      { status: 500 }
    )
  }
}
