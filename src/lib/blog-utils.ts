/**
 * Blog utilities: slugify, reading-time, excerpt, tag normalizer, date formatter.
 */

/** Slugify Arabic + English text into a URL-safe slug. */
export function slugify(text: string): string {
  return text
    .toString()
    .trim()
    .toLowerCase()
    // Replace whitespace with hyphens
    .replace(/\s+/g, '-')
    // Remove characters that aren't alphanumeric or hyphens (keep Arabic range)
    .replace(/[^\u0600-\u06FFa-z0-9-]/g, '')
    // Collapse multiple hyphens
    .replace(/-+/g, '-')
    // Trim leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    .slice(0, 200)
}

/** Estimate reading time in minutes (≈200 wpm for Arabic). */
export function estimateReadingTime(markdown: string): number {
  const text = markdown.replace(/[#*`>\-\[\]()!]/g, ' ')
  const words = text.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

/** Build an excerpt from markdown (first ~160 chars of plain text). */
export function buildExcerpt(markdown: string, max = 160): string {
  const plain = markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links → text
    .replace(/#{1,6}\s/g, '') // headings
    .replace(/[*`>_~]/g, '') // emphasis
    .replace(/\n+/g, ' ')
    .trim()
  return plain.length > max ? plain.slice(0, max).trim() + '…' : plain
}

/** Normalize a tag name into a slug. */
export function tagSlug(name: string): string {
  return slugify(name)
}

/** Format an ISO date into an Arabic readable date. */
export function formatBlogDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return iso
  }
}
