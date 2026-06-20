import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

async function checkAdmin(userId: string | null) {
  if (!userId) return false
  const user = await db.user.findUnique({ where: { id: userId } })
  return user?.role === 'admin'
}

// PATCH /api/ads/[id] - Admin: update an ad network (partial)
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
        { error: 'شبكة الإعلانات غير موجودة' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const {
      name,
      type,
      scriptUrl,
      inlineScript,
      zoneId,
      domain,
      async: asyncProp,
      defer,
      cfAsync,
      placement,
      isActive,
      order,
      notes,
    } = body

    // Determine the effective type for validation (fall back to existing)
    const effectiveType = type ?? existing.type ?? 'external'

    if (type !== undefined) {
      if (type !== 'external' && type !== 'inline') {
        return NextResponse.json(
          { error: 'نوع الشبكة غير صالح (external أو inline)' },
          { status: 400 }
        )
      }
    }

    // Validate required fields based on the effective type
    const effectiveScriptUrl = scriptUrl !== undefined ? scriptUrl : existing.scriptUrl
    const effectiveInlineScript =
      inlineScript !== undefined ? inlineScript : existing.inlineScript

    if (effectiveType === 'external' && !effectiveScriptUrl?.trim()) {
      return NextResponse.json(
        { error: 'رابط السكربت (scriptUrl) مطلوب للنوع external' },
        { status: 400 }
      )
    }
    if (effectiveType === 'inline' && !effectiveInlineScript?.trim()) {
      return NextResponse.json(
        { error: 'السكربت المضمّن (inlineScript) مطلوب للنوع inline' },
        { status: 400 }
      )
    }

    const network = await db.adNetwork.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        type: type !== undefined ? type : undefined,
        scriptUrl:
          scriptUrl !== undefined ? (scriptUrl?.trim() || null) : undefined,
        inlineScript:
          inlineScript !== undefined
            ? inlineScript?.trim() || null
            : undefined,
        zoneId: zoneId !== undefined ? (zoneId?.trim() || null) : undefined,
        domain: domain !== undefined ? (domain?.trim() || null) : undefined,
        async: asyncProp !== undefined ? asyncProp : undefined,
        defer: defer !== undefined ? defer : undefined,
        cfAsync: cfAsync !== undefined ? cfAsync : undefined,
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
      { error: 'حدث خطأ أثناء تحديث شبكة الإعلانات' },
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
        { error: 'شبكة الإعلانات غير موجودة' },
        { status: 404 }
      )
    }

    await db.adNetwork.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete ad network error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف شبكة الإعلانات' },
      { status: 500 }
    )
  }
}
