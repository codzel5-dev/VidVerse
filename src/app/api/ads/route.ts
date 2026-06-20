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
// النموذج المبسّط: الإعلان = كود JavaScript خام يُحقن كما هو.
// type يُضبط تلقائياً على "inline" — لا حاجة لـ scriptUrl/zoneId/domain.
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
      inlineScript,
      placement = 'head',
      isActive,
      order,
      notes,
    } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'اسم الإعلان مطلوب' },
        { status: 400 }
      )
    }

    if (!inlineScript || !inlineScript.trim()) {
      return NextResponse.json(
        { error: 'كود JavaScript مطلوب' },
        { status: 400 }
      )
    }

    const network = await db.adNetwork.create({
      data: {
        name: name.trim(),
        type: 'inline',
        inlineScript: inlineScript.trim(),
        scriptUrl: null,
        zoneId: null,
        domain: null,
        async: true,
        defer: false,
        cfAsync: true,
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
      { error: 'حدث خطأ أثناء إنشاء الإعلان' },
      { status: 500 }
    )
  }
}
