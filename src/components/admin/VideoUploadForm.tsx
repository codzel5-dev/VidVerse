'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileVideo, X, Loader2, Check, ImageIcon, RefreshCw } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/store/auth-store'
import { useAppStore } from '@/store/app-store'
import { toast } from 'sonner'

interface Category {
  id: string
  name: string
  slug: string
}

interface VideoUploadFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onVideoCreated: () => void
}

type Step = 'upload' | 'details'

const ACCEPTED_TYPES = '.mp4,.webm,.avi,.mov,.mkv,video/mp4,video/webm,video/x-msvideo,video/quicktime,video/x-matroska'

export default function VideoUploadForm({ open, onOpenChange, onVideoCreated }: VideoUploadFormProps) {
  const user = useAuthStore((s) => s.user)

  const [step, setStep] = useState<Step>('upload')

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadSpeed, setUploadSpeed] = useState(0)
  const [uploadEta, setUploadEta] = useState(0)
  const [isUploading, setIsUploading] = useState(false)

  // Upload result (from AnonMP4)
  const [hostVideoId, setHostVideoId] = useState<string | null>(null)
  const [hostEmbedUrl, setHostEmbedUrl] = useState<string | null>(null)
  const [hostThumbnail, setHostThumbnail] = useState<string | null>(null)
  const [hostDeleteUrl, setHostDeleteUrl] = useState<string | null>(null)

  // Custom thumbnail state
  const [customThumbnail, setCustomThumbnail] = useState<string | null>(null)
  const [isProcessingThumb, setIsProcessingThumb] = useState(false)

  const xhrRef = useRef<XMLHttpRequest | null>(null)
  const lastProgressRef = useRef({ bytes: 0, time: 0 })

  // Details form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [isFree, setIsFree] = useState(true)
  const [isPublished, setIsPublished] = useState(false)
  const [isFeatured, setIsFeatured] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Categories
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    fetch('/api/category')
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => setCategories([]))
  }, [])

  // Reset form on open/close
  const resetForm = useCallback(() => {
    setStep('upload')
    setSelectedFile(null)
    setUploadProgress(0)
    setUploadSpeed(0)
    setUploadEta(0)
    setIsUploading(false)
    setHostVideoId(null)
    setHostEmbedUrl(null)
    setHostThumbnail(null)
    setHostDeleteUrl(null)
    setCustomThumbnail(null)
    setIsProcessingThumb(false)
    xhrRef.current = null
    setTitle('')
    setDescription('')
    setCategoryId('')
    setIsFree(true)
    setIsPublished(false)
    setIsFeatured(false)
    setIsSubmitting(false)
  }, [])

  const handleClose = () => {
    if (xhrRef.current) {
      xhrRef.current.abort()
    }
    resetForm()
    onOpenChange(false)
  }

  // Upload file to our backend which proxies to AnonMP4
  const startFileUpload = async () => {
    if (!selectedFile || !user?.id) return

    setIsUploading(true)
    setUploadProgress(0)
    lastProgressRef.current = { bytes: 0, time: Date.now() }

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('fileName', selectedFile.name)

      const xhr = new XMLHttpRequest()
      xhrRef.current = xhr

      // Track upload progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentage = Math.round((event.loaded / event.total) * 100)
          setUploadProgress(percentage)

          const now = Date.now()
          const elapsed = (now - lastProgressRef.current.time) / 1000
          if (elapsed > 0) {
            const bytesDiff = event.loaded - lastProgressRef.current.bytes
            const speed = bytesDiff / elapsed
            setUploadSpeed(speed)
            const remaining = event.total - event.loaded
            setUploadEta(remaining / speed)
          }
          lastProgressRef.current = { bytes: event.loaded, time: now }
        }
      }

      const uploadPromise = new Promise<{
        videoId: string
        embedUrl: string
        thumbnail: string
        deleteUrl: string
      }>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText)
              resolve(data)
            } catch {
              reject(new Error('فشل تحليل استجابة السيرفر'))
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText)
              reject(new Error(errorData.error || `خطأ في الرفع: ${xhr.status}`))
            } catch {
              reject(new Error(`خطأ في الرفع: ${xhr.status}`))
            }
          }
        }
        xhr.onerror = () => reject(new Error('حدث خطأ في الشبكة'))
        xhr.onabort = () => reject(new Error('تم إلغاء الرفع'))
      })

      xhr.open('POST', '/api/anonmp4/upload')
      xhr.setRequestHeader('x-user-id', user.id)
      xhr.send(formData)

      const result = await uploadPromise

      // Store AnonMP4 result
      setHostVideoId(result.videoId)
      setHostEmbedUrl(result.embedUrl)
      setHostThumbnail(result.thumbnail)
      setHostDeleteUrl(result.deleteUrl)

      // Auto-fill title from filename
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''))
      setStep('details')
      toast.success('تم رفع الفيديو بنجاح!')

    } catch (error) {
      console.error('Upload error:', error)
      if ((error as Error).message !== 'تم إلغاء الرفع') {
        toast.error(error instanceof Error ? error.message : 'حدث خطأ أثناء الرفع')
      }
    } finally {
      setIsUploading(false)
    }
  }

  // Submit video details and sync to local DB
  const handleSubmit = async () => {
    if (!hostVideoId || !title.trim()) {
      toast.error('يرجى ملء الحقول المطلوبة')
      return
    }

    setIsSubmitting(true)

    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' }
      if (user?.id) headers['x-user-id'] = user.id

      const res = await fetch('/api/anonmp4/sync', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          hostVideoId,
          title: title.trim(),
          description: description.trim() || undefined,
          categoryId: categoryId || undefined,
          isFree,
          isPublished,
          isFeatured,
          embedUrl: hostEmbedUrl,
          thumbnail: customThumbnail || hostThumbnail,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'فشل إنشاء الفيديو')
      }

      toast.success('تم إنشاء الفيديو بنجاح')
      // Bump global video list version so homepage refetches
      useAppStore.getState().bumpVideoListVersion()
      onVideoCreated()
      handleClose()
    } catch (error) {
      console.error('Failed to create video:', error)
      toast.error(error instanceof Error ? error.message : 'حدث خطأ أثناء إنشاء الفيديو')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatSpeed = (bytesPerSec: number) => {
    if (bytesPerSec < 1024) return `${bytesPerSec.toFixed(0)} B/s`
    if (bytesPerSec < 1024 * 1024) return `${(bytesPerSec / 1024).toFixed(1)} KB/s`
    return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`
  }

  const formatEta = (seconds: number) => {
    if (!seconds || !isFinite(seconds)) return '--'
    if (seconds < 60) return `${Math.round(seconds)} ثانية`
    if (seconds < 3600) return `${Math.round(seconds / 60)} دقيقة`
    return `${Math.round(seconds / 3600)} ساعة`
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
  }

  // Process and compress thumbnail image on client side
  const processThumbnail = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('يرجى اختيار ملف صورة')
      return
    }

    setIsProcessingThumb(true)
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        // Resize to max 1280x720, maintain aspect ratio
        const maxW = 1280
        const maxH = 720
        let { width, height } = img

        const ratio = Math.min(maxW / width, maxH / height, 1)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          setIsProcessingThumb(false)
          toast.error('تعذر معالجة الصورة')
          return
        }

        ctx.drawImage(img, 0, 0, width, height)
        // Export as JPEG quality 0.85 for smaller size
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
        setCustomThumbnail(dataUrl)
        setIsProcessingThumb(false)
        toast.success('تم تحميل الصورة المصغرة')
      }
      img.onerror = () => {
        setIsProcessingThumb(false)
        toast.error('تعذر تحميل الصورة')
      }
      img.src = e.target?.result as string
    }
    reader.onerror = () => {
      setIsProcessingThumb(false)
      toast.error('تعذر قراءة الملف')
    }
    reader.readAsDataURL(file)
  }

  const displayThumbnail = customThumbnail || hostThumbnail

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-[oklch(0.13_0.028_280)] border-[oklch(0.25_0.04_280)] text-white max-h-[90vh] overflow-y-auto" showCloseButton>
        <DialogHeader>
          <DialogTitle className="text-white text-lg">رفع فيديو جديد</DialogTitle>
          <DialogDescription className="text-[oklch(0.55_0.04_280)]">
            {step === 'upload' ? 'اختر ملف الفيديو لرفعه' : 'أدخل تفاصيل الفيديو'}
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === 'upload' ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {/* File Picker */}
              {!selectedFile ? (
                <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-[oklch(0.25_0.04_280)] rounded-2xl cursor-pointer hover:border-[oklch(0.627_0.265_303.9_/_0.5)] hover:bg-[oklch(0.627_0.265_303.9_/_0.05)] transition-all group">
                  <FileVideo className="h-12 w-12 text-[oklch(0.55_0.04_280)] mb-3 group-hover:text-[oklch(0.827_0.165_303.9)] transition-colors" />
                  <p className="text-sm text-[oklch(0.7_0.04_280)] font-medium">اختر ملف الفيديو</p>
                  <p className="text-xs text-[oklch(0.55_0.04_280)] mt-1">MP4, WebM, AVI, MOV, MKV — حتى 20 جيجا</p>
                  <input
                    type="file"
                    accept={ACCEPTED_TYPES}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) setSelectedFile(file)
                    }}
                  />
                </label>
              ) : (
                <div className="glass-card p-4 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-[oklch(0.627_0.265_303.9_/_0.15)] flex items-center justify-center shrink-0">
                      <FileVideo className="h-5 w-5 text-[oklch(0.827_0.165_303.9)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{selectedFile.name}</p>
                      <p className="text-xs text-[oklch(0.55_0.04_280)]">{formatFileSize(selectedFile.size)}</p>
                    </div>
                    {!isUploading && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-[oklch(0.55_0.04_280)] hover:text-[oklch(0.745_0.166_16.4)]"
                        onClick={() => setSelectedFile(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {isUploading && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 space-y-2"
                    >
                      <div className="progress-aurora h-2">
                        <motion.div
                          className="progress-aurora-bar h-full animate-gradient-flow"
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadProgress}%` }}
                          style={{ backgroundSize: '200% 200%' }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-[oklch(0.55_0.04_280)]">
                        <span>{uploadProgress}%</span>
                        <span>{formatSpeed(uploadSpeed)}</span>
                        <span>الوقت المتبقي: {formatEta(uploadEta)}</span>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Upload Button */}
              {selectedFile && !isUploading && !hostVideoId && (
                <Button
                  onClick={startFileUpload}
                  className="w-full btn-aurora rounded-xl h-10"
                >
                  <Upload className="h-4 w-4 ml-2" />
                  <span>بدء الرفع</span>
                </Button>
              )}

              {/* Info note */}
              <p className="text-xs text-[oklch(0.4_0.03_280)] text-center">
                يتم رفع الفيديو عبر AnonMP4 — استضافة مجانية بدون حساب
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Success indicator */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[oklch(0.696_0.17_162.48_/_0.1)] border border-[oklch(0.696_0.17_162.48_/_0.2)]">
                <Check className="h-4 w-4 text-[oklch(0.796_0.13_162.48)]" />
                <p className="text-sm text-[oklch(0.796_0.13_162.48)]">تم رفع الفيديو بنجاح! أدخل التفاصيل</p>
              </div>

              {hostVideoId && (
                <div className="flex items-center gap-2 text-xs text-[oklch(0.55_0.04_280)]">
                  <span>معرف AnonMP4:</span>
                  <Badge className="bg-[oklch(0.18_0.03_280)] text-[oklch(0.7_0.04_280)] border border-[oklch(0.25_0.04_280)] rounded-lg text-xs font-mono">
                    {hostVideoId}
                  </Badge>
                </div>
              )}

              {/* Thumbnail upload */}
              <div className="space-y-2">
                <Label className="text-[oklch(0.7_0.04_280)]">الصورة المصغرة</Label>
                <div className="flex gap-3">
                  {/* Preview */}
                  <div className="relative w-32 h-20 rounded-xl overflow-hidden border border-[oklch(0.25_0.04_280)] bg-[oklch(0.08_0.02_280)] shrink-0">
                    {displayThumbnail ? (
                      <>
                        <img
                          src={displayThumbnail}
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
                          if (file) processThumbnail(file)
                          e.target.value = ''
                        }}
                      />
                    </label>
                    {customThumbnail && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-[oklch(0.55_0.04_280)] hover:text-white p-0"
                        onClick={() => setCustomThumbnail(null)}
                      >
                        <RefreshCw className="h-3 w-3 ml-1" />
                        استخدام الصورة الافتراضية
                      </Button>
                    )}
                    <p className="text-xs text-[oklch(0.4_0.03_280)]">
                      {customThumbnail ? 'صورة مخصصة' : hostThumbnail ? 'صورة تلقائية من AnonMP4' : 'بدون صورة'}
                    </p>
                  </div>
                </div>
              </div>

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

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setStep('upload')}
                  className="flex-1 rounded-xl border-[oklch(0.25_0.04_280)] text-[oklch(0.7_0.04_280)] hover:bg-[oklch(0.18_0.03_280)]"
                >
                  رجوع
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!title.trim() || isSubmitting}
                  className="flex-1 btn-aurora rounded-xl"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                      <span>جارٍ الحفظ...</span>
                    </>
                  ) : (
                    <span>إنشاء الفيديو</span>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
