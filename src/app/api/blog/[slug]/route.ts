import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/blog/SLUG
 * Returns a single published post, increments views, and 4 related posts.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const post = await db.blogPost.findUnique({
      where: { slug },
      include: {
        author: { select: { id: true, name: true, avatar: true, bio: true } },
        tags: {
          select: {
            tag: { select: { id: true, name: true, slug: true } },
          },
          orderBy: { tag: { name: 'asc' } },
        },
      },
    })

    if (!post || post.status !== 'published') {
      return NextResponse.json(
        { error: 'المقال غير موجود' },
        { status: 404 }
      )
    }

    const tagIds = post.tags.map((pt) => pt.tag.id)

    // Increment views atomically + fetch related posts in parallel
    const [related] = await Promise.all([
      (async () => {
        // First try: posts sharing at least one tag with current post
        let relatedPosts: Array<{
          id: string
          title: string
          slug: string
          coverImage: string | null
          createdAt: Date
          readingTime: number
        }> = []

        if (tagIds.length > 0) {
          relatedPosts = await db.blogPost.findMany({
            where: {
              status: 'published',
              id: { not: post.id },
              tags: { some: { tagId: { in: tagIds } } },
            },
            select: {
              id: true,
              title: true,
              slug: true,
              coverImage: true,
              createdAt: true,
              readingTime: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 4,
          })
        }

        // Fallback: fill remaining slots with any other published posts
        if (relatedPosts.length < 4) {
          const excludeIds = [post.id, ...relatedPosts.map((p) => p.id)]
          const fillers = await db.blogPost.findMany({
            where: {
              status: 'published',
              id: { notIn: excludeIds },
            },
            select: {
              id: true,
              title: true,
              slug: true,
              coverImage: true,
              createdAt: true,
              readingTime: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 4 - relatedPosts.length,
          })
          relatedPosts = [...relatedPosts, ...fillers]
        }

        return relatedPosts
      })(),
      db.blogPost.update({
        where: { id: post.id },
        data: { views: { increment: 1 } },
      }),
    ])

    const postFull = {
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      coverImage: post.coverImage,
      status: post.status,
      featured: post.featured,
      views: post.views + 1, // reflect the increment just performed
      readingTime: post.readingTime,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: post.author,
      tags: post.tags.map((pt) => pt.tag),
    }

    return NextResponse.json({ post: postFull, related })
  } catch (error) {
    console.error('Get blog post error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب المقال' },
      { status: 500 }
    )
  }
}
