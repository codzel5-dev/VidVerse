'use client'

import VideoCard from '@/components/video/VideoCard'
import SectionHeader from '@/components/common/SectionHeader'
import { useAppStore } from '@/store/app-store'

interface TopRatedVideosProps {
  initialVideos?: any[]
}

export default function TopRatedVideos({ initialVideos = [] }: TopRatedVideosProps) {
  const navigateToSearch = useAppStore((s) => s.navigateToSearch)
  const videos = [...initialVideos].sort((a, b) => b.views - a.views).slice(0, 4)

  if (videos.length === 0) return null

  return (
    <section>
      <SectionHeader
        title="الأكثر مشاهدة"
        subtitle="المحتوى الأكثر شعبية"
        onSeeAll={() => navigateToSearch('')}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {videos.map((video, index) => (
          <VideoCard key={video.id} video={video} index={index} />
        ))}
      </div>
    </section>
  )
}
