import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { seekStreaming } from '@/lib/seekstreaming'

export const maxDuration = 300 // 5 minutes for large uploads

function base64Encode(str: string): string {
  return Buffer.from(str).toString('base64')
}

/**
 * Server-side TUS upload to SeekStreaming
 * This avoids the CORS issue that occurs when the browser tries to upload
 * directly to SeekStreaming.
 *
 * Per SeekStreaming API docs:
 * - Call GET /api/v1/video/upload to get the dynamic TUS URL and access token
 * - Pass accessToken, filename, filetype in the Upload-Metadata header (NOT Authorization)
 * - Access token is valid for 2 hours; TUS chunk size should be 52,428,800 bytes
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin role
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'غير مصرح به' }, { status: 401 })
    }
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'غير مصرح به' }, { status: 403 })
    }

    // Parse FormData
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const fileName = formData.get('fileName') as string | null
    const fileType = formData.get('fileType') as string | null

    if (!file) {
      return NextResponse.json({ error: 'ملف الفيديو مطلوب' }, { status: 400 })
    }

    const fileSize = file.size
    const name = fileName || file.name || 'video.mp4'
    const type = fileType || file.type || 'video/mp4'

    console.log(`[TUS Upload] Starting upload: ${name} (${(fileSize / 1024 / 1024).toFixed(2)} MB)`)

    // Step 0: Get dynamic TUS upload endpoint and access token from SeekStreaming API
    const uploadInfo = await seekStreaming.getUploadEndpoint()
    const tusUrl = (uploadInfo as Record<string, unknown>).tusUrl as string
    const accessToken = (uploadInfo as Record<string, unknown>).accessToken as string

    if (!tusUrl || !accessToken) {
      console.error('[TUS Upload] Failed to get TUS endpoint info:', uploadInfo)
      return NextResponse.json(
        { error: 'فشل الحصول على معلومات رفع الفيديو من SeekStreaming' },
        { status: 502 }
      )
    }

    console.log(`[TUS Upload] TUS URL: ${tusUrl}, Access Token obtained`)

    // Step 1: Create TUS upload session
    // Per docs: accessToken, filename, filetype must be in Upload-Metadata header
    const metadataParts = [
      `filename ${base64Encode(name)}`,
      `filetype ${base64Encode(type)}`,
      `accessToken ${base64Encode(accessToken)}`,
    ]

    const createResponse = await fetch(tusUrl, {
      method: 'POST',
      headers: {
        'Tus-Resumable': '1.0.0',
        'Upload-Length': String(fileSize),
        'Upload-Metadata': metadataParts.join(','),
        'Content-Length': '0',
      },
    })

    if (createResponse.status !== 201 && createResponse.status !== 200) {
      const errorText = await createResponse.text()
      console.error('[TUS Upload] Failed to create session:', createResponse.status, errorText)
      return NextResponse.json(
        { error: `فشل إنشاء جلسة الرفع: ${createResponse.status}` },
        { status: 502 }
      )
    }

    // Get upload URL from Location header
    const location = createResponse.headers.get('Location')
    if (!location) {
      console.error('[TUS Upload] No Location header in create response')
      return NextResponse.json(
        { error: 'لم يتم الحصول على رابط الرفع من SeekStreaming' },
        { status: 502 }
      )
    }

    // Resolve the upload URL (could be relative or absolute)
    const uploadUrl = location.startsWith('http')
      ? location
      : `${tusUrl.replace(/\/$/, '')}${location.startsWith('/') ? '' : '/'}${location}`

    console.log(`[TUS Upload] Upload URL: ${uploadUrl}`)

    // Extract video ID from upload URL
    const seekVideoId = uploadUrl.split('/').pop()
    if (!seekVideoId) {
      console.error('[TUS Upload] Could not extract video ID from upload URL')
      return NextResponse.json(
        { error: 'لم يتم الحصول على معرف الفيديو' },
        { status: 502 }
      )
    }

    // Step 2: Upload file data using PATCH with chunked streaming
    // Per docs: chunkSize should be 52,428,800 bytes (50MB)
    const CHUNK_SIZE = 50 * 1024 * 1024 // 50MB as recommended by SeekStreaming
    let offset = 0
    const arrayBuffer = await file.arrayBuffer()
    const totalBytes = arrayBuffer.byteLength

    while (offset < totalBytes) {
      const end = Math.min(offset + CHUNK_SIZE, totalBytes)
      const chunk = arrayBuffer.slice(offset, end)

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PATCH',
        headers: {
          'Tus-Resumable': '1.0.0',
          'Content-Type': 'application/offset+octet-stream',
          'Upload-Offset': String(offset),
          'Upload-Metadata': `accessToken ${base64Encode(accessToken)}`,
          'Content-Length': String(chunk.byteLength),
        },
        body: chunk,
      })

      if (uploadResponse.status !== 204 && uploadResponse.status !== 200) {
        const errorText = await uploadResponse.text()
        console.error(`[TUS Upload] Failed to upload chunk at offset ${offset}:`, uploadResponse.status, errorText)
        return NextResponse.json(
          { error: `فشل رفع جزء من الفيديو عند البايت ${offset}` },
          { status: 502 }
        )
      }

      offset = end
      console.log(`[TUS Upload] Uploaded chunk: ${offset}/${totalBytes} (${Math.round((offset / totalBytes) * 100)}%)`)
    }

    console.log(`[TUS Upload] Upload complete! Video ID: ${seekVideoId}`)

    return NextResponse.json({
      seekVideoId,
      uploadUrl,
      size: fileSize,
    }, { status: 201 })

  } catch (error) {
    console.error('[TUS Upload] Error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء رفع الفيديو' },
      { status: 500 }
    )
  }
}
