import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const {
      title,
      description,
      thumbnail,
      duration = 0,
      isFree = true,
      isPublished = false,
      isFeatured = false,
      categoryId,
      hostVideoId,
      embedUrl,
      tagIds = [],
    } = body

    if (!title) {
      return NextResponse.json(
        { error: 'عنوان الفيديو مطلوب' },
        { status: 400 }
      )
    }

    // Check if hostVideoId already exists
    if (hostVideoId) {
      const existingVideo = await db.video.findUnique({
        where: { hostVideoId },
      })
      if (existingVideo) {
        return NextResponse.json(
          { error: 'هذا الفيديو موجود مسبقاً' },
          { status: 409 }
        )
      }
    }

    // Generate unique slug
    const baseSlug = slugify(title)
    let slug = baseSlug
    let slugAttempts = 0
    while (slugAttempts < 100) {
      const existing = await db.video.findUnique({ where: { slug } })
      if (!existing) break
      slug = `${baseSlug}-${Date.now().toString(36).slice(-4)}`
      slugAttempts++
    }

    // Generate share code
    const shareCode = await generateUniqueShareCode()

    // Create video record
    const video = await db.video.create({
      data: {
        title,
        slug,
        shareCode,
        description: description || null,
        thumbnail: thumbnail || null,
        duration,
        isFree,
        isPublished,
        isFeatured,
        hostVideoId: hostVideoId || null,
        embedUrl: embedUrl || null,
        categoryId: categoryId || null,
        userId: user.id,
        videoTags: tagIds.length > 0
          ? {
              create: tagIds.map((tagId: string) => ({
                tagId,
              })),
            }
          : undefined,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        category: { select: { id: true, name: true } },
        videoTags: {
          include: {
            tag: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    })

    return NextResponse.json({ video }, { status: 201 })
  } catch (error) {
    console.error('Admin create video error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء الفيديو' },
      { status: 500 }
    )
  }
}
