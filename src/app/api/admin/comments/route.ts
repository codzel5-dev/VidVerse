import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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
    const skip = (page - 1) * limit

    const [comments, total] = await Promise.all([
      db.comment.findMany({
        where: { isReported: true },
        include: {
          user: { select: { id: true, name: true, avatar: true, email: true } },
          video: { select: { id: true, title: true } },
          _count: { select: { likes: true, replies: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.comment.count({ where: { isReported: true } }),
    ])

    return NextResponse.json({
      comments,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Admin list reported comments error:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب التعليقات المبلغ عنها' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!await checkAdmin(userId)) {
      return NextResponse.json({ error: 'صلاحيات المسؤول مطلوبة' }, { status: 403 })
    }

    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'معرف التعليق مطلوب' }, { status: 400 })
    }

    await db.comment.delete({ where: { id } })

    return NextResponse.json({ message: 'تم حذف التعليق بنجاح' })
  } catch (error) {
    console.error('Admin delete comment error:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء حذف التعليق' }, { status: 500 })
  }
}
