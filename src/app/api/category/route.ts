import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const categories = await db.category.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { videos: true, courses: true },
        },
      },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('List categories error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب التصنيفات' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { name, slug, description, icon, color, order } = body

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'اسم التصنيف والرابط مطلوبان' },
        { status: 400 }
      )
    }

    const category = await db.category.create({
      data: {
        name,
        slug,
        description,
        icon,
        color,
        order: order || 0,
      },
    })

    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    console.error('Create category error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء التصنيف' },
      { status: 500 }
    )
  }
}
