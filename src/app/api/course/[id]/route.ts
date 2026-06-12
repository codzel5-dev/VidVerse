import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const course = await db.course.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, avatar: true, bio: true },
        },
        category: {
          select: { id: true, name: true, slug: true },
        },
        courseTags: {
          include: {
            tag: { select: { id: true, name: true, slug: true } },
          },
        },
        lessons: {
          orderBy: { order: 'asc' },
          include: {
            video: {
              select: {
                id: true,
                title: true,
                duration: true,
                thumbnail: true,
                isFree: true,
              },
            },
          },
        },
        enrollments: {
          select: { id: true, userId: true, progress: true, isCompleted: true },
        },
        _count: {
          select: { enrollments: true, lessons: true },
        },
      },
    })

    if (!course) {
      return NextResponse.json(
        { error: 'الكورس غير موجود' },
        { status: 404 }
      )
    }

    return NextResponse.json({ course })
  } catch (error) {
    console.error('Get course error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب الكورس' },
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

    const existing = await db.course.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'الكورس غير موجود' },
        { status: 404 }
      )
    }

    if (existing.userId !== userId) {
      const user = await db.user.findUnique({ where: { id: userId } })
      if (user?.role !== 'admin') {
        return NextResponse.json(
          { error: 'ليس لديك صلاحية تعديل هذا الكورس' },
          { status: 403 }
        )
      }
    }

    const { tagIds, ...data } = body

    if (data.title) {
      data.slug = data.title
        .toLowerCase()
        .replace(/[^\w\s\u0600-\u06FF]/g, '')
        .replace(/\s+/g, '-')
        .concat('-', Date.now().toString(36))
    }

    const course = await db.course.update({
      where: { id },
      data: {
        ...data,
        courseTags: tagIds
          ? {
              deleteMany: {},
              create: tagIds.map((tagId: string) => ({ tagId })),
            }
          : undefined,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        category: { select: { id: true, name: true, slug: true } },
        courseTags: {
          include: {
            tag: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    })

    return NextResponse.json({ course })
  } catch (error) {
    console.error('Update course error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحديث الكورس' },
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

    const existing = await db.course.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'الكورس غير موجود' },
        { status: 404 }
      )
    }

    if (existing.userId !== userId) {
      const user = await db.user.findUnique({ where: { id: userId } })
      if (user?.role !== 'admin') {
        return NextResponse.json(
          { error: 'ليس لديك صلاحية حذف هذا الكورس' },
          { status: 403 }
        )
      }
    }

    await db.course.delete({ where: { id } })

    return NextResponse.json({ message: 'تم حذف الكورس بنجاح' })
  } catch (error) {
    console.error('Delete course error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف الكورس' },
      { status: 500 }
    )
  }
}
