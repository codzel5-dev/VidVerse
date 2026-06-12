import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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

    const existingEnrollment = await db.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    })

    if (existingEnrollment) {
      return NextResponse.json(
        { error: 'أنت مسجل بالفعل في هذا الكورس' },
        { status: 409 }
      )
    }

    // Create order
    const order = await db.order.create({
      data: {
        userId,
        courseId,
        amount: course.price,
        currency: course.currency,
        status: course.price === 0 ? 'completed' : 'pending',
      },
    })

    // Create enrollment
    const enrollment = await db.enrollment.create({
      data: {
        userId,
        courseId,
        progress: 0,
      },
    })

    // Log activity
    await db.activity.create({
      data: {
        type: 'enroll',
        userId,
        metadata: JSON.stringify({ courseId, courseTitle: course.title }),
      },
    })

    return NextResponse.json({ enrollment, order }, { status: 201 })
  } catch (error) {
    console.error('Enroll error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء التسجيل في الكورس' },
      { status: 500 }
    )
  }
}
