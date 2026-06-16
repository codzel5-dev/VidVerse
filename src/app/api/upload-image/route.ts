import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'

/**
 * Build a direct CDN image URL from the upload service response.
 * Prefers jsDelivr with commit SHA for a stable, immutable URL.
 * Falls back to raw.githubusercontent / github.com blob URLs.
 */
function buildImageUrl(uploadData: {
  url?: string
  filename?: string
  commit_sha?: string
  urls?: {
    jsdelivr_commit?: string
    jsdelivr?: string
    raw_commit?: string
    raw?: string
    github_commit?: string
    github?: string
  }
}): string {
  const urls = uploadData.urls || {}

  // 1) Best: jsDelivr pinned to a specific commit (immutable + CDN cached)
  if (urls.jsdelivr_commit) return urls.jsdelivr_commit

  // 2) Top-level url (some responses already include a CDN URL)
  if (uploadData.url && /^https?:\/\/(cdn\.jsdelivr\.net|raw\.githubusercontent\.com)\//.test(uploadData.url)) {
    return uploadData.url
  }

  // 3) Construct jsDelivr URL with commit SHA manually
  if (uploadData.filename && uploadData.commit_sha) {
    const owner = process.env.GITHUB_OWNER
    const repo = process.env.GITHUB_REPO
    if (owner && repo) {
      // filename may already include the folder path (e.g. "uploads/image.png")
      const cleanFilename = uploadData.filename.replace(/^\/+/, '')
      return `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${uploadData.commit_sha}/${cleanFilename}`
    }
  }

  // 4) Raw URL with commit SHA
  if (urls.raw_commit) return urls.raw_commit

  // 5) Raw URL (branch-based, may change if file is overwritten)
  if (urls.raw) return urls.raw

  // 6) jsDelivr branch-based
  if (urls.jsdelivr) return urls.jsdelivr

  throw new Error('No valid direct image URL returned from upload service')
}

/**
 * Save the uploaded image to disk temporarily before re-uploading to picser.
 * picser.pages.dev expects a multipart/form-data with a File-like field.
 */
async function saveTempFile(
  buffer: Buffer,
  originalName: string,
  mimetype: string
): Promise<{ path: string; cleanup: () => Promise<void> }> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'img-upload-'))
  const ext = path.extname(originalName) || `.${mimetype.split('/')[1] || 'jpg'}`
  const filename = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`
  const filePath = path.join(tmpDir, filename)
  await fs.writeFile(filePath, buffer)
  return {
    path: filePath,
    cleanup: async () => {
      try {
        await fs.rm(tmpDir, { recursive: true, force: true })
      } catch {
        // ignore
      }
    },
  }
}

export async function POST(request: NextRequest) {
  let tempFileCleanup: (() => Promise<void>) | null = null

  try {
    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      return NextResponse.json(
        { success: false, error: 'يجب إرسال البيانات بصيغة multipart/form-data' },
        { status: 400 }
      )
    }
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: 'لم يتم إرسال أي ملف صورة' },
        { status: 400 }
      )
    }

    // Validate type & size
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'الملف يجب أن يكون صورة' },
        { status: 400 }
      )
    }

    const MAX_SIZE = 8 * 1024 * 1024 // 8 MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `حجم الصورة يجب ألا يتجاوز ${MAX_SIZE / (1024 * 1024)} ميجابايت`,
        },
        { status: 400 }
      )
    }

    // Required env vars
    const githubToken = process.env.GITHUB_TOKEN
    const githubOwner = process.env.GITHUB_OWNER
    const githubRepo = process.env.GITHUB_REPO
    const githubBranch = process.env.GITHUB_BRANCH || 'main'
    const uploadFolder = process.env.UPLOAD_FOLDER || 'uploads'
    const picserUrl =
      process.env.PICSER_UPLOAD_URL || 'https://picser.pages.dev/api/public-upload'

    if (!githubToken || !githubOwner || !githubRepo) {
      console.error('[upload-image] Missing GitHub env vars')
      return NextResponse.json(
        { success: false, error: 'إعدادات الرفع غير مكتملة على السيرفر' },
        { status: 500 }
      )
    }

    // Save file temporarily (picser needs a File we can re-send)
    const buffer = Buffer.from(await file.arrayBuffer())
    const tempFile = await saveTempFile(buffer, file.name, file.type)
    tempFileCleanup = tempFile.cleanup

    // Build upstream multipart form
    const upstreamForm = new FormData()
    const fileBuffer = await fs.readFile(tempFile.path)

    // Create a Blob with the correct mime type so the upstream service keeps the extension
    const blob = new Blob([fileBuffer], { type: file.type })
    upstreamForm.append('file', blob, file.name)
    upstreamForm.append('github_token', githubToken)
    upstreamForm.append('github_owner', githubOwner)
    upstreamForm.append('github_repo', githubRepo)
    upstreamForm.append('github_branch', githubBranch)
    upstreamForm.append('folder', uploadFolder)

    // Forward to picser.pages.dev (server-side, no CORS, no token leak)
    const upstreamRes = await fetch(picserUrl, {
      method: 'POST',
      body: upstreamForm,
    })

    const rawText = await upstreamRes.text()

    let result: unknown = null
    try {
      result = JSON.parse(rawText)
    } catch {
      console.error(
        '[upload-image] Non-JSON response from picser:',
        rawText.slice(0, 500)
      )
      return NextResponse.json(
        { success: false, error: 'استجابة غير صالحة من خدمة الرفع' },
        { status: 502 }
      )
    }

    if (!upstreamRes.ok) {
      const errMsg =
        (result as { message?: string; error?: string }).message ||
        (result as { error?: string }).error ||
        `فشل الرفع (${upstreamRes.status})`
      console.error('[upload-image] Upstream error:', errMsg)
      return NextResponse.json(
        { success: false, error: errMsg },
        { status: upstreamRes.status }
      )
    }

    // picser may return either { success, url, urls, ... } or { success, data: {...} }
    const resultObj = result as Record<string, unknown>
    const uploadData =
      resultObj.data && typeof resultObj.data === 'object'
        ? (resultObj.data as Parameters<typeof buildImageUrl>[0])
        : (resultObj as Parameters<typeof buildImageUrl>[0])

    let imageUrl: string
    try {
      imageUrl = buildImageUrl(uploadData)
    } catch (e) {
      console.error(
        '[upload-image] Failed to build image URL:',
        e,
        JSON.stringify(uploadData).slice(0, 500)
      )
      return NextResponse.json(
        { success: false, error: 'تعذر بناء رابط الصورة المباشر' },
        { status: 502 }
      )
    }

    return NextResponse.json({
      success: true,
      image: {
        url: imageUrl,
        filename: uploadData.filename || file.name,
        commitSha: uploadData.commit_sha || null,
        mimeType: uploadData.type || file.type,
        size: uploadData.size || file.size,
      },
    })
  } catch (error) {
    console.error('[upload-image] Unhandled error:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'حدث خطأ أثناء رفع الصورة',
      },
      { status: 500 }
    )
  } finally {
    if (tempFileCleanup) {
      await tempFileCleanup()
    }
  }
}
