'use client'

import { useState, useEffect } from 'react'
import VideoCard from '@/components/video/VideoCard'
import SectionHeader from '@/components/common/SectionHeader'
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

interface TopRatedVideosProps {
  initialVideos?: VideoData[]
}

export default function TopRatedVideos({ initialVideos = [] }: TopRatedVideosProps) {
  const navigateToSearch = useAppStore((s) => s.navigateToSearch)
  const videoListVersion = useAppStore((s) => s.videoListVersion)

  const [videos, setVideos] = useState<VideoData[]>(
    [...initialVideos].sort((a, b) => b.views - a.views).slice(0, 4)
  )
  const [loading, setLoading] = useState(false)

  // Refetch when videoListVersion changes
  useEffect(() => {
    if (videoListVersion === 0) return

    let cancelled = false
    setLoading(true)

    const refetch = async () => {
      try {
        const res = await fetch('/api/video?limit=12&sort=popular')
        if (res.ok) {
          const data = await res.json()
          if (!cancelled) {
            const sorted = (data.videos || []).sort((a: VideoData, b: VideoData) => b.views - a.views).slice(0, 4)
            setVideos(sorted)
          }
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

  // Keep in sync with initial data
  useEffect(() => {
    setVideos([...initialVideos].sort((a, b) => b.views - a.views).slice(0, 4))
  }, [initialVideos])

  if (videos.length === 0 && !loading) return null

  return (
    <section>
      <SectionHeader
        title="الأكثر مشاهدة"
        subtitle="المحتوى الأكثر شعبية"
        onSeeAll={() => navigateToSearch('')}
      />
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 transition-opacity duration-300 ${loading ? 'opacity-60' : 'opacity-100'}`}>
        {videos.map((video, index) => (
          <VideoCard key={video.id} video={video} index={index} />
        ))}
      </div>
    </section>
  )
}
