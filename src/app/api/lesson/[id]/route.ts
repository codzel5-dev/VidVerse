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

    const existing = await db.lesson.findUnique({
      where: { id },
      include: { course: true },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'الدرس غير موجود' },
        { status: 404 }
      )
    }

    // Check admin or owner
    if (existing.course.userId !== userId) {
      const user = await db.user.findUnique({ where: { id: userId } })
      if (user?.role !== 'admin') {
        return NextResponse.json(
          { error: 'ليس لديك صلاحية تعديل هذا الدرس' },
          { status: 403 }
        )
      }
    }

    const lesson = await db.lesson.update({
      where: { id },
      data: body,
      include: {
        video: {
          select: { id: true, title: true, duration: true, thumbnail: true, isFree: true },
        },
      },
    })

    return NextResponse.json({ lesson })
  } catch (error) {
    console.error('Update lesson error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحديث الدرس' },
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

    const existing = await db.lesson.findUnique({
      where: { id },
      include: { course: true },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'الدرس غير موجود' },
        { status: 404 }
      )
    }

    if (existing.course.userId !== userId) {
      const user = await db.user.findUnique({ where: { id: userId } })
      if (user?.role !== 'admin') {
        return NextResponse.json(
          { error: 'ليس لديك صلاحية حذف هذا الدرس' },
          { status: 403 }
        )
      }
    }

    await db.lesson.delete({ where: { id } })

    return NextResponse.json({ message: 'تم حذف الدرس بنجاح' })
  } catch (error) {
    console.error('Delete lesson error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف الدرس' },
      { status: 500 }
    )
  }
}
