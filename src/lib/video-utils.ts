import { db } from '@/lib/db'

/**
 * Resolve a video identifier (shareCode or id) to the actual video record ID.
 * Tries shareCode first (YouTube-style), then falls back to regular id.
 */
export async function resolveVideoId(identifier: string): Promise<string | null> {
  // Try shareCode first
  const byShareCode = await db.video.findUnique({
    where: { shareCode: identifier },
    select: { id: true },
  })
  if (byShareCode) return byShareCode.id

  // Fallback to regular id
  const byId = await db.video.findUnique({
    where: { id: identifier },
    select: { id: true },
  })
  return byId?.id ?? null
}
