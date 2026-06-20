import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { slugify, tagSlug, estimateReadingTime, buildExcerpt } from '@/lib/blog-utils'

async function checkAdmin(userId: string | null) {
  if (!userId) return false
  const user = await db.user.findUnique({ where: { id: userId } })
  return user?.role === 'admin'
}

/** Ensure slug uniqueness (excluding the post currently being edited). */
async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const candidate = slugify(base) || `post-${Date.now().toString(36)}`
  let slug = candidate
  let n = 2
  while (true) {
    const existing = await db.blogPost.findUnique({ where: { slug } })
    if (!existing || existing.id === excludeId) return slug
    slug = `${candidate}-${n}`
    n++
  }
}

/** Find-or-create BlogTag records by name. */
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
 * GET /api/blog/admin/ID — single post with full content + tags.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!(await checkAdmin(userId))) {
      return NextResponse.json(
        { error: 'صلاحيات المسؤول مطلوبة' },
        { status: 403 }
      )
    }

    const { id } = await params
    const post = await db.blogPost.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        tags: {
          select: { tag: { select: { id: true, name: true, slug: true } } },
          orderBy: { tag: { name: 'asc' } },
        },
      },
    })

    if (!post) {
      return NextResponse.json(
        { error: 'المقال غير موجود' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      post: {
        ...post,
        tags: post.tags.map((pt) => pt.tag),
      },
    })
  } catch (error) {
    console.error('Admin get blog post error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب المقال' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/blog/admin/ID — update post fields.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!(await checkAdmin(userId))) {
      return NextResponse.json(
        { error: 'صلاحيات المسؤول مطلوبة' },
        { status: 403 }
      )
    }

    const { id } = await params
    const existing = await db.blogPost.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'المقال غير موجود' },
        { status: 404 }
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
      slug,
      tags,
    } = body as {
      title?: string
      content?: string
      excerpt?: string
      coverImage?: string | null
      status?: string
      featured?: boolean
      slug?: string
      tags?: string[]
    }

    const data: Prisma.BlogPostUpdateInput = {}

    if (title !== undefined && title.trim() !== existing.title) {
      data.title = title.trim()
      // Regenerate slug only if slug is NOT explicitly provided
      if (slug === undefined) {
        data.slug = await uniqueSlug(title, id)
      }
    }

    if (slug !== undefined) {
      const cleaned = slug.trim()
      if (cleaned && cleaned !== existing.slug) {
        data.slug = await uniqueSlug(cleaned, id)
      }
    }

    const contentChanged =
      content !== undefined && content !== existing.content

    if (content !== undefined) {
      data.content = content
    }

    // Auto-compute readingTime + excerpt when content changes
    // (unless explicitly provided by caller)
    if (contentChanged) {
      data.readingTime = estimateReadingTime(content as string)
      if (excerpt === undefined) {
        data.excerpt = buildExcerpt(content as string)
      }
    }

    if (excerpt !== undefined) {
      data.excerpt = excerpt?.trim() || null
    }
    if (coverImage !== undefined) {
      data.coverImage = coverImage?.trim() || null
    }
    if (status !== undefined) {
      data.status = status === 'draft' ? 'draft' : 'published'
    }
    if (featured !== undefined) {
      data.featured = featured
    }

    // Sync tags: استبدال الروابط الحالية بالقائمة الجديدة دفعة واحدة.
    // ملاحظة: لا نستخدم `set: []` + `connectOrCreate` معاً لأن ذلك يسبب
    // خطأ Prisma P2014 (violates required relation) عند تحديث الـ slug
    // في نفس المعاملة. بدلاً من ذلك نمرّر القائمة الجديدة إلى `set` مباشرة.
    if (tags !== undefined) {
      const tagRecords = tags.length > 0 ? await resolveTags(tags) : []
      data.tags = {
        set: tagRecords.map((t) => ({
          postId_tagId: { postId: id, tagId: t.id },
        })),
      }
    }

    const post = await db.blogPost.update({
      where: { id },
      data,
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        tags: {
          select: { tag: { select: { id: true, name: true, slug: true } } },
          orderBy: { tag: { name: 'asc' } },
        },
      },
    })

    return NextResponse.json({
      post: {
        ...post,
        tags: post.tags.map((pt) => pt.tag),
      },
    })
  } catch (error) {
    console.error('Admin update blog post error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحديث المقال' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/blog/admin/ID — delete post (cascades to BlogPostTag).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!(await checkAdmin(userId))) {
      return NextResponse.json(
        { error: 'صلاحيات المسؤول مطلوبة' },
        { status: 403 }
      )
    }

    const { id } = await params
    const existing = await db.blogPost.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'المقال غير موجود' },
        { status: 404 }
      )
    }

    await db.blogPost.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin delete blog post error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف المقال' },
      { status: 500 }
    )
  }
}
