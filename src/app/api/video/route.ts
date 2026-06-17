import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'
import crypto from 'crypto'

const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

function generateShareCode(): string {
  const bytes = crypto.randomBytes(8)
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += CHARSET[bytes[i] % CHARSET.length]
  }
  return code
}

async function generateUniqueShareCode(): Promise<string> {
  let code = generateShareCode()
  let attempts = 0
  while (attempts < 100) {
    const existing = await db.video.findUnique({ where: { shareCode: code } })
    if (!existing) return code
    code = generateShareCode()
    attempts++
  }
  return generateShareCode() + Date.now().toString(36).slice(-4)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const categoryId = searchParams.get('category')
    const search = searchParams.get('search')
    const sort = searchParams.get('sort') || 'newest'
    const isFree = searchParams.get('free')
    const userId = searchParams.get('userId')

    const skip = (page - 1) * limit

    const where: Prisma.VideoWhereInput = {}

    // إذا طُلب فلتر userId، نرجع فيديوهات هذا المستخدم فقط (منشورة أو لا)
    // هذا يُستخدم في صفحة "فيديوهاتي" لعرض ما رفعه المستخدم نفسه
    if (userId) {
      where.userId = userId
    } else {
      // الوضع الافتراضي: فقط الفيديوهات المنشورة للجميع
      where.isPublished = true
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ]
    }

    if (isFree === 'true') {
      where.isFree = true
    }

    let orderBy: Prisma.VideoOrderByWithRelationInput = { createdAt: 'desc' }
    if (sort === 'oldest') orderBy = { createdAt: 'asc' }
    if (sort === 'popular') orderBy = { views: 'desc' }
    if (sort === 'title') orderBy = { title: 'asc' }

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
        orderBy,
        skip,
        take: limit,
      }),
      db.video.count({ where }),
    ])

    return NextResponse.json({
      videos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('List videos error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب الفيديوهات' },
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
      duration,
      isFree,
      isPublished,
      isFeatured,
      categoryId,
      hostVideoId,
      embedUrl,
      tagIds,
    } = body

    if (!title) {
      return NextResponse.json(
        { error: 'عنوان الفيديو مطلوب' },
        { status: 400 }
      )
    }

    const slug = title
      .toLowerCase()
      .replace(/[^\w\s\u0600-\u06FF]/g, '')
      .replace(/\s+/g, '-')
      .concat('-', Date.now().toString(36))

    const shareCode = await generateUniqueShareCode()

    const video = await db.video.create({
      data: {
        title,
        slug,
        shareCode,
        description,
        thumbnail,
        duration: duration || 0,
        isFree: isFree ?? true,
        isPublished: isPublished ?? false,
        isFeatured: isFeatured ?? false,
        categoryId,
        userId,
        hostVideoId,
        embedUrl,
        videoTags: tagIds
          ? {
              create: tagIds.map((tagId: string) => ({ tagId })),
            }
          : undefined,
      },
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
      },
    })

    return NextResponse.json({ video }, { status: 201 })
  } catch (error) {
    console.error('Create video error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء الفيديو' },
      { status: 500 }
    )
  }
}
