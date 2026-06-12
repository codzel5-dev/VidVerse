import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const videos = await db.video.findMany({
      where: {
        isPublished: true,
        isFeatured: true,
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
        _count: {
          select: { likes: true, comments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    return NextResponse.json({ videos })
  } catch (error) {
    console.error('Get featured videos error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب الفيديوهات المميزة' },
      { status: 500 }
    )
  }
}
