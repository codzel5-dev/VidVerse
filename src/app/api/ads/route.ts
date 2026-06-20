import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

async function checkAdmin(userId: string | null) {
  if (!userId) return false
  const user = await db.user.findUnique({ where: { id: userId } })
  return user?.role === 'admin'
}

// GET /api/ads - Admin: list all ad networks ordered by order ASC
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!(await checkAdmin(userId))) {
      return NextResponse.json(
        { error: 'صلاحيات المسؤول مطلوبة' },
        { status: 403 }
      )
    }

    const networks = await db.adNetwork.findMany({
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({ networks })
  } catch (error) {
    console.error('List ad networks error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب شبكات الإعلانات' },
      { status: 500 }
    )
  }
}

// POST /api/ads - Admin: create a new ad network
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!(await checkAdmin(userId))) {
      return NextResponse.json(
        { error: 'صلاحيات المسؤول مطلوبة' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      name,
      type = 'external',
      scriptUrl,
      inlineScript,
      zoneId,
      domain,
      async: asyncProp,
      defer,
      cfAsync,
      placement = 'head',
      isActive,
      order,
      notes,
    } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'اسم الشبكة مطلوب' },
        { status: 400 }
      )
    }

    // Validate based on type
    if (type === 'external') {
      if (!scriptUrl || !scriptUrl.trim()) {
        return NextResponse.json(
          { error: 'رابط السكربت (scriptUrl) مطلوب للنوع external' },
          { status: 400 }
        )
      }
    } else if (type === 'inline') {
      if (!inlineScript || !inlineScript.trim()) {
        return NextResponse.json(
          { error: 'السكربت المضمّن (inlineScript) مطلوب للنوع inline' },
          { status: 400 }
        )
      }
    } else {
      return NextResponse.json(
        { error: 'نوع الشبكة غير صالح (external أو inline)' },
        { status: 400 }
      )
    }

    const network = await db.adNetwork.create({
      data: {
        name: name.trim(),
        type,
        scriptUrl: scriptUrl?.trim() || null,
        inlineScript: inlineScript?.trim() || null,
        zoneId: zoneId?.trim() || null,
        domain: domain?.trim() || null,
        async: asyncProp ?? true,
        defer: defer ?? false,
        cfAsync: cfAsync ?? true,
        placement: placement || 'head',
        isActive: isActive ?? true,
        order: order ?? 0,
        notes: notes?.trim() || null,
      },
    })

    return NextResponse.json({ network }, { status: 201 })
  } catch (error) {
    console.error('Create ad network error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء شبكة الإعلانات' },
      { status: 500 }
    )
  }
}
