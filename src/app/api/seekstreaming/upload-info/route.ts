import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { SEEKSTREAMING_TUS_URL, SEEKSTREAMING_TUS_ACCESS_TOKEN } from '@/lib/seekstreaming'

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'غير مصرح به' }, { status: 401 })
    }
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'غير مصرح به' }, { status: 403 })
    }

    return NextResponse.json({
      tusUrl: SEEKSTREAMING_TUS_URL,
      accessToken: SEEKSTREAMING_TUS_ACCESS_TOKEN,
    })
  } catch (error) {
    console.error('Get upload info error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب معلومات الرفع' },
      { status: 500 }
    )
  }
}
