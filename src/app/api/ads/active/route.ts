import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/ads/active - Public endpoint
// Returns active ad networks for client-side injection (AdScriptsInjector).
// No auth required — this is called by the browser.
export async function GET() {
  try {
    const networks = await db.adNetwork.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        name: true,
        type: true,
        scriptUrl: true,
        inlineScript: true,
        async: true,
        defer: true,
        cfAsync: true,
        placement: true,
        order: true,
      },
    })

    return NextResponse.json({ networks })
  } catch (error) {
    console.error('List active ads error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب شبكات الإعلانات المُفعّلة' },
      { status: 500 }
    )
  }
}
