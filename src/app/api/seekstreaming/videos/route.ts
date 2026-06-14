import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { seekStreaming } from '@/lib/seekstreaming'

export async function GET(request: NextRequest) {
  try {
    // Verify admin role
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'غير مصرح به' }, { status: 401 })
    }
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'غير مصرح به' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || undefined
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined
    const perPage = searchParams.get('perPage') ? parseInt(searchParams.get('perPage')!) : undefined
    const status = searchParams.get('status') || undefined

    const result = await seekStreaming.getVideoList({
      page,
      perPage,
      status,
      search,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Get SeekStreaming videos error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب فيديوهات SeekStreaming' },
      { status: 500 }
    )
  }
}
