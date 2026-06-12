'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  Share2,
  Eye,
  Clock,
  MessageCircle,
  Send,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Card } from '@/components/ui/card'
import StarRating from '@/components/common/StarRating'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import VideoPlayer from './VideoPlayer'
import VideoCard from './VideoCard'
import { useVideoDetail, useVideos } from '@/hooks/useVideos'
import { useAuthStore } from '@/store/auth-store'
import { useAppStore } from '@/store/app-store'
import { toast } from 'sonner'

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

export default function VideoDetail() {
  const selectedVideoId = useAppStore((s) => s.selectedVideoId)
  const goHome = useAppStore((s) => s.goHome)
  const { video, loading, refetch } = useVideoDetail(selectedVideoId)
  const { videos: relatedVideos } = useVideos({ limit: 6, sort: 'popular' })
  const user = useAuthStore((s) => s.user)

  const [commentText, setCommentText] = useState('')
  const [userRating, setUserRating] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [isDisliked, setIsDisliked] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  const handleLike = async () => {
    if (!user) { toast.error('يرجى تسجيل الدخول أولاً'); return }
    try {
      const res = await fetch(`/api/video/${selectedVideoId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
        body: JSON.stringify({ userId: user.id, type: isLiked ? 'like' : 'like' }),
      })
      if (res.ok) {
        setIsLiked(!isLiked)
        setIsDisliked(false)
        toast.success(isLiked ? 'تم إزالة الإعجاب' : 'تم الإعجاب')
      }
    } catch { toast.error('حدث خطأ') }
  }

  const handleDislike = async () => {
    if (!user) { toast.error('يرجى تسجيل الدخول أولاً'); return }
    try {
      const res = await fetch(`/api/video/${selectedVideoId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
        body: JSON.stringify({ userId: user.id, type: 'dislike' }),
      })
      if (res.ok) {
        setIsDisliked(!isDisliked)
        setIsLiked(false)
        toast.success('تم التسجيل')
      }
    } catch { toast.error('حدث خطأ') }
  }

  const handleSave = async () => {
    if (!user) { toast.error('يرجى تسجيل الدخول أولاً'); return }
    try {
      const res = await fetch(`/api/video/${selectedVideoId}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
        body: JSON.stringify({ userId: user.id }),
      })
      if (res.ok) {
        setIsSaved(!isSaved)
        toast.success(isSaved ? 'تم إزالة من المحفوظات' : 'تم الحفظ')
      }
    } catch { toast.error('حدث خطأ') }
  }

  const handleRate = async (score: number) => {
    if (!user) { toast.error('يرجى تسجيل الدخول أولاً'); return }
    try {
      const res = await fetch(`/api/video/${selectedVideoId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
        body: JSON.stringify({ userId: user.id, score }),
      })
      if (res.ok) {
        setUserRating(score)
        toast.success('تم التقييم بنجاح')
        refetch()
      }
    } catch { toast.error('حدث خطأ') }
  }

  const handleAddComment = async () => {
    if (!user) { toast.error('يرجى تسجيل الدخول أولاً'); return }
    if (!commentText.trim()) return
    try {
      const res = await fetch('/api/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
        body: JSON.stringify({ content: commentText, videoId: selectedVideoId }),
      })
      if (res.ok) {
        setCommentText('')
        toast.success('تم إضافة التعليق')
        refetch()
      }
    } catch { toast.error('حدث خطأ') }
  }

  const handleShare = () => {
    // Use shareCode for YouTube-style URL
    const shareCode = video?.shareCode
    if (shareCode) {
      const shareUrl = `${window.location.origin}/?v=${shareCode}`
      navigator.clipboard.writeText(shareUrl)
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
    toast.success('تم نسخ الرابط')
  }

  if (loading) return <LoadingSpinner text="جاري تحميل الفيديو..." />

  if (!video) {
    return (
      <div className="text-center py-16">
        <p className="text-[oklch(0.55_0.04_280)] mb-4">الفيديو غير موجود</p>
        <Button onClick={goHome} className="rounded-2xl btn-aurora text-white border-0">
          العودة للرئيسية
        </Button>
      </div>
    )
  }

  const avgRating = video.avgRating || 0
  const likeCount = video.likeCount || video._count?.likes || 0
  const dislikeCount = video.dislikeCount || 0

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Player */}
          <VideoPlayer embedUrl={video.embedUrl} title={video.title} />

          {/* Title & Info */}
          <div>
            <h1 className="text-2xl font-bold text-white mb-3">{video.title}</h1>

            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-[oklch(0.55_0.04_280)] mb-4">
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {video.views.toLocaleString('ar-EG')} مشاهدة
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {timeAgo(video.createdAt)}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4" />
                {video._count?.comments || 0} تعليق
              </span>
              {video.shareCode && (
                <span
                  className="flex items-center gap-1 cursor-pointer hover:text-[oklch(0.827_0.165_303.9)] transition-colors"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/?v=${video.shareCode}`)
                    toast.success('تم نسخ رابط الفيديو')
                  }}
                  title="انقر لنسخ الرابط"
                >
                  <Share2 className="h-4 w-4" />
                  <span className="font-mono text-xs" dir="ltr">{video.shareCode}</span>
                </span>
              )}
              {video.category && (
                <Badge className="badge-aurora rounded-lg border-0">
                  {video.category.name}
                </Badge>
              )}
              {video.isFree ? (
                <Badge className="badge-free border-0 rounded-lg">مجاني</Badge>
              ) : (
                <Badge className="badge-premium border-0 rounded-lg">مدفوع</Badge>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={isLiked ? 'default' : 'outline'}
                size="sm"
                onClick={handleLike}
                className={`rounded-xl border-[oklch(0.25_0.04_280)] ${isLiked ? 'bg-[oklch(0.627_0.265_303.9)] hover:bg-[oklch(0.55_0.265_303.9)] text-white' : 'text-[oklch(0.7_0.04_280)] hover:bg-[oklch(0.13_0.028_280)] hover:text-white'}`}
              >
                <ThumbsUp className="h-4 w-4 ml-1" />
                {likeCount}
              </Button>
              <Button
                variant={isDisliked ? 'default' : 'outline'}
                size="sm"
                onClick={handleDislike}
                className={`rounded-xl border-[oklch(0.25_0.04_280)] ${isDisliked ? 'bg-[oklch(0.645_0.246_16.4)] hover:bg-[oklch(0.58_0.246_16.4)] text-white' : 'text-[oklch(0.7_0.04_280)] hover:bg-[oklch(0.13_0.028_280)] hover:text-white'}`}
              >
                <ThumbsDown className="h-4 w-4 ml-1" />
                {dislikeCount}
              </Button>
              <Button
                variant={isSaved ? 'default' : 'outline'}
                size="sm"
                onClick={handleSave}
                className={`rounded-xl border-[oklch(0.25_0.04_280)] ${isSaved ? 'bg-[oklch(0.755_0.183_68.5)] hover:bg-[oklch(0.68_0.183_68.5)] text-white' : 'text-[oklch(0.7_0.04_280)] hover:bg-[oklch(0.13_0.028_280)] hover:text-white'}`}
              >
                <Bookmark className={`h-4 w-4 ml-1 ${isSaved ? 'fill-white' : ''}`} />
                حفظ
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare} className="rounded-xl border-[oklch(0.25_0.04_280)] text-[oklch(0.7_0.04_280)] hover:bg-[oklch(0.13_0.028_280)] hover:text-white">
                <Share2 className="h-4 w-4 ml-1" />
                مشاركة
              </Button>
            </div>
          </div>

          {/* Rating */}
          <Card className="glass-card card-aurora p-4 rounded-2xl border-[oklch(0.25_0.04_280)]">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-gradient-aurora">{avgRating.toFixed(1)}</div>
                <StarRating rating={avgRating} size="sm" />
              </div>
              <Separator orientation="vertical" className="h-12 bg-[oklch(0.25_0.04_280)]" />
              <div>
                <p className="text-sm text-[oklch(0.55_0.04_280)] mb-1">قيم هذا الفيديو</p>
                <StarRating
                  rating={userRating}
                  size="lg"
                  interactive
                  onRate={handleRate}
                />
              </div>
            </div>
          </Card>

          {/* Description */}
          {video.description && (
            <Card className="glass-card card-aurora p-4 rounded-2xl border-[oklch(0.25_0.04_280)]">
              <h3 className="font-semibold text-white mb-2">الوصف</h3>
              <p className="text-sm text-[oklch(0.7_0.04_280)] leading-relaxed whitespace-pre-line">
                {video.description}
              </p>
            </Card>
          )}

          {/* Comments */}
          <Card className="glass-card card-aurora p-4 rounded-2xl border-[oklch(0.25_0.04_280)]">
            <h3 className="font-semibold text-white mb-4">
              التعليقات ({video.comments?.length || 0})
            </h3>

            {/* Add comment */}
            {user && (
              <div className="flex gap-3 mb-6">
                <Avatar className="h-9 w-9 border-[oklch(0.627_0.265_303.9_/_0.3)]">
                  <AvatarFallback className="bg-[oklch(0.627_0.265_303.9_/_0.15)] text-[oklch(0.627_0.265_303.9)] text-sm font-semibold">
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="أضف تعليقاً..."
                    className="input-aurora rounded-xl min-h-[80px] resize-none bg-[oklch(0.08_0.02_280)] border-[oklch(0.25_0.04_280)] text-white placeholder:text-[oklch(0.55_0.04_280)]"
                  />
                  <div className="flex justify-end mt-2">
                    <Button
                      size="sm"
                      onClick={handleAddComment}
                      disabled={!commentText.trim()}
                      className="rounded-xl btn-aurora text-white border-0"
                    >
                      <Send className="h-4 w-4 ml-1" />
                      إرسال
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Comments list */}
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {((video.comments || []) as Array<Record<string, unknown>>).map((comment) => {
                const c = comment as { id: string; content: string; createdAt: string; user: { id: string; name: string; avatar: string | null }; replies: Record<string, unknown>[]; likes: unknown[] }
                return (
                  <div key={c.id} className="flex gap-3">
                    <Avatar className="h-8 w-8 border-[oklch(0.627_0.265_303.9_/_0.3)]">
                      <AvatarFallback className="bg-[oklch(0.13_0.028_280)] text-[oklch(0.715_0.183_192.5)] text-xs font-semibold">
                        {c.user?.name?.charAt(0) || 'م'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-white">{c.user?.name}</span>
                        <span className="text-xs text-[oklch(0.55_0.04_280)]">{timeAgo(c.createdAt)}</span>
                      </div>
                      <p className="text-sm text-[oklch(0.7_0.04_280)]">{c.content}</p>
                      {(c.replies || []).length > 0 && (
                        <div className="mt-3 mr-8 space-y-3">
                          {(c.replies || []).map((reply: Record<string, unknown>) => {
                            const r = reply as { id: string; content: string; createdAt: string; user: { id: string; name: string; avatar: string | null } }
                            return (
                              <div key={r.id} className="flex gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="bg-[oklch(0.13_0.028_280)] text-[oklch(0.715_0.183_192.5)] text-[10px]">
                                    {r.user?.name?.charAt(0) || 'م'}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-white">{r.user?.name}</span>
                                    <span className="text-xs text-[oklch(0.55_0.04_280)]">{timeAgo(r.createdAt)}</span>
                                  </div>
                                  <p className="text-xs text-[oklch(0.7_0.04_280)]">{r.content}</p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>

        {/* Sidebar - Related Videos */}
        <div className="space-y-4">
          <h3 className="font-semibold text-white">فيديوهات ذات صلة</h3>
          <div className="space-y-3 max-h-[calc(100vh-12rem)] overflow-y-auto">
            {relatedVideos
              .filter((v) => v.id !== selectedVideoId)
              .slice(0, 8)
              .map((v, index) => (
                <VideoCard key={v.id} video={v} index={index} />
              ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
