import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/banners - public: returns active banners (within date range)
export async function GET() {
  try {
    const now = new Date()

    const banners = await db.adBanner.findMany({
      where: {
        isActive: true,
        AND: [
          {
            OR: [{ startsAt: null }, { startsAt: { lte: now } }],
          },
          {
            OR: [{ endsAt: null }, { endsAt: { gte: now } }],
          },
        ],
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({ banners })
  } catch (error) {
    console.error('Public banners error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب البانرات' },
      { status: 500 }
    )
  }
}
