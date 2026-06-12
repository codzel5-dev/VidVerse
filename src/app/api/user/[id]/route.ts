import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            videos: true,
            enrollments: true,
            savedVideos: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب بيانات المستخدم' },
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

    if (userId !== id) {
      const user = await db.user.findUnique({ where: { id: userId } })
      if (user?.role !== 'admin') {
        return NextResponse.json(
          { error: 'ليس لديك صلاحية تعديل هذا الحساب' },
          { status: 403 }
        )
      }
    }

    const body = await request.json()
    const { name, avatar, bio } = body

    const updatedUser = await db.user.update({
      where: { id },
      data: { name, avatar, bio },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        role: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحديث بيانات المستخدم' },
      { status: 500 }
    )
  }
}
