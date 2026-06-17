import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/banners - list all banners (admin)
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'غير مصرح به' }, { status: 401 })
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'صلاحيات المدير مطلوبة' }, { status: 403 })
    }

    const banners = await db.adBanner.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({ banners })
  } catch (error) {
    console.error('List banners error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب البانرات' },
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
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'صلاحيات المدير مطلوبة' }, { status: 403 })
    }

    const body = await request.json()
    const {
      title,
      subtitle,
      description,
      imageUrl,
      videoUrl,
      linkUrl,
      buttonText,
      isActive,
      order,
      startsAt,
      endsAt,
    } = body

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'العنوان مطلوب' },
        { status: 400 }
      )
    }

    const banner = await db.adBanner.create({
      data: {
        title: title.trim(),
        subtitle: subtitle?.trim() || null,
        description: description?.trim() || null,
        imageUrl: imageUrl?.trim() || null,
        videoUrl: videoUrl?.trim() || null,
        linkUrl: linkUrl?.trim() || null,
        buttonText: buttonText?.trim() || null,
        isActive: isActive ?? true,
        order: order ?? 0,
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
      },
    })

    return NextResponse.json({ banner }, { status: 201 })
  } catch (error) {
    console.error('Create banner error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء البانر' },
      { status: 500 }
    )
  }
}
