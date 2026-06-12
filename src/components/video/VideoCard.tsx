'use client'

import { motion } from 'framer-motion'
import { Clock, Eye, Play } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import StarRating from '@/components/common/StarRating'
import { useAppStore } from '@/store/app-store'
import type { VideoData } from '@/hooks/useVideos'

interface VideoCardProps {
  video: VideoData
  index?: number
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatViews(views: number): string {
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}م`
  if (views >= 1000) return `${(views / 1000).toFixed(1)}ك`
  return views.toString()
}

function timeAgo(date: string): string {
  const now = new Date()
  const past = new Date(date)
  const diffMs = now.getTime() - past.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays > 30) return `منذ ${Math.floor(diffDays / 30)} شهر`
  if (diffDays > 0) return `منذ ${diffDays} يوم`
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  if (diffHours > 0) return `منذ ${diffHours} ساعة`
  return 'الآن'
}

// Aurora gradient patterns by index
const thumbnailPatterns = [
  'from-[oklch(0.627_0.265_303.9)] via-[oklch(0.715_0.183_192.5)] to-[oklch(0.696_0.17_162.48)]',
  'from-[oklch(0.645_0.246_16.4)] via-[oklch(0.755_0.183_68.5)] to-[oklch(0.627_0.265_303.9)]',
  'from-[oklch(0.656_0.241_354.3)] via-[oklch(0.627_0.265_303.9)] to-[oklch(0.623_0.214_259.8)]',
  'from-[oklch(0.715_0.183_192.5)] via-[oklch(0.696_0.17_162.48)] to-[oklch(0.627_0.265_303.9)]',
  'from-[oklch(0.696_0.17_162.48)] via-[oklch(0.715_0.183_192.5)] to-[oklch(0.645_0.246_16.4)]',
  'from-[oklch(0.623_0.214_259.8)] via-[oklch(0.627_0.265_303.9)] to-[oklch(0.656_0.241_354.3)]',
]

export default function VideoCard({ video, index = 0 }: VideoCardProps) {
  const navigateToVideo = useAppStore((s) => s.navigateToVideo)
  const pattern = thumbnailPatterns[index % thumbnailPatterns.length]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <div
        onClick={() => navigateToVideo(video.id)}
        className="group cursor-pointer card-aurora overflow-hidden"
      >
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-br ${pattern} opacity-70 group-hover:opacity-90 transition-opacity duration-500`} />
          
          {/* Grid overlay pattern */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '20px 20px'
          }} />
          
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:scale-125 group-hover:bg-white/30 transition-all duration-500 border border-white/20">
              <Play className="h-6 w-6 text-white fill-white ml-0.5" />
            </div>
          </div>

          {/* Duration badge */}
          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg">
            <Clock className="h-3 w-3" />
            {formatDuration(video.duration)}
          </div>

          {/* Free/Paid badge */}
          {video.isFree ? (
            <div className="absolute top-2 right-2 badge-free text-xs rounded-lg px-2 py-1">
              مجاني
            </div>
          ) : (
            <div className="absolute top-2 right-2 badge-premium text-xs rounded-lg px-2 py-1">
              مدفوع
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-semibold text-white line-clamp-2 mb-2.5 group-hover:text-gradient-aurora transition-all duration-300">
            {video.title}
          </h3>

          <div className="flex items-center gap-2 mb-2.5">
            <Avatar className="h-6 w-6 border border-[oklch(0.627_0.265_303.9_/_0.3)]">
              <AvatarFallback className="bg-[oklch(0.627_0.265_303.9_/_0.15)] text-[oklch(0.827_0.165_303.9)] text-[10px] font-semibold">
                {video.user?.name?.charAt(0) || 'م'}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-[oklch(0.55_0.04_280)]">{video.user?.name || 'مجهول'}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-[oklch(0.5_0.03_280)]">
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {formatViews(video.views)}
              </span>
              <span>{timeAgo(video.createdAt)}</span>
            </div>
            {video.avgRating !== undefined && video.avgRating > 0 && (
              <StarRating rating={video.avgRating} size="sm" />
            )}
          </div>

          {/* Category badge */}
          {video.category && (
            <div className="mt-3">
              <Badge variant="secondary" className="text-xs rounded-lg bg-[oklch(0.627_0.265_303.9_/_0.1)] text-[oklch(0.827_0.165_303.9)] border-[oklch(0.627_0.265_303.9_/_0.2)] hover:bg-[oklch(0.627_0.265_303.9_/_0.15)]">
                {video.category.name}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export { formatDuration, formatViews, timeAgo, thumbnailPatterns }
