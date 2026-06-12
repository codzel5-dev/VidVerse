import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')

    if (!q) {
      return NextResponse.json(
        { error: 'يرجى إدخال كلمة بحث' },
        { status: 400 }
      )
    }

    const skip = (page - 1) * limit

    const where = {
      isPublished: true,
      OR: [
        { title: { contains: q } },
        { description: { contains: q } },
        {
          videoTags: {
            some: {
              tag: {
                OR: [
                  { name: { contains: q } },
                  { slug: { contains: q } },
                ],
              },
            },
          },
        },
      ],
    }

    const [videos, total] = await Promise.all([
      db.video.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, avatar: true },
          },
          category: {
            select: { id: true, name: true, slug: true },
          },
          videoTags: {
            include: {
              tag: { select: { id: true, name: true, slug: true } },
            },
          },
          _count: {
            select: { likes: true, comments: true },
          },
        },
        orderBy: { views: 'desc' },
        skip,
        take: limit,
      }),
      db.video.count({ where }),
    ])

    return NextResponse.json({
      videos,
      query: q,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Search videos error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء البحث' },
      { status: 500 }
    )
  }
}
