'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { useAuthStore } from '@/store/auth-store'
import { toast } from 'sonner'

interface Category {
  id: string
  name: string
}

interface VideoData {
  id: string
  title: string
  description: string | null
  thumbnail: string | null
  isFree: boolean
  isPublished: boolean
  isFeatured: boolean
  categoryId: string | null
}

interface VideoEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  video: VideoData | null
  onVideoUpdated: () => void
}

export default function VideoEditDialog({ open, onOpenChange, video, onVideoUpdated }: VideoEditDialogProps) {
  const user = useAuthStore((s) => s.user)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [thumbnail, setThumbnail] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [isFree, setIsFree] = useState(true)
  const [isPublished, setIsPublished] = useState(false)
  const [isFeatured, setIsFeatured] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [prevVideoId, setPrevVideoId] = useState<string | null>(null)

  // Reset form when video changes
  if (video && video.id !== prevVideoId) {
    setPrevVideoId(video.id)
    setTitle(video.title || '')
    setDescription(video.description || '')
    setThumbnail(video.thumbnail || '')
    setCategoryId(video.categoryId || '')
    setIsFree(video.isFree)
    setIsPublished(video.isPublished)
    setIsFeatured(video.isFeatured)
  }

  useEffect(() => {
    fetch('/api/category')
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => setCategories([]))
  }, [])

  const handleSubmit = async () => {
    if (!video || !title.trim()) {
      toast.error('عنوان الفيديو مطلوب')
      return
    }

    setIsSubmitting(true)

    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' }
      if (user?.id) headers['x-user-id'] = user.id

      const res = await fetch(`/api/video/${video.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          thumbnail: thumbnail.trim() || null,
          categoryId: categoryId || null,
          isFree,
          isPublished,
          isFeatured,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'فشل تحديث الفيديو')
      }

      toast.success('تم تحديث الفيديو بنجاح')
      onVideoUpdated()
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to update video:', error)
      toast.error(error instanceof Error ? error.message : 'حدث خطأ أثناء تحديث الفيديو')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-[oklch(0.13_0.028_280)] border-[oklch(0.25_0.04_280)] text-white max-h-[90vh] overflow-y-auto" showCloseButton>
        <DialogHeader>
          <DialogTitle className="text-white text-lg">تعديل الفيديو</DialogTitle>
          <DialogDescription className="text-[oklch(0.55_0.04_280)]">
            تعديل تفاصيل ومعلومات الفيديو
          </DialogDescription>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Title */}
          <div className="space-y-2">
            <Label className="text-[oklch(0.7_0.04_280)]">عنوان الفيديو *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="أدخل عنوان الفيديو"
              className="input-aurora rounded-xl text-white placeholder:text-[oklch(0.4_0.03_280)]"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-[oklch(0.7_0.04_280)]">الوصف</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="أدخل وصف الفيديو..."
              className="input-aurora rounded-xl text-white placeholder:text-[oklch(0.4_0.03_280)] min-h-[80px] resize-none"
            />
          </div>

          {/* Thumbnail URL */}
          <div className="space-y-2">
            <Label className="text-[oklch(0.7_0.04_280)]">رابط الصورة المصغرة</Label>
            <Input
              value={thumbnail}
              onChange={(e) => setThumbnail(e.target.value)}
              placeholder="https://example.com/thumbnail.jpg"
              className="input-aurora rounded-xl text-white placeholder:text-[oklch(0.4_0.03_280)]"
              dir="ltr"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label className="text-[oklch(0.7_0.04_280)]">التصنيف</Label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full h-9 rounded-xl bg-[oklch(0.13_0.028_280_/_0.6)] border border-[oklch(0.25_0.04_280)] px-3 text-sm text-white focus:border-[oklch(0.627_0.265_303.9_/_0.5)] focus:outline-none"
            >
              <option value="">بدون تصنيف</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Switches */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-[oklch(0.7_0.04_280)]">مجاني</Label>
              <Switch checked={isFree} onCheckedChange={setIsFree} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-[oklch(0.7_0.04_280)]">منشور</Label>
              <Switch checked={isPublished} onCheckedChange={setIsPublished} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-[oklch(0.7_0.04_280)]">مميز</Label>
              <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
            </div>
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || isSubmitting}
            className="w-full btn-aurora rounded-xl h-10"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                <span>جارٍ الحفظ...</span>
              </>
            ) : (
              <span>حفظ التعديلات</span>
            )}
          </Button>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
