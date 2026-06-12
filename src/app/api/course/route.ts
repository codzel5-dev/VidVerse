import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const categoryId = searchParams.get('category')
    const level = searchParams.get('level')
    const search = searchParams.get('search')
    const sort = searchParams.get('sort') || 'newest'

    const skip = (page - 1) * limit

    const where: Prisma.CourseWhereInput = {
      isPublished: true,
    }

    if (categoryId) where.categoryId = categoryId
    if (level) where.level = level
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ]
    }

    let orderBy: Prisma.CourseOrderByWithRelationInput = { createdAt: 'desc' }
    if (sort === 'oldest') orderBy = { createdAt: 'asc' }
    if (sort === 'popular') orderBy = { enrollments: { _count: 'desc' } }
    if (sort === 'price-low') orderBy = { price: 'asc' }
    if (sort === 'price-high') orderBy = { price: 'desc' }

    const [courses, total] = await Promise.all([
      db.course.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, avatar: true },
          },
          category: {
            select: { id: true, name: true, slug: true },
          },
          courseTags: {
            include: {
              tag: { select: { id: true, name: true, slug: true } },
            },
          },
          _count: {
            select: { enrollments: true, lessons: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      db.course.count({ where }),
    ])

    return NextResponse.json({
      courses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('List courses error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب الكورسات' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'غير مصرح به' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      description,
      thumbnail,
      price,
      currency,
      level,
      isPublished,
      isFeatured,
      categoryId,
      tagIds,
    } = body

    if (!title) {
      return NextResponse.json(
        { error: 'عنوان الكورس مطلوب' },
        { status: 400 }
      )
    }

    const slug = title
      .toLowerCase()
      .replace(/[^\w\s\u0600-\u06FF]/g, '')
      .replace(/\s+/g, '-')
      .concat('-', Date.now().toString(36))

    const course = await db.course.create({
      data: {
        title,
        slug,
        description,
        thumbnail,
        price: price || 0,
        currency: currency || 'USD',
        level: level || 'beginner',
        isPublished: isPublished ?? false,
        isFeatured: isFeatured ?? false,
        categoryId,
        userId,
        courseTags: tagIds
          ? {
              create: tagIds.map((tagId: string) => ({ tagId })),
            }
          : undefined,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        category: { select: { id: true, name: true, slug: true } },
        courseTags: {
          include: {
            tag: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    })

    return NextResponse.json({ course }, { status: 201 })
  } catch (error) {
    console.error('Create course error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء الكورس' },
      { status: 500 }
    )
  }
}
