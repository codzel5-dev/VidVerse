import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PUT /api/admin/banners/[id] - update banner
// DELETE /api/admin/banners/[id] - delete banner
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'غير مصرح به' }, { status: 401 })
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'صلاحيات المدير مطلوبة' }, { status: 403 })
    }

    const { id } = await params
    const existing = await db.adBanner.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'البانر غير موجود' }, { status: 404 })
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

    const banner = await db.adBanner.update({
      where: { id },
      data: {
        title: title !== undefined ? (title?.trim() || null) : undefined,
        subtitle: subtitle !== undefined ? (subtitle?.trim() || null) : undefined,
        description: description !== undefined ? (description?.trim() || null) : undefined,
        imageUrl: imageUrl !== undefined ? (imageUrl?.trim() || null) : undefined,
        videoUrl: videoUrl !== undefined ? (videoUrl?.trim() || null) : undefined,
        linkUrl: linkUrl !== undefined ? (linkUrl?.trim() || null) : undefined,
        buttonText: buttonText !== undefined ? (buttonText?.trim() || null) : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
        order: order !== undefined ? order : undefined,
        startsAt: startsAt !== undefined ? (startsAt ? new Date(startsAt) : null) : undefined,
        endsAt: endsAt !== undefined ? (endsAt ? new Date(endsAt) : null) : undefined,
      },
    })

    return NextResponse.json({ banner })
  } catch (error) {
    console.error('Update banner error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحديث البانر' },
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
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'صلاحيات المدير مطلوبة' }, { status: 403 })
    }

    const { id } = await params
    const existing = await db.adBanner.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'البانر غير موجود' }, { status: 404 })
    }

    await db.adBanner.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete banner error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف البانر' },
      { status: 500 }
    )
  }
}
