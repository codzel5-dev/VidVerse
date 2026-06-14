import { NextRequest, NextResponse } from 'next/server'
import { seekStreaming } from '@/lib/seekstreaming'

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'غير مصرح به' }, { status: 401 })
    }

    const body = await request.json()
    const { url, name } = body

    if (!url) {
      return NextResponse.json(
        { error: 'رابط الفيديو مطلوب' },
        { status: 400 }
      )
    }

    const result = await seekStreaming.createAdvanceUpload(url, name)

    return NextResponse.json({ task: result })
  } catch (error) {
    console.error('Advance upload error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء استيراد الفيديو' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'غير مصرح به' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')

    if (!taskId) {
      return NextResponse.json(
        { error: 'معرف المهمة مطلوب' },
        { status: 400 }
      )
    }

    const result = await seekStreaming.getAdvanceUploadDetail(taskId)

    return NextResponse.json({ task: result })
  } catch (error) {
    console.error('Get advance upload detail error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء التحقق من حالة الاستيراد' },
      { status: 500 }
    )
  }
}
