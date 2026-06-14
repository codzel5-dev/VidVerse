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
    const videoId = searchParams.get('videoId')

    if (!videoId) {
      return NextResponse.json(
        { error: 'معرف الفيديو مطلوب' },
        { status: 400 }
      )
    }

    const videoDetail = await seekStreaming.getVideoDetail(videoId)

    return NextResponse.json(videoDetail)
  } catch (error) {
    console.error('Get SeekStreaming video detail error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب تفاصيل الفيديو' },
      { status: 500 }
    )
  }
}
