'use client'

import { useState, useEffect } from 'react'
import VideoCard from '@/components/video/VideoCard'
import SectionHeader from '@/components/common/SectionHeader'
import EmptyState from '@/components/common/EmptyState'
import { useAppStore } from '@/store/app-store'

interface VideoData {
  id: string
  title: string
  slug: string
  shareCode: string
  thumbnail: string | null
  duration: number
  views: number
  isFree: boolean
  isPublished: boolean
  isFeatured: boolean
  embedUrl: string | null
  createdAt: string
  user: { id: string; name: string; avatar: string | null }
  category: { id: string; name: string; slug: string } | null
  _count: { likes: number; comments: number }
}

interface LatestVideosProps {
  initialVideos?: VideoData[]
}

export default function LatestVideos({ initialVideos = [] }: LatestVideosProps) {
  const navigateToSearch = useAppStore((s) => s.navigateToSearch)
  const videoListVersion = useAppStore((s) => s.videoListVersion)

  const [videos, setVideos] = useState<VideoData[]>(initialVideos)
  const [loading, setLoading] = useState(false)

  // Refetch when videoListVersion changes (video created/deleted/updated)
  useEffect(() => {
    // Skip initial mount (already have SSR data)
    if (videoListVersion === 0) return

    let cancelled = false
    setLoading(true)

    const refetch = async () => {
      try {
        const res = await fetch('/api/video?limit=12&sort=newest')
        if (res.ok) {
          const data = await res.json()
          if (!cancelled) setVideos(data.videos || [])
        }
      } catch {
        // Keep existing data on error
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    refetch()
    return () => { cancelled = true }
  }, [videoListVersion])

  // Also keep initialVideos in sync on first render
  useEffect(() => {
    setVideos(initialVideos)
  }, [initialVideos])

  if (videos.length === 0 && !loading) {
    return (
      <div>
        <SectionHeader title="أحدث الفيديوهات" />
        <EmptyState title="لا توجد فيديوهات" description="لم يتم العثور على فيديوهات حالياً" />
      </div>
    )
  }

  return (
    <section>
      <SectionHeader
        title="أحدث الفيديوهات"
        subtitle="اكتشف أحدث المحتوى التعليمي"
        onSeeAll={() => navigateToSearch('')}
      />
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 transition-opacity duration-300 ${loading ? 'opacity-60' : 'opacity-100'}`}>
        {videos.map((video, index) => (
          <VideoCard key={video.id} video={video} index={index} />
        ))}
      </div>
    </section>
  )
}
