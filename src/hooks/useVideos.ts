'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/store/auth-store'

interface VideoData {
  id: string
  title: string
  slug: string
  shareCode: string
  description: string | null
  thumbnail: string | null
  duration: number
  views: number
  isFree: boolean
  isPublished: boolean
  isFeatured: boolean
  embedUrl: string | null
  categoryId: string | null
  userId: string
  createdAt: string
  user: { id: string; name: string; avatar: string | null }
  category: { id: string; name: string; slug: string } | null
  videoTags: { tag: { id: string; name: string; slug: string } }[]
  _count: { likes: number; comments: number }
  avgRating?: number
  likeCount?: number
  dislikeCount?: number
  comments?: unknown[]
  likes?: unknown[]
  ratings?: unknown[]
  savedBy?: unknown[]
}

interface UseVideosOptions {
  page?: number
  limit?: number
  category?: string | null
  sort?: string
  search?: string
  free?: boolean
  userId?: string
}

export function useVideos(options: UseVideosOptions = {}) {
  const [videos, setVideos] = useState<VideoData[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchVideos = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (options.page) params.set('page', options.page.toString())
      if (options.limit) params.set('limit', options.limit.toString())
      if (options.category) params.set('category', options.category)
      if (options.sort) params.set('sort', options.sort)
      if (options.search) params.set('search', options.search)
      if (options.free) params.set('free', 'true')
      if (options.userId) params.set('userId', options.userId)

      const res = await fetch(`/api/video?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch videos')
      const data = await res.json()
      setVideos(data.videos)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء جلب الفيديوهات')
    } finally {
      setLoading(false)
    }
  }, [options.page, options.limit, options.category, options.sort, options.search, options.free, options.userId])

  useEffect(() => {
    let cancelled = false
    const doFetch = async () => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        if (options.page) params.set('page', options.page.toString())
        if (options.limit) params.set('limit', options.limit.toString())
        if (options.category) params.set('category', options.category)
        if (options.sort) params.set('sort', options.sort)
        if (options.search) params.set('search', options.search)
        if (options.free) params.set('free', 'true')
        if (options.userId) params.set('userId', options.userId)

        const res = await fetch(`/api/video?${params.toString()}`)
        if (!res.ok) throw new Error('Failed to fetch videos')
        const data = await res.json()
        if (!cancelled) {
          setVideos(data.videos)
          setPagination(data.pagination)
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'حدث خطأ أثناء جلب الفيديوهات')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    doFetch()
    return () => { cancelled = true }
  }, [options.page, options.limit, options.category, options.sort, options.search, options.free, options.userId])

  return { videos, pagination, loading, error, refetch: fetchVideos }
}

export function useVideoDetail(id: string | null) {
  const [video, setVideo] = useState<VideoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    const doFetch = async () => {
      setLoading(true)
      setError(null)
      try {
        const headers: HeadersInit = {}
        if (user?.id) headers['x-user-id'] = user.id
        const res = await fetch(`/api/video/${id}`, { headers })
        if (!res.ok) throw new Error('الفيديو غير موجود')
        const data = await res.json()
        if (!cancelled) setVideo(data.video)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'حدث خطأ أثناء جلب الفيديو')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    doFetch()
    return () => { cancelled = true }
  }, [id, user?.id])

  const refetch = async () => {
    if (!id) return
    try {
      const headers: HeadersInit = {}
      if (user?.id) headers['x-user-id'] = user.id
      const res = await fetch(`/api/video/${id}`, { headers })
      if (!res.ok) throw new Error('الفيديو غير موجود')
      const data = await res.json()
      setVideo(data.video)
    } catch {
      // silently fail refetch
    }
  }

  return { video, loading, error, refetch }
}

export function useFeaturedVideos() {
  const [videos, setVideos] = useState<VideoData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch('/api/video/featured')
      .then((res) => res.json())
      .then((data) => { if (!cancelled) setVideos(data.videos || []) })
      .catch(() => { if (!cancelled) setVideos([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return { videos, loading }
}

export type { VideoData }
