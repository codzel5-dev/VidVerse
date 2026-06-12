'use client'

import { VideoData } from '@/hooks/useVideos'
import VideoCard from './VideoCard'

interface VideoGridProps {
  videos: VideoData[]
  view?: 'grid' | 'list'
}

export default function VideoGrid({ videos, view = 'grid' }: VideoGridProps) {
  if (view === 'list') {
    return (
      <div className="space-y-3">
        {videos.map((video) => (
          <div key={video.id} className="flex gap-4 bg-white rounded-2xl p-3 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-48 h-28 shrink-0 rounded-xl overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 opacity-80" />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="h-8 w-8 text-white fill-white" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
            <div className="flex-1 min-w-0 py-1">
              <h3 className="font-semibold text-stone-800 line-clamp-2 mb-1">{video.title}</h3>
              <p className="text-sm text-muted-foreground mb-2">{video.user?.name}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{video.views} مشاهدة</span>
                <span>{video._count.comments} تعليق</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {videos.map((video, index) => (
        <VideoCard key={video.id} video={video} index={index} />
      ))}
    </div>
  )
}
