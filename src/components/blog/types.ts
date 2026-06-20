/**
 * Shared TypeScript interfaces for the public blog UI.
 *
 * These mirror the JSON payloads returned by the public blog API routes
 * (`GET /api/blog` and `GET /api/blog/[slug]`) so the listing and article
 * components can consume them directly without re-declaring the shape.
 */

export interface BlogAuthor {
  id: string
  name: string
  avatar: string | null
  bio?: string | null
}

export interface BlogTag {
  id: string
  name: string
  slug: string
  count?: number
}

export interface BlogPostSummary {
  id: string
  title: string
  slug: string
  excerpt: string | null
  coverImage: string | null
  featured: boolean
  views: number
  readingTime: number
  createdAt: string
  author: BlogAuthor
  tags: BlogTag[]
}

export interface BlogPostFull extends BlogPostSummary {
  content: string
  status: string
  updatedAt: string
}

export interface BlogRelatedPost {
  id: string
  title: string
  slug: string
  coverImage: string | null
  createdAt: string
  readingTime: number
}
