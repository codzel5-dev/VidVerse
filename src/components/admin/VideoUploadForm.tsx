'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Link, FileVideo, X, Loader2, Check } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/store/auth-store'
import { toast } from 'sonner'
import { Upload as TusUpload } from 'tus-js-client'

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

type UploadMode = 'file' | 'url'
type Step = 'upload' | 'details'

const ACCEPTED_TYPES = '.mp4,.webm,.avi,.mov,.mkv,video/mp4,video/webm,video/x-msvideo,video/quicktime,video/x-matroska'

export default function VideoUploadForm({ open, onOpenChange, onVideoCreated }: VideoUploadFormProps) {
  const user = useAuthStore((s) => s.user)

  const [mode, setMode] = useState<UploadMode>('file')
  const [step, setStep] = useState<Step>('upload')

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadSpeed, setUploadSpeed] = useState(0)
  const [uploadEta, setUploadEta] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [seekVideoId, setSeekVideoId] = useState<string | null>(null)
  const uploadRef = useRef<TusUpload | null>(null)
  const lastProgressRef = useRef({ bytes: 0, time: 0 })

  // URL import state
  const [importUrl, setImportUrl] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [, setImportTaskId] = useState<string | null>(null)
  const [importStatus, setImportStatus] = useState<string>('')
  const importPollRef = useRef<NodeJS.Timeout | null>(null)

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
    setMode('file')
    setStep('upload')
    setSelectedFile(null)
    setUploadProgress(0)
    setUploadSpeed(0)
    setUploadEta(0)
    setIsUploading(false)
    setSeekVideoId(null)
    uploadRef.current = null
    setImportUrl('')
    setIsImporting(false)
    setImportTaskId(null)
    setImportStatus('')
    if (importPollRef.current) clearInterval(importPollRef.current)
    setTitle('')
    setDescription('')
    setCategoryId('')
    setIsFree(true)
    setIsPublished(false)
    setIsFeatured(false)
    setIsSubmitting(false)
  }, [])

  const handleClose = () => {
    // Cancel ongoing uploads
    if (uploadRef.current) {
      uploadRef.current.abort()
    }
    if (importPollRef.current) {
      clearInterval(importPollRef.current)
    }
    resetForm()
    onOpenChange(false)
  }

  // TUS file upload
  const startFileUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setUploadProgress(0)
    lastProgressRef.current = { bytes: 0, time: Date.now() }

    try {
      const headers: HeadersInit = {}
      if (user?.id) headers['x-user-id'] = user.id

      const uploadInfoRes = await fetch('/api/seekstreaming/upload-info', { headers })
      const { tusUrl, accessToken } = await uploadInfoRes.json()

      const upload = new TusUpload(selectedFile, {
        endpoint: tusUrl,
        chunkSize: 50 * 1024 * 1024,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        metadata: {
          filename: selectedFile.name,
          filetype: selectedFile.type,
        },
        onError: (error) => {
          console.error('TUS upload error:', error)
          toast.error('حدث خطأ أثناء رفع الفيديو')
          setIsUploading(false)
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          const percentage = Math.round((bytesUploaded / bytesTotal) * 100)
          setUploadProgress(percentage)

          // Calculate speed
          const now = Date.now()
          const elapsed = (now - lastProgressRef.current.time) / 1000
          if (elapsed > 0) {
            const bytesDiff = bytesUploaded - lastProgressRef.current.bytes
            const speed = bytesDiff / elapsed
            setUploadSpeed(speed)
            const remaining = bytesTotal - bytesUploaded
            setUploadEta(remaining / speed)
          }
          lastProgressRef.current = { bytes: bytesUploaded, time: now }
        },
        onSuccess: () => {
          const videoId = upload.url?.split('/').pop() || null
          if (videoId) {
            setSeekVideoId(videoId)
            setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''))
            setStep('details')
          } else {
            toast.error('لم يتم الحصول على معرف الفيديو')
          }
          setIsUploading(false)
        },
      })

      uploadRef.current = upload
      upload.start()
    } catch (error) {
      console.error('Failed to start upload:', error)
      toast.error('حدث خطأ أثناء بدء الرفع')
      setIsUploading(false)
    }
  }

  // URL import
  const startUrlImport = async () => {
    if (!importUrl.trim()) return

    setIsImporting(true)
    setImportStatus('جارٍ إنشاء مهمة الاستيراد...')

    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' }
      if (user?.id) headers['x-user-id'] = user.id

      const res = await fetch('/api/seekstreaming/advance-upload', {
        method: 'POST',
        headers,
        body: JSON.stringify({ url: importUrl }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'فشل الاستيراد')
      }

      const taskId = data.task?.id || data.task?.taskId
      if (!taskId) {
        throw new Error('لم يتم الحصول على معرف المهمة')
      }

      setImportTaskId(taskId)
      setImportStatus('جارٍ استيراد الفيديو...')

      // Poll for status
      importPollRef.current = setInterval(async () => {
        try {
          const pollHeaders: HeadersInit = {}
          if (user?.id) pollHeaders['x-user-id'] = user.id
          const pollRes = await fetch(`/api/seekstreaming/advance-upload?taskId=${taskId}`, { headers: pollHeaders })
          const pollData = await pollRes.json()

          const status = pollData.task?.status
          setImportStatus(status === 'processing' ? 'جارٍ المعالجة...' : status === 'downloading' ? 'جارٍ التحميل...' : `الحالة: ${status || 'قيد الانتظار'}`)

          if (status === 'completed' || status === 'done' || status === 'ready') {
            if (importPollRef.current) clearInterval(importPollRef.current)
            const videoId = pollData.task?.videoId || pollData.task?.id || taskId
            setSeekVideoId(videoId)
            setTitle(importUrl.split('/').pop()?.replace(/\.[^/.]+$/, '') || 'فيديو مستورد')
            setStep('details')
            setIsImporting(false)
            toast.success('تم استيراد الفيديو بنجاح')
          } else if (status === 'failed' || status === 'error') {
            if (importPollRef.current) clearInterval(importPollRef.current)
            toast.error('فشل استيراد الفيديو')
            setIsImporting(false)
          }
        } catch {
          if (importPollRef.current) clearInterval(importPollRef.current)
          toast.error('حدث خطأ أثناء التحقق من حالة الاستيراد')
          setIsImporting(false)
        }
      }, 5000)
    } catch (error) {
      console.error('Failed to start import:', error)
      toast.error(error instanceof Error ? error.message : 'حدث خطأ أثناء الاستيراد')
      setIsImporting(false)
    }
  }

  // Submit video details
  const handleSubmit = async () => {
    if (!seekVideoId || !title.trim()) {
      toast.error('يرجى ملء الحقول المطلوبة')
      return
    }

    setIsSubmitting(true)

    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' }
      if (user?.id) headers['x-user-id'] = user.id

      const res = await fetch('/api/seekstreaming/sync', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          seekVideoId,
          title: title.trim(),
          description: description.trim() || undefined,
          categoryId: categoryId || undefined,
          isFree,
          isPublished,
          isFeatured,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'فشل إنشاء الفيديو')
      }

      toast.success('تم إنشاء الفيديو بنجاح')
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-[oklch(0.13_0.028_280)] border-[oklch(0.25_0.04_280)] text-white max-h-[90vh] overflow-y-auto" showCloseButton>
        <DialogHeader>
          <DialogTitle className="text-white text-lg">رفع فيديو جديد</DialogTitle>
          <DialogDescription className="text-[oklch(0.55_0.04_280)]">
            {step === 'upload' ? 'اختر طريقة رفع الفيديو' : 'أدخل تفاصيل الفيديو'}
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
              {/* Mode Tabs */}
              <div className="flex gap-2 p-1 bg-[oklch(0.08_0.02_280)] rounded-xl">
                <button
                  onClick={() => setMode('file')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                    mode === 'file'
                      ? 'bg-[oklch(0.627_0.265_303.9_/_0.15)] text-[oklch(0.827_0.165_303.9)]'
                      : 'text-[oklch(0.55_0.04_280)] hover:text-[oklch(0.7_0.04_280)]'
                  }`}
                >
                  <Upload className="h-4 w-4" />
                  رفع ملف
                </button>
                <button
                  onClick={() => setMode('url')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                    mode === 'url'
                      ? 'bg-[oklch(0.627_0.265_303.9_/_0.15)] text-[oklch(0.827_0.165_303.9)]'
                      : 'text-[oklch(0.55_0.04_280)] hover:text-[oklch(0.7_0.04_280)]'
                  }`}
                >
                  <Link className="h-4 w-4" />
                  استيراد من رابط
                </button>
              </div>

              {mode === 'file' ? (
                <div className="space-y-4">
                  {/* File Picker */}
                  {!selectedFile ? (
                    <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-[oklch(0.25_0.04_280)] rounded-2xl cursor-pointer hover:border-[oklch(0.627_0.265_303.9_/_0.5)] hover:bg-[oklch(0.627_0.265_303.9_/_0.05)] transition-all group">
                      <FileVideo className="h-12 w-12 text-[oklch(0.55_0.04_280)] mb-3 group-hover:text-[oklch(0.827_0.165_303.9)] transition-colors" />
                      <p className="text-sm text-[oklch(0.7_0.04_280)] font-medium">اختر ملف الفيديو</p>
                      <p className="text-xs text-[oklch(0.55_0.04_280)] mt-1">MP4, WebM, AVI, MOV, MKV</p>
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
                  {selectedFile && !isUploading && !seekVideoId && (
                    <Button
                      onClick={startFileUpload}
                      className="w-full btn-aurora rounded-xl h-10"
                    >
                      <Upload className="h-4 w-4 ml-2" />
                      <span>بدء الرفع</span>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* URL Input */}
                  <div className="space-y-2">
                    <Label className="text-[oklch(0.7_0.04_280)]">رابط الفيديو</Label>
                    <Input
                      value={importUrl}
                      onChange={(e) => setImportUrl(e.target.value)}
                      placeholder="أدخل رابط الفيديو أو رابط الماغنت..."
                      className="input-aurora rounded-xl text-white placeholder:text-[oklch(0.4_0.03_280)]"
                      disabled={isImporting}
                    />
                    <p className="text-xs text-[oklch(0.55_0.04_280)]">
                      يدعم الروابط المباشرة وروابط الماغنت
                    </p>
                  </div>

                  {/* Import Status */}
                  {isImporting && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="glass-card p-4 rounded-2xl space-y-3"
                    >
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-[oklch(0.827_0.165_303.9)]" />
                        <p className="text-sm text-white">{importStatus}</p>
                      </div>
                      <div className="progress-aurora h-1.5">
                        <div className="progress-aurora-bar h-full animate-shimmer" style={{ width: '60%' }} />
                      </div>
                    </motion.div>
                  )}

                  {/* Import Button */}
                  <Button
                    onClick={startUrlImport}
                    disabled={!importUrl.trim() || isImporting}
                    className="w-full btn-aurora rounded-xl h-10"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                        <span>جارٍ الاستيراد...</span>
                      </>
                    ) : (
                      <>
                        <Link className="h-4 w-4 ml-2" />
                        <span>استيراد</span>
                      </>
                    )}
                  </Button>
                </div>
              )}
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

              {seekVideoId && (
                <div className="flex items-center gap-2 text-xs text-[oklch(0.55_0.04_280)]">
                  <span>معرف SeekStreaming:</span>
                  <Badge className="bg-[oklch(0.18_0.03_280)] text-[oklch(0.7_0.04_280)] border border-[oklch(0.25_0.04_280)] rounded-lg text-xs font-mono">
                    {seekVideoId}
                  </Badge>
                </div>
              )}

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
