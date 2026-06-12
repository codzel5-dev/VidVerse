'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Eye, Trash2, Video, CheckCircle, XCircle, Star } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { useAppStore } from '@/store/app-store'
import { useAuthStore } from '@/store/auth-store'
import { toast } from 'sonner'

interface AdminVideo {
  id: string
  title: string
  slug: string
  shareCode: string
  views: number
  isFree: boolean
  isPublished: boolean
  isFeatured: boolean
  createdAt: string
  user: { id: string; name: string }
  category: { id: string; name: string } | null
  _count: { likes: number; comments: number }
}

export default function VideoManager() {
  const [videos, setVideos] = useState<AdminVideo[]>([])
  const [loading, setLoading] = useState(true)
  const navigateToVideo = useAppStore((s) => s.navigateToVideo)
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    const headers: HeadersInit = {}
    if (user?.id) headers['x-user-id'] = user.id
    fetch('/api/admin/videos', { headers })
      .then((res) => res.json())
      .then((data) => setVideos(data.videos || []))
      .catch(() => setVideos([]))
      .finally(() => setLoading(false))
  }, [user?.id])

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الفيديو؟')) return
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' }
      if (user?.id) headers['x-user-id'] = user.id
      const res = await fetch(`/api/video/${id}`, { method: 'DELETE', headers })
      if (res.ok) {
        setVideos((prev) => prev.filter((v) => v.id !== id))
        toast.success('تم حذف الفيديو')
      }
    } catch {
      toast.error('حدث خطأ أثناء الحذف')
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[oklch(0.55_0.04_280)]">{videos.length} فيديو</p>
      </div>

      <div className="space-y-3">
        {videos.map((video, index) => (
          <motion.div
            key={video.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <Card className="glass-card p-4 rounded-2xl hover:border-[oklch(0.627_0.265_303.9_/_0.3)] transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-20 h-14 rounded-xl bg-gradient-to-br from-[oklch(0.627_0.265_303.9)] to-[oklch(0.715_0.183_192.5)] flex items-center justify-center shrink-0">
                  <Video className="h-6 w-6 text-white/60" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-white line-clamp-1">{video.title}</h4>
                  <div className="flex items-center gap-2 text-xs text-[oklch(0.55_0.04_280)] mt-1">
                    <span>{video.user?.name}</span>
                    <span>•</span>
                    <span>{video.views} مشاهدة</span>
                    <span>•</span>
                    <span>{new Date(video.createdAt).toLocaleDateString('ar-EG')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {video.isPublished ? (
                    <Badge className="badge-free border-0 rounded-lg text-xs">
                      <CheckCircle className="h-3 w-3 ml-1" />
                      منشور
                    </Badge>
                  ) : (
                    <Badge className="bg-[oklch(0.18_0.03_280)] text-[oklch(0.55_0.04_280)] border border-[oklch(0.25_0.04_280)] rounded-lg text-xs">
                      <XCircle className="h-3 w-3 ml-1" />
                      مسودة
                    </Badge>
                  )}
                  {video.isFree && (
                    <Badge className="badge-free border-0 rounded-lg text-xs">مجاني</Badge>
                  )}
                  {video.isFeatured && (
                    <Badge className="badge-premium border-0 rounded-lg text-xs">
                      <Star className="h-3 w-3 ml-1" />
                      مميز
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg hover:bg-[oklch(0.18_0.03_280)]"
                    onClick={() => navigateToVideo(video.shareCode || video.id)}
                  >
                    <Eye className="h-4 w-4 text-[oklch(0.55_0.04_280)]" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg text-[oklch(0.745_0.166_16.4)] hover:text-[oklch(0.845_0.166_16.4)] hover:bg-[oklch(0.645_0.246_16.4_/_0.1)]"
                    onClick={() => handleDelete(video.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {videos.length === 0 && (
        <div className="text-center py-8 text-[oklch(0.55_0.04_280)]">لا توجد فيديوهات</div>
      )}
    </div>
  )
}
