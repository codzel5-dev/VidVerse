'use client'

import VideoCard from '@/components/video/VideoCard'
import SectionHeader from '@/components/common/SectionHeader'
import EmptyState from '@/components/common/EmptyState'
import { useAppStore } from '@/store/app-store'

interface LatestVideosProps {
  initialVideos?: any[]
}

export default function LatestVideos({ initialVideos = [] }: LatestVideosProps) {
  const navigateToSearch = useAppStore((s) => s.navigateToSearch)
  const videos = initialVideos

  if (videos.length === 0) {
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {videos.map((video, index) => (
          <VideoCard key={video.id} video={video} index={index} />
        ))}
      </div>
    </section>
  )
}
