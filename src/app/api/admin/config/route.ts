import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Keys managed by the admin settings panel.
 * Stored in the SiteSettings table (key -> value), persisted across deployments.
 * Each key documents whether it's a secret (so the UI can mask it).
 */
export const CONFIG_KEYS = {
  GITHUB_TOKEN: {
    key: 'GITHUB_TOKEN',
    label: 'GitHub Token',
    category: 'image-upload',
    isSecret: true,
    description: 'Personal access token with repo write permission. Used to commit uploaded images.',
    placeholder: 'ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  },
  GITHUB_OWNER: {
    key: 'GITHUB_OWNER',
    label: 'GitHub Owner',
    category: 'image-upload',
    isSecret: false,
    description: 'Username or organization that owns the thumbnails repository.',
    placeholder: 'codzel4-dot',
  },
  GITHUB_REPO: {
    key: 'GITHUB_REPO',
    label: 'GitHub Repo',
    category: 'image-upload',
    isSecret: false,
    description: 'Name of the repository where uploaded images will be stored.',
    placeholder: 'thumbnails-final',
  },
  GITHUB_BRANCH: {
    key: 'GITHUB_BRANCH',
    label: 'GitHub Branch',
    category: 'image-upload',
    isSecret: false,
    description: 'Branch name to commit images to (default: main).',
    placeholder: 'main',
  },
  UPLOAD_FOLDER: {
    key: 'UPLOAD_FOLDER',
    label: 'Upload Folder',
    category: 'image-upload',
    isSecret: false,
    description: 'Folder path inside the repo where images will be stored.',
    placeholder: 'uploads',
  },
  PICSER_UPLOAD_URL: {
    key: 'PICSER_UPLOAD_URL',
    label: 'Picser Upload URL',
    category: 'image-upload',
    isSecret: false,
    description: 'Endpoint of the image upload service.',
    placeholder: 'https://picser.pages.dev/api/public-upload',
  },
} as const

export type ConfigKey = keyof typeof CONFIG_KEYS

async function checkAdmin(userId: string | null) {
  if (!userId) return false
  const user = await db.user.findUnique({ where: { id: userId } })
  return user?.role === 'admin'
}

/**
 * Read a single config value.
 * Priority: DB (SiteSettings) -> process.env -> empty string.
 */
export async function getConfigValue(key: string): Promise<string> {
  const setting = await db.siteSettings.findUnique({ where: { key } })
  if (setting?.value) return setting.value
  return process.env[key] || ''
}

/**
 * Read all image-upload config values at once.
 * Used by /api/upload-image to avoid N round trips.
 */
export async function getImageUploadConfig() {
  const keys = Object.keys(CONFIG_KEYS)
  const rows = await db.siteSettings.findMany({ where: { key: { in: keys } } })
  const dbMap = new Map(rows.map((r) => [r.key, r.value]))

  const result: Record<string, string> = {}
  for (const k of keys) {
    result[k] = dbMap.get(k) || process.env[k] || ''
  }
  return result
}

/**
 * GET /api/admin/config
 * Returns all config keys with current values + metadata.
 * Secrets are masked unless ?reveal=1 is passed (admin UI uses this to toggle visibility).
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!(await checkAdmin(userId))) {
      return NextResponse.json({ error: 'صلاحيات المسؤول مطلوبة' }, { status: 403 })
    }

    const reveal = request.nextUrl.searchParams.get('reveal') === '1'
    const config = await getImageUploadConfig()

    // Build a set of keys present in the DB so we can report the source without
    // making an extra round trip per key.
    const dbKeys = new Set(
      (await db.siteSettings.findMany({ where: { key: { in: Object.keys(CONFIG_KEYS) } } })).map(
        (r) => r.key
      )
    )

    const items = Object.values(CONFIG_KEYS).map((meta) => {
      const value = config[meta.key] || ''
      return {
        ...meta,
        value: meta.isSecret && !reveal && value ? maskSecret(value) : value,
        hasValue: Boolean(value),
        source: dbKeys.has(meta.key) ? 'db' : value ? 'env' : 'none',
      }
    })

    return NextResponse.json({ items })
  } catch (error) {
    console.error('[admin/config] GET error:', error)
    return NextResponse.json({ error: 'فشل تحميل الإعدادات' }, { status: 500 })
  }
}

/**
 * PUT /api/admin/config
 * Body: { settings: { GITHUB_TOKEN: '...', GITHUB_OWNER: '...', ... } }
 * Only keys defined in CONFIG_KEYS are accepted. Empty strings delete the DB row
 * (so the env var fallback kicks in again).
 */
export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!(await checkAdmin(userId))) {
      return NextResponse.json({ error: 'صلاحيات المسؤول مطلوبة' }, { status: 403 })
    }

    const body = await request.json()
    const settings: Record<string, string> = body?.settings || {}

    const allowedKeys = new Set(Object.keys(CONFIG_KEYS))
    const upserts: Promise<unknown>[] = []
    const deletes: Promise<unknown>[] = []

    for (const [key, rawValue] of Object.entries(settings)) {
      if (!allowedKeys.has(key)) continue
      // Skip undefined/null (don't touch the DB row in that case)
      if (rawValue === undefined || rawValue === null) continue

      const value = String(rawValue).trim()

      // Reject placeholder values that the user forgot to replace
      if (value.startsWith('ghp_xxxx') || value === 'your-github-username-or-org') {
        continue
      }

      if (value === '') {
        // Empty string => clear DB row so env var fallback applies
        deletes.push(db.siteSettings.deleteMany({ where: { key } }))
      } else {
        upserts.push(
          db.siteSettings.upsert({
            where: { key },
            update: { value },
            create: { key, value },
          })
        )
      }
    }

    await Promise.all([...upserts, ...deletes])

    // Return updated state (masked). Re-query DB to get accurate sources.
    const config = await getImageUploadConfig()
    const dbKeysAfter = new Set(
      (await db.siteSettings.findMany({ where: { key: { in: Object.keys(CONFIG_KEYS) } } })).map(
        (r) => r.key
      )
    )
    const items = Object.values(CONFIG_KEYS).map((meta) => {
      const value = config[meta.key] || ''
      return {
        ...meta,
        value: meta.isSecret ? maskSecret(value) : value,
        hasValue: Boolean(value),
        source: dbKeysAfter.has(meta.key) ? 'db' : value ? 'env' : 'none' as const,
      }
    })

    return NextResponse.json({ success: true, items })
  } catch (error) {
    console.error('[admin/config] PUT error:', error)
    return NextResponse.json({ error: 'فشل حفظ الإعدادات' }, { status: 500 })
  }
}

/**
 * POST /api/admin/config?action=test
 * Tests the current image upload configuration by uploading a tiny test image
 * to the picser service. Returns the resulting CDN URL on success.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!(await checkAdmin(userId))) {
      return NextResponse.json({ error: 'صلاحيات المسؤول مطلوبة' }, { status: 403 })
    }

    const action = request.nextUrl.searchParams.get('action')
    if (action !== 'test') {
      return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 })
    }

    const cfg = await getImageUploadConfig()
    const required = ['GITHUB_TOKEN', 'GITHUB_OWNER', 'GITHUB_REPO'] as const
    const missing = required.filter((k) => !cfg[k])
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `متغيرات ناقصة: ${missing.join(', ')}` },
        { status: 400 }
      )
    }

    const githubBranch = cfg.GITHUB_BRANCH || 'main'
    const uploadFolder = cfg.UPLOAD_FOLDER || 'uploads'
    const picserUrl = cfg.PICSER_UPLOAD_URL || 'https://picser.pages.dev/api/public-upload'

    // 1x1 transparent PNG (89 bytes) — minimal test payload
    const testPng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      'base64'
    )

    const upstreamForm = new FormData()
    const blob = new Blob([testPng], { type: 'image/png' })
    upstreamForm.append('file', blob, 'config-test.png')
    upstreamForm.append('github_token', cfg.GITHUB_TOKEN)
    upstreamForm.append('github_owner', cfg.GITHUB_OWNER)
    upstreamForm.append('github_repo', cfg.GITHUB_REPO)
    upstreamForm.append('github_branch', githubBranch)
    upstreamForm.append('folder', uploadFolder)

    const upstreamRes = await fetch(picserUrl, { method: 'POST', body: upstreamForm })
    const rawText = await upstreamRes.text()

    let result: Record<string, unknown> = {}
    try {
      result = JSON.parse(rawText)
    } catch {
      return NextResponse.json(
        { error: 'استجابة غير صالحة من خدمة الرفع', detail: rawText.slice(0, 300) },
        { status: 502 }
      )
    }

    if (!upstreamRes.ok) {
      const errMsg =
        (result.message as string) || (result.error as string) || `فشل الرفع (${upstreamRes.status})`
      return NextResponse.json({ error: errMsg, detail: result }, { status: upstreamRes.status })
    }

    const uploadData =
      result.data && typeof result.data === 'object'
        ? (result.data as Record<string, unknown>)
        : result

    const urls = (uploadData.urls as Record<string, string>) || {}
    const cdnUrl =
      urls.jsdelivr_commit ||
      (uploadData.filename && uploadData.commit_sha
        ? `https://cdn.jsdelivr.net/gh/${cfg.GITHUB_OWNER}/${cfg.GITHUB_REPO}@${uploadData.commit_sha}/${String(uploadData.filename).replace(/^\/+/, '')}`
        : urls.raw_commit || urls.raw || uploadData.url || '')

    return NextResponse.json({
      success: true,
      message: 'تم اختبار الإعدادات بنجاح',
      testUrl: cdnUrl,
      detail: {
        filename: uploadData.filename,
        commitSha: uploadData.commit_sha,
        size: uploadData.size,
      },
    })
  } catch (error) {
    console.error('[admin/config] POST test error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'فشل اختبار الإعدادات' },
      { status: 500 }
    )
  }
}

function maskSecret(value: string): string {
  if (!value) return ''
  if (value.length <= 8) return '••••••••'
  // Show first 4 + last 4 chars
  return `${value.slice(0, 4)}${'•'.repeat(Math.min(20, value.length - 8))}${value.slice(-4)}`
}
