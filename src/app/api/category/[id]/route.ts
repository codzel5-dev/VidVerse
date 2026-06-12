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

    const user = await db.user.findUnique({ where: { id: userId } })
    if (user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'صلاحيات المسؤول مطلوبة' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()

    const category = await db.category.update({
      where: { id },
      data: body,
    })

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Update category error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحديث التصنيف' },
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

    const user = await db.user.findUnique({ where: { id: userId } })
    if (user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'صلاحيات المسؤول مطلوبة' },
        { status: 403 }
      )
    }

    const { id } = await params

    await db.category.delete({ where: { id } })

    return NextResponse.json({ message: 'تم حذف التصنيف بنجاح' })
  } catch (error) {
    console.error('Delete category error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف التصنيف' },
      { status: 500 }
    )
  }
}
