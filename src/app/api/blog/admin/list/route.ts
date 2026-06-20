import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { slugify, tagSlug, estimateReadingTime, buildExcerpt } from '@/lib/blog-utils'

async function checkAdmin(userId: string | null) {
  if (!userId) return false
  const user = await db.user.findUnique({ where: { id: userId } })
  return user?.role === 'admin'
}

/** Ensure slug uniqueness by appending -2, -3, ... when needed. */
async function uniqueSlug(base: string): Promise<string> {
  const candidate = slugify(base) || `post-${Date.now().toString(36)}`
  let slug = candidate
  let n = 2
  while (await db.blogPost.findUnique({ where: { slug } })) {
    slug = `${candidate}-${n}`
    n++
  }
  return slug
}

/** Find-or-create BlogTag records by name. Returns the resolved tag records. */
async function resolveTags(names: string[]) {
  const cleaned = Array.from(
    new Set(names.map((n) => n.trim()).filter(Boolean))
  )
  const records = await Promise.all(
    cleaned.map(async (name) => {
      const slug = tagSlug(name)
      return db.blogTag.upsert({
        where: { slug },
        create: { name, slug },
        update: {},
        select: { id: true, name: true, slug: true },
      })
    })
  )
  return records
}

/**
 * GET /api/blog/admin/list
 * All posts (drafts + published), ordered by updatedAt DESC.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!(await checkAdmin(userId))) {
      return NextResponse.json(
        { error: 'صلاحيات المسؤول مطلوبة' },
        { status: 403 }
      )
    }

    const posts = await db.blogPost.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        status: true,
        featured: true,
        views: true,
        readingTime: true,
        createdAt: true,
        updatedAt: true,
        author: { select: { id: true, name: true } },
        _count: { select: { tags: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({ posts })
  } catch (error) {
    console.error('Admin list blog posts error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب مقالات المدونة' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/blog/admin/list
 * Create a new blog post.
 */
export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!(await checkAdmin(userId))) {
      return NextResponse.json(
        { error: 'صلاحيات المسؤول مطلوبة' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      title,
      content,
      excerpt,
      coverImage,
      status,
      featured,
      tags,
      authorId,
    } = body as {
      title?: string
      content?: string
      excerpt?: string
      coverImage?: string
      status?: string
      featured?: boolean
      tags?: string[]
      authorId?: string
    }

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'عنوان المقال مطلوب' },
        { status: 400 }
      )
    }
    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'محتوى المقال مطلوب' },
        { status: 400 }
      )
    }
    if (!authorId) {
      return NextResponse.json(
        { error: 'معرف الكاتب مطلوب' },
        { status: 400 }
      )
    }

    const author = await db.user.findUnique({ where: { id: authorId } })
    if (!author) {
      return NextResponse.json(
        { error: 'الكاتب غير موجود' },
        { status: 400 }
      )
    }

    const slug = await uniqueSlug(title)
    const readingTime = estimateReadingTime(content)
    const finalExcerpt =
      excerpt && excerpt.trim() ? excerpt.trim() : buildExcerpt(content)

    const tagRecords = tags && tags.length > 0 ? await resolveTags(tags) : []

    const data: Prisma.BlogPostCreateInput = {
      title: title.trim(),
      slug,
      excerpt: finalExcerpt,
      content,
      coverImage: coverImage?.trim() || null,
      status: status === 'draft' ? 'draft' : 'published',
      featured: featured ?? false,
      readingTime,
      author: { connect: { id: authorId } },
      tags: tagRecords.length
        ? { create: tagRecords.map((t) => ({ tagId: t.id })) }
        : undefined,
    }

    const post = await db.blogPost.create({
      data,
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        tags: {
          select: { tag: { select: { id: true, name: true, slug: true } } },
          orderBy: { tag: { name: 'asc' } },
        },
      },
    })

    return NextResponse.json(
      {
        post: {
          ...post,
          tags: post.tags.map((pt) => pt.tag),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create blog post error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء المقال' },
      { status: 500 }
    )
  }
}
