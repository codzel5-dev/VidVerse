'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Upload, ImageIcon, RefreshCw } from 'lucide-react'
import { useAppStore } from '@/store/app-store'
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
  const [isProcessingThumb, setIsProcessingThumb] = useState(false)
  const [originalThumbnail, setOriginalThumbnail] = useState<string | null>(null)

  // Reset form when video changes
  if (video && video.id !== prevVideoId) {
    setPrevVideoId(video.id)
    setTitle(video.title || '')
    setDescription(video.description || '')
    setThumbnail(video.thumbnail || '')
    setOriginalThumbnail(video.thumbnail || '')
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
      useAppStore.getState().bumpVideoListVersion()
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

          {/* Thumbnail upload */}
          <div className="space-y-2">
            <Label className="text-[oklch(0.7_0.04_280)]">الصورة المصغرة</Label>
            <div className="flex gap-3">
              {/* Preview */}
              <div className="relative w-32 h-20 rounded-xl overflow-hidden border border-[oklch(0.25_0.04_280)] bg-[oklch(0.08_0.02_280)] shrink-0">
                {thumbnail ? (
                  <>
                    <img
                      src={thumbnail}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                    {isProcessingThumb && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-white" />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-[oklch(0.4_0.03_280)]" />
                  </div>
                )}
              </div>

              {/* Upload controls */}
              <div className="flex-1 space-y-2">
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[oklch(0.627_0.265_303.9_/_0.15)] hover:bg-[oklch(0.627_0.265_303.9_/_0.25)] text-[oklch(0.827_0.165_303.9)] text-xs font-medium cursor-pointer transition-all">
                  <Upload className="h-3.5 w-3.5" />
                  <span>رفع صورة مخصصة</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setIsProcessingThumb(true)
                        const reader = new FileReader()
                        reader.onload = (ev) => {
                          const img = new Image()
                          img.onload = () => {
                            const maxW = 1280, maxH = 720
                            let { width, height } = img
                            const ratio = Math.min(maxW / width, maxH / height, 1)
                            width = Math.round(width * ratio)
                            height = Math.round(height * ratio)
                            const canvas = document.createElement('canvas')
                            canvas.width = width
                            canvas.height = height
                            const ctx = canvas.getContext('2d')
                            if (ctx) {
                              ctx.drawImage(img, 0, 0, width, height)
                              setThumbnail(canvas.toDataURL('image/jpeg', 0.85))
                              toast.success('تم تحميل الصورة المصغرة')
                            }
                            setIsProcessingThumb(false)
                          }
                          img.onerror = () => { setIsProcessingThumb(false); toast.error('تعذر تحميل الصورة') }
                          img.src = ev.target?.result as string
                        }
                        reader.readAsDataURL(file)
                      }
                      e.target.value = ''
                    }}
                  />
                </label>
                {originalThumbnail && thumbnail !== originalThumbnail && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-[oklch(0.55_0.04_280)] hover:text-white p-0"
                    onClick={() => setThumbnail(originalThumbnail)}
                  >
                    <RefreshCw className="h-3 w-3 ml-1" />
                    استعادة الصورة الأصلية
                  </Button>
                )}
                <p className="text-xs text-[oklch(0.4_0.03_280)]">
                  {thumbnail ? (thumbnail.startsWith('data:') ? 'صورة مخصصة' : 'صورة من رابط') : 'بدون صورة'}
                </p>
              </div>
            </div>
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
