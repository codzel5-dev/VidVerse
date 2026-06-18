'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import VideoCard from '@/components/video/VideoCard'
import type { VideoData } from '@/hooks/useVideos'

interface MainVideoGridProps {
  initialVideos: VideoData[]
  activeCategory: string | null
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function MainVideoGrid({ initialVideos, activeCategory }: MainVideoGridProps) {
  const [videos, setVideos] = useState<VideoData[]>(initialVideos)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  // Filter by category when activeCategory changes
  useEffect(() => {
    let cancelled = false
    // Use a microtask deferral to avoid synchronous setState cascades
    const run = async () => {
      if (cancelled) return
      setLoading(true)
      setPage(1)

      try {
        const params = new URLSearchParams({ limit: '24', sort: 'newest' })
        if (activeCategory) params.set('category', activeCategory)
        const res = await fetch(`/api/video?${params.toString()}`)
        if (!res.ok) throw new Error('fetch failed')
        const data = await res.json()
        if (cancelled) return
        setVideos(data.videos || [])
        const pg = data.pagination as Pagination | undefined
        setHasMore(pg ? pg.page < pg.totalPages : false)
      } catch {
        if (!cancelled) setVideos([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [activeCategory])

  // Keep initialVideos synced when no active category
  useEffect(() => {
    if (!activeCategory) {
      // Defer to avoid synchronous setState in effect cascades
      const t = setTimeout(() => setVideos(initialVideos), 0)
      return () => clearTimeout(t)
    }
  }, [initialVideos, activeCategory])

  const loadMore = async () => {
    if (loading || !hasMore) return
    setLoading(true)
    const nextPage = page + 1
    try {
      const params = new URLSearchParams({
        limit: '24',
        sort: 'newest',
        page: nextPage.toString(),
      })
      if (activeCategory) params.set('category', activeCategory)
      const res = await fetch(`/api/video?${params.toString()}`)
      const data = await res.json()
      const newVideos = (data.videos || []) as VideoData[]
      setVideos((prev) => [...prev, ...newVideos])
      setPage(nextPage)
      const pg = data.pagination as Pagination | undefined
      setHasMore(pg ? pg.page < pg.totalPages : false)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  if (videos.length === 0 && !loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-20 h-20 rounded-3xl glass-card mx-auto mb-5 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-[oklch(0.627_0.265_303.9)]" />
        </div>
        <p className="text-[oklch(0.65_0.03_280)] text-lg font-medium mb-1">
          لا توجد فيديوهات في هذا القسم حالياً
        </p>
        <p className="text-[oklch(0.45_0.03_280)] text-sm">
          جرّب تصنيفاً آخر أو عُد لاحقاً
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Section title */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            {activeCategory ? 'فيديوهات القسم' : 'كل الفيديوهات'}
          </h2>
          <p className="text-xs text-[oklch(0.5_0.03_280)] mt-0.5">
            اكتشف أحدث المحتوى المضاف
          </p>
        </div>
      </div>

      {/* Grid */}
      <div
        className={`grid gap-x-4 gap-y-8 transition-opacity duration-300 ${
          loading && page === 1 ? 'opacity-50' : 'opacity-100'
        } grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5`}
      >
        {videos.map((video, index) => (
          <VideoCard key={video.id} video={video} index={index} />
        ))}
      </div>

      {/* Load more */}
      {hasMore && videos.length > 0 && (
        <div className="flex justify-center mt-10 mb-4">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-3 rounded-2xl glass-aurora border border-[oklch(0.25_0.04_280)] text-white font-medium hover:bg-[oklch(0.627_0.265_303.9_/_0.15)] hover:border-[oklch(0.627_0.265_303.9_/_0.4)] transition-all duration-300 disabled:opacity-50 inline-flex items-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>{loading ? 'جارٍ التحميل...' : 'تحميل المزيد'}</span>
          </button>
        </div>
      )}
    </div>
  )
}
