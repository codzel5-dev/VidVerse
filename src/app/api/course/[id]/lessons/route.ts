import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params

    const course = await db.course.findUnique({
      where: { id: courseId },
    })

    if (!course) {
      return NextResponse.json(
        { error: 'الكورس غير موجود' },
        { status: 404 }
      )
    }

    const lessons = await db.lesson.findMany({
      where: { courseId },
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
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({ lessons })
  } catch (error) {
    console.error('List lessons error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب الدروس' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'غير مصرح به' }, { status: 401 })
    }

    const { id: courseId } = await params

    const course = await db.course.findUnique({
      where: { id: courseId },
    })

    if (!course) {
      return NextResponse.json(
        { error: 'الكورس غير موجود' },
        { status: 404 }
      )
    }

    if (course.userId !== userId) {
      const user = await db.user.findUnique({ where: { id: userId } })
      if (user?.role !== 'admin') {
        return NextResponse.json(
          { error: 'ليس لديك صلاحية إضافة دروس لهذا الكورس' },
          { status: 403 }
        )
      }
    }

    const body = await request.json()
    const { title, description, order, duration, videoId, isFree } = body

    if (!title) {
      return NextResponse.json(
        { error: 'عنوان الدرس مطلوب' },
        { status: 400 }
      )
    }

    const lessonCount = await db.lesson.count({
      where: { courseId },
    })

    const lesson = await db.lesson.create({
      data: {
        title,
        description,
        order: order ?? lessonCount + 1,
        duration: duration || 0,
        videoId,
        courseId,
        isFree: isFree ?? false,
      },
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
    })

    return NextResponse.json({ lesson }, { status: 201 })
  } catch (error) {
    console.error('Add lesson error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إضافة الدرس' },
      { status: 500 }
    )
  }
}
