import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { seekStreaming } from '@/lib/seekstreaming'

export async function GET() {
  try {
    const uploadInfo = await seekStreaming.getUploadEndpoint()

    return NextResponse.json({
      tusUrl: uploadInfo.tusUrl,
      accessToken: uploadInfo.accessToken,
    })
  } catch (error) {
    console.error('Get upload endpoint error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب معلومات الرفع' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'غير مصرح به' }, { status: 401 })
    }

    const body = await request.json()
    const { seekVideoId, title, description, categoryId, isFree, tagIds } = body

    if (!seekVideoId) {
      return NextResponse.json(
        { error: 'معرف فيديو SeekStreaming مطلوب' },
        { status: 400 }
      )
    }

    // Fetch video details from SeekStreaming
    const seekVideo = await seekStreaming.getVideoDetail(seekVideoId)

    // Get or create a player for embedding
    const embedUrl = seekStreaming.getEmbedUrl(seekVideoId)

    const slug = (title || seekVideo.name)
      .toLowerCase()
      .replace(/[^\w\s\u0600-\u06FF]/g, '')
      .replace(/\s+/g, '-')
      .concat('-', Date.now().toString(36))

    const video = await db.video.create({
      data: {
        title: title || seekVideo.name,
        slug,
        description: description || '',
        thumbnail: seekVideo.poster || null,
        duration: seekVideo.duration || 0,
        isFree: isFree ?? true,
        isPublished: false,
        seekVideoId,
        seekStatus: seekVideo.status,
        embedUrl,
        categoryId,
        userId,
        videoTags: tagIds
          ? {
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

    return NextResponse.json({ video }, { status: 201 })
  } catch (error) {
    console.error('Sync video error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء مزامنة الفيديو' },
      { status: 500 }
    )
  }
}
