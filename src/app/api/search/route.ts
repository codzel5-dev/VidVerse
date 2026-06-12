import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''

    if (!q) {
      return NextResponse.json(
        { error: 'يرجى إدخال كلمة بحث' },
        { status: 400 }
      )
    }

    const [videos, courses, categories] = await Promise.all([
      db.video.findMany({
        where: {
          isPublished: true,
          OR: [
            { title: { contains: q } },
            { description: { contains: q } },
          ],
        },
        include: {
          user: { select: { id: true, name: true, avatar: true } },
          category: { select: { id: true, name: true, slug: true } },
          _count: { select: { likes: true, comments: true } },
        },
        take: 5,
      }),
      db.course.findMany({
        where: {
          isPublished: true,
          OR: [
            { title: { contains: q } },
            { description: { contains: q } },
          ],
        },
        include: {
          user: { select: { id: true, name: true, avatar: true } },
          category: { select: { id: true, name: true, slug: true } },
          _count: { select: { enrollments: true, lessons: true } },
        },
        take: 5,
      }),
      db.category.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: q } },
            { description: { contains: q } },
          ],
        },
        include: {
          _count: { select: { videos: true, courses: true } },
        },
        take: 5,
      }),
    ])

    return NextResponse.json({
      query: q,
      results: {
        videos,
        courses,
        categories,
      },
      totalResults: videos.length + courses.length + categories.length,
    })
  } catch (error) {
    console.error('Global search error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء البحث' },
      { status: 500 }
    )
  }
}
