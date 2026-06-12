import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Try to find by shareCode first (YouTube-style), then by regular id
    let video = await db.video.findUnique({
      where: { shareCode: id },
      include: {
        user: {
          select: { id: true, name: true, avatar: true, bio: true },
        },
        category: {
          select: { id: true, name: true, slug: true },
        },
        videoTags: {
          include: {
            tag: { select: { id: true, name: true, slug: true } },
          },
        },
        comments: {
          where: { parentId: null },
          include: {
            user: { select: { id: true, name: true, avatar: true } },
            replies: {
              include: {
                user: { select: { id: true, name: true, avatar: true } },
                likes: true,
              },
              orderBy: { createdAt: 'asc' },
            },
            likes: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        likes: true,
        ratings: {
          select: { score: true },
        },
        _count: {
          select: { likes: true, comments: true, savedBy: true },
        },
      },
    })

    // Fallback to regular id lookup
    if (!video) {
      video = await db.video.findUnique({
        where: { id },
        include: {
          user: {
            select: { id: true, name: true, avatar: true, bio: true },
          },
          category: {
            select: { id: true, name: true, slug: true },
          },
          videoTags: {
            include: {
              tag: { select: { id: true, name: true, slug: true } },
            },
          },
          comments: {
            where: { parentId: null },
            include: {
              user: { select: { id: true, name: true, avatar: true } },
              replies: {
                include: {
                  user: { select: { id: true, name: true, avatar: true } },
                  likes: true,
                },
                orderBy: { createdAt: 'asc' },
              },
              likes: true,
            },
            orderBy: { createdAt: 'desc' },
          },
          likes: true,
          ratings: {
            select: { score: true },
          },
          _count: {
            select: { likes: true, comments: true, savedBy: true },
          },
        },
      })
    }

    if (!video) {
      return NextResponse.json(
        { error: 'الفيديو غير موجود' },
        { status: 404 }
      )
    }

    const avgRating =
      video.ratings.length > 0
        ? video.ratings.reduce((sum, r) => sum + r.score, 0) / video.ratings.length
        : 0

    const likeCount = video.likes.filter((l) => l.type === 'like').length
    const dislikeCount = video.likes.filter((l) => l.type === 'dislike').length

    return NextResponse.json({
      video: {
        ...video,
        avgRating: Math.round(avgRating * 10) / 10,
        likeCount,
        dislikeCount,
      },
    })
  } catch (error) {
    console.error('Get video error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب الفيديو' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'غير مصرح به' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const existingVideo = await db.video.findUnique({ where: { id } })
    if (!existingVideo) {
      return NextResponse.json(
        { error: 'الفيديو غير موجود' },
        { status: 404 }
      )
    }

    if (existingVideo.userId !== userId) {
      return NextResponse.json(
        { error: 'ليس لديك صلاحية تعديل هذا الفيديو' },
        { status: 403 }
      )
    }

    const { tagIds, ...data } = body

    if (data.title) {
      data.slug = data.title
        .toLowerCase()
        .replace(/[^\w\s\u0600-\u06FF]/g, '')
        .replace(/\s+/g, '-')
        .concat('-', Date.now().toString(36))
    }

    const video = await db.video.update({
      where: { id },
      data: {
        ...data,
        videoTags: tagIds
          ? {
              deleteMany: {},
              create: tagIds.map((tagId: string) => ({ tagId })),
            }
          : undefined,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        category: { select: { id: true, name: true, slug: true } },
        videoTags: {
          include: {
            tag: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    })

    return NextResponse.json({ video })
  } catch (error) {
    console.error('Update video error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحديث الفيديو' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'غير مصرح به' }, { status: 401 })
    }

    const { id } = await params

    const existingVideo = await db.video.findUnique({ where: { id } })
    if (!existingVideo) {
      return NextResponse.json(
        { error: 'الفيديو غير موجود' },
        { status: 404 }
      )
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (existingVideo.userId !== userId && user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'ليس لديك صلاحية حذف هذا الفيديو' },
        { status: 403 }
      )
    }

    await db.video.delete({ where: { id } })

    return NextResponse.json({ message: 'تم حذف الفيديو بنجاح' })
  } catch (error) {
    console.error('Delete video error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف الفيديو' },
      { status: 500 }
    )
  }
}
