'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { useAuthStore } from '@/store/auth-store'
import { toast } from 'sonner'

interface AdminComment {
  id: string
  content: string
  isReported: boolean
  createdAt: string
  user: { id: string; name: string; avatar: string | null }
  video: { id: string; title: string } | null
}

export default function CommentManager() {
  const [comments, setComments] = useState<AdminComment[]>([])
  const [loading, setLoading] = useState(true)
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    const headers: HeadersInit = {}
    if (user?.id) headers['x-user-id'] = user.id
    fetch('/api/admin/comments', { headers })
      .then((res) => res.json())
      .then((data) => setComments(data.comments || []))
      .catch(() => setComments([]))
      .finally(() => setLoading(false))
  }, [user?.id])

  const handleApprove = async (id: string) => {
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' }
      if (user?.id) headers['x-user-id'] = user.id
      const res = await fetch(`/api/comment/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ isReported: false }),
      })
      if (res.ok) {
        setComments((prev) => prev.map((c) => (c.id === id ? { ...c, isReported: false } : c)))
        toast.success('تم الموافقة على التعليق')
      }
    } catch {
      toast.error('حدث خطأ')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا التعليق؟')) return
    try {
      const headers: HeadersInit = {}
      if (user?.id) headers['x-user-id'] = user.id
      const res = await fetch(`/api/comment/${id}`, { method: 'DELETE', headers })
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== id))
        toast.success('تم حذف التعليق')
      }
    } catch {
      toast.error('حدث خطأ أثناء الحذف')
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <p className="text-sm text-[oklch(0.55_0.04_280)]">{comments.length} تعليق</p>
        {comments.filter((c) => c.isReported).length > 0 && (
          <Badge className="bg-[oklch(0.645_0.246_16.4_/_0.15)] text-[oklch(0.745_0.166_16.4)] border border-[oklch(0.645_0.246_16.4_/_0.3)] rounded-lg text-xs">
            <AlertTriangle className="h-3 w-3 ml-1" />
            {comments.filter((c) => c.isReported).length} مبلغ عنهم
          </Badge>
        )}
      </div>

      <div className="space-y-3">
        {comments.map((comment, index) => (
          <motion.div
            key={comment.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <Card className={`glass-card p-4 rounded-2xl ${comment.isReported ? 'border-r-4 border-r-[oklch(0.645_0.246_16.4)]' : ''}`}>
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8 border border-[oklch(0.25_0.04_280)] shrink-0">
                  <AvatarFallback className="bg-[oklch(0.18_0.03_280)] text-[oklch(0.7_0.04_280)] text-xs font-semibold">
                    {comment.user?.name?.charAt(0) || 'م'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white">{comment.user?.name}</span>
                    <span className="text-xs text-[oklch(0.55_0.04_280)]">{new Date(comment.createdAt).toLocaleDateString('ar-EG')}</span>
                    {comment.isReported && (
                      <Badge className="bg-[oklch(0.645_0.246_16.4_/_0.15)] text-[oklch(0.745_0.166_16.4)] border border-[oklch(0.645_0.246_16.4_/_0.3)] rounded text-[10px]">مبلغ عنه</Badge>
                    )}
                  </div>
                  <p className="text-sm text-[oklch(0.7_0.04_280)] mb-2">{comment.content}</p>
                  {comment.video && (
                    <p className="text-xs text-[oklch(0.55_0.04_280)]">على: {comment.video.title}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {comment.isReported && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleApprove(comment.id)}
                      className="text-[oklch(0.796_0.13_162.48)] hover:text-[oklch(0.896_0.13_162.48)] hover:bg-[oklch(0.696_0.17_162.48_/_0.1)] rounded-lg text-xs"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(comment.id)}
                    className="text-[oklch(0.745_0.166_16.4)] hover:text-[oklch(0.845_0.166_16.4)] hover:bg-[oklch(0.645_0.246_16.4_/_0.1)] rounded-lg text-xs"
                  >
                    حذف
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {comments.length === 0 && (
        <div className="text-center py-8 text-[oklch(0.55_0.04_280)]">لا توجد تعليقات</div>
      )}
    </div>
  )
}
