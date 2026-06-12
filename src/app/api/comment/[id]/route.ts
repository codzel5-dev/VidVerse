import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'غير مصرح به' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { content } = body

    const comment = await db.comment.findUnique({ where: { id } })
    if (!comment) {
      return NextResponse.json(
        { error: 'التعليق غير موجود' },
        { status: 404 }
      )
    }

    if (comment.userId !== userId) {
      return NextResponse.json(
        { error: 'ليس لديك صلاحية تعديل هذا التعليق' },
        { status: 403 }
      )
    }

    const updated = await db.comment.update({
      where: { id },
      data: { content },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    })

    return NextResponse.json({ comment: updated })
  } catch (error) {
    console.error('Update comment error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحديث التعليق' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'غير مصرح به' }, { status: 401 })
    }

    const { id } = await params

    const comment = await db.comment.findUnique({ where: { id } })
    if (!comment) {
      return NextResponse.json(
        { error: 'التعليق غير موجود' },
        { status: 404 }
      )
    }

    if (comment.userId !== userId) {
      const user = await db.user.findUnique({ where: { id: userId } })
      if (user?.role !== 'admin') {
        return NextResponse.json(
          { error: 'ليس لديك صلاحية حذف هذا التعليق' },
          { status: 403 }
        )
      }
    }

    await db.comment.delete({ where: { id } })

    return NextResponse.json({ message: 'تم حذف التعليق بنجاح' })
  } catch (error) {
    console.error('Delete comment error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف التعليق' },
      { status: 500 }
    )
  }
}
