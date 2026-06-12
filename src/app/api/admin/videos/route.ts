import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

async function checkAdmin(userId: string | null) {
  if (!userId) return false
  const user = await db.user.findUnique({ where: { id: userId } })
  return user?.role === 'admin'
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!await checkAdmin(userId)) {
      return NextResponse.json({ error: 'صلاحيات المسؤول مطلوبة' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const skip = (page - 1) * limit

    const where: Prisma.VideoWhereInput = {}
    if (status === 'published') where.isPublished = true
    if (status === 'unpublished') where.isPublished = false
    if (status === 'featured') where.isFeatured = true

    const [videos, total] = await Promise.all([
      db.video.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, avatar: true, email: true } },
          category: { select: { id: true, name: true } },
          _count: { select: { likes: true, comments: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.video.count({ where }),
    ])

    return NextResponse.json({
      videos,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Admin list videos error:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب الفيديوهات' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!await checkAdmin(userId)) {
      return NextResponse.json({ error: 'صلاحيات المسؤول مطلوبة' }, { status: 403 })
    }

    const body = await request.json()
    const { id, isPublished, isFeatured } = body

    if (!id) {
      return NextResponse.json({ error: 'معرف الفيديو مطلوب' }, { status: 400 })
    }

    const data: Prisma.VideoUpdateInput = {}
    if (isPublished !== undefined) data.isPublished = isPublished
    if (isFeatured !== undefined) data.isFeatured = isFeatured

    const video = await db.video.update({
      where: { id },
      data,
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        category: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({ video })
  } catch (error) {
    console.error('Admin update video error:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء تحديث الفيديو' }, { status: 500 })
  }
}
