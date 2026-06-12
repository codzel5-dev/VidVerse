import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'غير مصرح به' }, { status: 401 })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const skip = (page - 1) * limit

    if (userId !== id) {
      const user = await db.user.findUnique({ where: { id: userId } })
      if (user?.role !== 'admin') {
        return NextResponse.json(
          { error: 'غير مصرح به' },
          { status: 403 }
        )
      }
    }

    const [history, total] = await Promise.all([
      db.watchHistory.findMany({
        where: { userId: id },
        include: {
          video: {
            include: {
              user: { select: { id: true, name: true, avatar: true } },
              category: { select: { id: true, name: true, slug: true } },
              _count: { select: { likes: true, comments: true } },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      db.watchHistory.count({ where: { userId: id } }),
    ])

    return NextResponse.json({
      history,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get watch history error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب سجل المشاهدة' },
      { status: 500 }
    )
  }
}
