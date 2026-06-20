import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

async function checkAdmin(userId: string | null) {
  if (!userId) return false
  const user = await db.user.findUnique({ where: { id: userId } })
  return user?.role === 'admin'
}

// PATCH /api/ads/[id] - Admin: update an ad network (partial)
// النموذج المبسّط: الإعلان = كود JavaScript خام. type يبقى "inline".
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!(await checkAdmin(userId))) {
      return NextResponse.json(
        { error: 'صلاحيات المسؤول مطلوبة' },
        { status: 403 }
      )
    }

    const { id } = await params
    const existing = await db.adNetwork.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'الإعلان غير موجود' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const {
      name,
      inlineScript,
      placement,
      isActive,
      order,
      notes,
    } = body

    // Validate required fields (only when provided)
    if (inlineScript !== undefined && !inlineScript?.trim()) {
      return NextResponse.json(
        { error: 'كود JavaScript لا يمكن أن يكون فارغاً' },
        { status: 400 }
      )
    }

    const network = await db.adNetwork.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        type: 'inline',
        inlineScript:
          inlineScript !== undefined
            ? inlineScript?.trim() || null
            : undefined,
        placement: placement !== undefined ? placement || 'head' : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
        order: order !== undefined ? order : undefined,
        notes: notes !== undefined ? (notes?.trim() || null) : undefined,
      },
    })

    return NextResponse.json({ network })
  } catch (error) {
    console.error('Update ad network error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحديث الإعلان' },
      { status: 500 }
    )
  }
}

// DELETE /api/ads/[id] - Admin: delete an ad network
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!(await checkAdmin(userId))) {
      return NextResponse.json(
        { error: 'صلاحيات المسؤول مطلوبة' },
        { status: 403 }
      )
    }

    const { id } = await params
    const existing = await db.adNetwork.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'الإعلان غير موجود' },
        { status: 404 }
      )
    }

    await db.adNetwork.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete ad network error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف الإعلان' },
      { status: 500 }
    )
  }
}
