import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

/**
 * GET /api/blog?limit=9&offset=0&tag=TAG_SLUG&q=SEARCH
 * Returns published blog posts with pagination, optional tag filter, and search.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '9')))
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0'))
    const tag = searchParams.get('tag')?.trim() || null
    const q = searchParams.get('q')?.trim() || null

    const where: Prisma.BlogPostWhereInput = { status: 'published' }

    if (tag) {
      where.tags = { some: { tag: { slug: tag } } }
    }

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { excerpt: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } },
      ]
    }

    const [posts, total, allTags] = await Promise.all([
      db.blogPost.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          coverImage: true,
          featured: true,
          views: true,
          readingTime: true,
          createdAt: true,
          author: { select: { id: true, name: true, avatar: true } },
          tags: {
            select: {
              tag: { select: { id: true, name: true, slug: true } },
            },
            orderBy: { tag: { name: 'asc' } },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      db.blogPost.count({ where }),
      db.blogTag.findMany({
        where: {
          posts: { some: { post: { status: 'published' } } },
        },
        select: {
          id: true,
          name: true,
          slug: true,
          posts: {
            where: { post: { status: 'published' } },
            select: { postId: true },
          },
        },
        orderBy: { name: 'asc' },
      }),
    ])

    // Only expose tags actually linked to at least one published post.
    // Orphan tags (e.g. malformed comma-separated strings accidentally saved
    // as a single tag) would otherwise pollute the filter pills bar.
    const tags = allTags
      .filter((t) => t.posts.length > 0)
      .map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        count: t.posts.length,
      }))

    // Flatten tags relation into a plain array for each post
    const mappedPosts = posts.map((p) => ({
      ...p,
      tags: p.tags.map((pt) => pt.tag),
    }))

    return NextResponse.json({ posts: mappedPosts, total, tags })
  } catch (error) {
    console.error('List blog posts error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب مقالات المدونة' },
      { status: 500 }
    )
  }
}
