'use client'

import { motion } from 'framer-motion'
import { Clock, Eye } from 'lucide-react'
import { Card } from '@/components/ui/card'
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

// Thumbnail gradient patterns by index
const thumbnailPatterns = [
  'from-emerald-400 via-teal-400 to-cyan-400',
  'from-amber-400 via-orange-400 to-rose-400',
  'from-violet-400 via-purple-400 to-fuchsia-400',
  'from-sky-400 via-blue-400 to-indigo-400',
  'from-lime-400 via-green-400 to-emerald-400',
  'from-rose-400 via-pink-400 to-red-400',
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
      <Card
        onClick={() => navigateToVideo(video.id)}
        className="group cursor-pointer border-0 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden bg-white card-hover rounded-2xl"
      >
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-br ${pattern} opacity-80`} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <svg className="h-6 w-6 text-white fill-white" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>

          {/* Duration badge */}
          <Badge
            variant="secondary"
            className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded-lg border-0"
          >
            <Clock className="h-3 w-3 ml-1" />
            {formatDuration(video.duration)}
          </Badge>

          {/* Free/Paid badge */}
          {video.isFree ? (
            <Badge className="absolute top-2 right-2 bg-emerald-500 text-white text-xs rounded-lg border-0">
              مجاني
            </Badge>
          ) : (
            <Badge className="absolute top-2 right-2 bg-amber-500 text-white text-xs rounded-lg border-0">
              مدفوع
            </Badge>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-semibold text-stone-800 line-clamp-2 mb-2 group-hover:text-emerald-700 transition-colors">
            {video.title}
          </h3>

          <div className="flex items-center gap-2 mb-2">
            <Avatar className="h-6 w-6 border border-stone-200">
              <AvatarFallback className="bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
                {video.user?.name?.charAt(0) || 'م'}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">{video.user?.name || 'مجهول'}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
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
            <Badge variant="secondary" className="mt-2 text-xs rounded-lg bg-stone-100 text-stone-600">
              {video.category.name}
            </Badge>
          )}
        </div>
      </Card>
    </motion.div>
  )
}

export { formatDuration, formatViews, timeAgo, thumbnailPatterns }
