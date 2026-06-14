'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Loader2,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  BookOpen,
  Video,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/store/auth-store'
import { toast } from 'sonner'

interface Category {
  id: string
  name: string
}

interface VideoOption {
  id: string
  title: string
  isFree: boolean
}

interface LessonData {
  id: string
  title: string
  description: string | null
  order: number
  videoId: string | null
  isFree: boolean
  video: { id: string; title: string; duration: number; isFree: boolean } | null
}

interface CourseData {
  id: string
  title: string
  description: string | null
  thumbnail: string | null
  price: number
  currency: string
  level: string
  isPublished: boolean
  isFeatured: boolean
  categoryId: string | null
  lessons: LessonData[]
}

interface CourseEditFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  courseId: string | null
  onCourseUpdated: () => void
}

const levels = [
  { value: 'beginner', label: 'مبتدئ' },
  { value: 'intermediate', label: 'متوسط' },
  { value: 'advanced', label: 'متقدم' },
]

const currencies = [
  { value: 'USD', label: 'دولار أمريكي (USD)' },
  { value: 'EUR', label: 'يورو (EUR)' },
  { value: 'SAR', label: 'ريال سعودي (SAR)' },
  { value: 'EGP', label: 'جنيه مصري (EGP)' },
  { value: 'AED', label: 'درهم إماراتي (AED)' },
]

type TabView = 'details' | 'lessons'

export default function CourseEditForm({ open, onOpenChange, courseId, onCourseUpdated }: CourseEditFormProps) {
  const user = useAuthStore((s) => s.user)

  const [activeTab, setActiveTab] = useState<TabView>('details')
  const [isLoading, setIsLoading] = useState(false)

  // Course fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [thumbnail, setThumbnail] = useState('')
  const [price, setPrice] = useState('0')
  const [currency, setCurrency] = useState('USD')
  const [level, setLevel] = useState('beginner')
  const [categoryId, setCategoryId] = useState('')
  const [isPublished, setIsPublished] = useState(false)
  const [isFeatured, setIsFeatured] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Lessons
  const [lessons, setLessons] = useState<LessonData[]>([])
  const [videos, setVideos] = useState<VideoOption[]>([])

  // New lesson form
  const [newLessonTitle, setNewLessonTitle] = useState('')
  const [newLessonDesc, setNewLessonDesc] = useState('')
  const [newLessonVideoId, setNewLessonVideoId] = useState('')
  const [newLessonIsFree, setNewLessonIsFree] = useState(false)
  const [isAddingLesson, setIsAddingLesson] = useState(false)

  // Categories
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    fetch('/api/category')
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => setCategories([]))
  }, [])

  // Load course data when dialog opens
  useEffect(() => {
    if (!open || !courseId) return

    let cancelled = false

    const loadData = async () => {
      setIsLoading(true)

      try {
        const headers: HeadersInit = {}
        if (user?.id) headers['x-user-id'] = user.id

        const res = await fetch(`/api/course/${courseId}`, { headers })
        const data = await res.json()

        if (cancelled) return
        if (!res.ok) throw new Error(data.error)

        const course: CourseData = data.course
        setTitle(course.title)
        setDescription(course.description || '')
        setThumbnail(course.thumbnail || '')
        setPrice(String(course.price))
        setCurrency(course.currency || 'USD')
        setLevel(course.level || 'beginner')
        setCategoryId(course.categoryId || '')
        setIsPublished(course.isPublished)
        setIsFeatured(course.isFeatured)
        setLessons(course.lessons || [])
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load course:', error)
          toast.error('حدث خطأ أثناء تحميل بيانات الكورس')
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }

      // Load videos for lesson linking
      try {
        const vHeaders: HeadersInit = {}
        if (user?.id) vHeaders['x-user-id'] = user.id

        const vRes = await fetch('/api/admin/videos?limit=100', { headers: vHeaders })
        const vData = await vRes.json()

        if (!cancelled && vRes.ok) {
          setVideos(
            (vData.videos || []).map((v: { id: string; title: string; isFree: boolean }) => ({
              id: v.id,
              title: v.title,
              isFree: v.isFree,
            }))
          )
        }
      } catch {
        // Non-critical
      }
    }

    loadData()

    return () => { cancelled = true }
  }, [open, courseId, user?.id])

  const handleSaveCourse = async () => {
    if (!courseId || !title.trim()) {
      toast.error('عنوان الكورس مطلوب')
      return
    }

    setIsSubmitting(true)

    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' }
      if (user?.id) headers['x-user-id'] = user.id

      const res = await fetch(`/api/course/${courseId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          thumbnail: thumbnail.trim() || null,
          price: parseFloat(price) || 0,
          currency,
          level,
          categoryId: categoryId || null,
          isPublished,
          isFeatured,
        }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'فشل تحديث الكورس')

      toast.success('تم تحديث الكورس بنجاح')
      onCourseUpdated()
    } catch (error) {
      console.error('Failed to update course:', error)
      toast.error(error instanceof Error ? error.message : 'حدث خطأ أثناء تحديث الكورس')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddLesson = async () => {
    if (!courseId || !newLessonTitle.trim()) {
      toast.error('عنوان الدرس مطلوب')
      return
    }

    setIsAddingLesson(true)

    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' }
      if (user?.id) headers['x-user-id'] = user.id

      const res = await fetch(`/api/course/${courseId}/lessons`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: newLessonTitle.trim(),
          description: newLessonDesc.trim() || undefined,
          videoId: newLessonVideoId || undefined,
          isFree: newLessonIsFree,
          order: lessons.length + 1,
        }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'فشل إضافة الدرس')

      setLessons((prev) => [...prev, data.lesson])
      setNewLessonTitle('')
      setNewLessonDesc('')
      setNewLessonVideoId('')
      setNewLessonIsFree(false)
      toast.success('تم إضافة الدرس بنجاح')
    } catch (error) {
      console.error('Failed to add lesson:', error)
      toast.error(error instanceof Error ? error.message : 'حدث خطأ أثناء إضافة الدرس')
    } finally {
      setIsAddingLesson(false)
    }
  }

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الدرس؟')) return

    try {
      const headers: HeadersInit = {}
      if (user?.id) headers['x-user-id'] = user.id

      const res = await fetch(`/api/lesson/${lessonId}`, {
        method: 'DELETE',
        headers,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'فشل حذف الدرس')
      }

      setLessons((prev) => prev.filter((l) => l.id !== lessonId))
      toast.success('تم حذف الدرس')
    } catch (error) {
      console.error('Failed to delete lesson:', error)
      toast.error(error instanceof Error ? error.message : 'حدث خطأ أثناء حذف الدرس')
    }
  }

  const handleMoveLesson = async (lessonId: string, direction: 'up' | 'down') => {
    const currentIndex = lessons.findIndex((l) => l.id === lessonId)
    if (currentIndex === -1) return

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (targetIndex < 0 || targetIndex >= lessons.length) return

    const newLessons = [...lessons]
    const temp = newLessons[currentIndex]
    newLessons[currentIndex] = newLessons[targetIndex]
    newLessons[targetIndex] = temp

    // Update order values
    const updatedLessons = newLessons.map((l, i) => ({ ...l, order: i + 1 }))
    setLessons(updatedLessons)

    // Update on server
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' }
      if (user?.id) headers['x-user-id'] = user.id

      // Update the swapped lessons
      for (const l of [updatedLessons[currentIndex], updatedLessons[targetIndex]]) {
        await fetch(`/api/lesson/${l.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ order: l.order }),
        })
      }
    } catch (error) {
      console.error('Failed to reorder lessons:', error)
      toast.error('حدث خطأ أثناء إعادة ترتيب الدروس')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-[oklch(0.13_0.028_280)] border-[oklch(0.25_0.04_280)] text-white max-h-[90vh] overflow-y-auto" showCloseButton>
        <DialogHeader>
          <DialogTitle className="text-white text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[oklch(0.827_0.165_303.9)]" />
            تعديل الكورس
          </DialogTitle>
          <DialogDescription className="text-[oklch(0.55_0.04_280)]">
            تعديل تفاصيل الكورس وإدارة الدروس
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[oklch(0.627_0.265_303.9)]" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Tab Switcher */}
            <div className="flex gap-2 p-1 bg-[oklch(0.08_0.02_280)] rounded-xl">
              <button
                onClick={() => setActiveTab('details')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'details'
                    ? 'bg-[oklch(0.627_0.265_303.9_/_0.15)] text-[oklch(0.827_0.165_303.9)]'
                    : 'text-[oklch(0.55_0.04_280)] hover:text-[oklch(0.7_0.04_280)]'
                }`}
              >
                <BookOpen className="h-4 w-4" />
                تفاصيل الكورس
              </button>
              <button
                onClick={() => setActiveTab('lessons')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'lessons'
                    ? 'bg-[oklch(0.627_0.265_303.9_/_0.15)] text-[oklch(0.827_0.165_303.9)]'
                    : 'text-[oklch(0.55_0.04_280)] hover:text-[oklch(0.7_0.04_280)]'
                }`}
              >
                <Video className="h-4 w-4" />
                الدروس ({lessons.length})
              </button>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'details' ? (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  {/* Title */}
                  <div className="space-y-2">
                    <Label className="text-[oklch(0.7_0.04_280)]">عنوان الكورس *</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="أدخل عنوان الكورس"
                      className="input-aurora rounded-xl text-white placeholder:text-[oklch(0.4_0.03_280)]"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label className="text-[oklch(0.7_0.04_280)]">الوصف</Label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="أدخل وصف الكورس..."
                      className="input-aurora rounded-xl text-white placeholder:text-[oklch(0.4_0.03_280)] min-h-[80px] resize-none"
                    />
                  </div>

                  {/* Thumbnail */}
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

                  {/* Price & Currency */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-[oklch(0.7_0.04_280)]">السعر</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="input-aurora rounded-xl text-white"
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[oklch(0.7_0.04_280)]">العملة</Label>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full h-9 rounded-xl bg-[oklch(0.13_0.028_280_/_0.6)] border border-[oklch(0.25_0.04_280)] px-3 text-sm text-white focus:border-[oklch(0.627_0.265_303.9_/_0.5)] focus:outline-none"
                      >
                        {currencies.map((c) => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Level */}
                  <div className="space-y-2">
                    <Label className="text-[oklch(0.7_0.04_280)]">المستوى</Label>
                    <div className="flex gap-2">
                      {levels.map((l) => (
                        <button
                          key={l.value}
                          onClick={() => setLevel(l.value)}
                          className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all ${
                            level === l.value
                              ? 'bg-[oklch(0.627_0.265_303.9_/_0.15)] text-[oklch(0.827_0.165_303.9)] border border-[oklch(0.627_0.265_303.9_/_0.3)]'
                              : 'bg-[oklch(0.08_0.02_280)] text-[oklch(0.55_0.04_280)] border border-[oklch(0.25_0.04_280)]'
                          }`}
                        >
                          {l.label}
                        </button>
                      ))}
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
                      <Label className="text-[oklch(0.7_0.04_280)]">منشور</Label>
                      <Switch checked={isPublished} onCheckedChange={setIsPublished} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-[oklch(0.7_0.04_280)]">مميز</Label>
                      <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
                    </div>
                  </div>

                  {/* Save Button */}
                  <Button
                    onClick={handleSaveCourse}
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
              ) : (
                <motion.div
                  key="lessons"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  {/* Lessons List */}
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {lessons.length === 0 ? (
                      <div className="text-center py-8 text-[oklch(0.55_0.04_280)]">
                        لا توجد دروس بعد
                      </div>
                    ) : (
                      lessons.map((lesson, index) => (
                        <motion.div
                          key={lesson.id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="glass-card p-3 rounded-xl"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col gap-0.5">
                              <button
                                onClick={() => handleMoveLesson(lesson.id, 'up')}
                                disabled={index === 0}
                                className="p-0.5 text-[oklch(0.55_0.04_280)] hover:text-[oklch(0.827_0.165_303.9)] disabled:opacity-30"
                              >
                                <ChevronUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleMoveLesson(lesson.id, 'down')}
                                disabled={index === lessons.length - 1}
                                className="p-0.5 text-[oklch(0.55_0.04_280)] hover:text-[oklch(0.827_0.165_303.9)] disabled:opacity-30"
                              >
                                <ChevronDown className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-[oklch(0.55_0.04_280)]">#{lesson.order}</span>
                                <p className="text-sm text-white truncate">{lesson.title}</p>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                {lesson.video && (
                                  <Badge className="bg-[oklch(0.627_0.265_303.9_/_0.1)] text-[oklch(0.827_0.165_303.9)] border-0 rounded-md text-xs">
                                    <Video className="h-3 w-3 ml-1" />
                                    {lesson.video.title}
                                  </Badge>
                                )}
                                {lesson.isFree && (
                                  <Badge className="badge-free border-0 rounded-md text-xs">مجاني</Badge>
                                )}
                              </div>
                            </div>

                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-[oklch(0.55_0.04_280)] hover:text-[oklch(0.745_0.166_16.4)]"
                              onClick={() => handleDeleteLesson(lesson.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>

                  {/* Add Lesson Form */}
                  <div className="cosmic-divider" />

                  <div className="space-y-3">
                    <p className="text-sm font-medium text-[oklch(0.7_0.04_280)]">إضافة درس جديد</p>

                    <div className="space-y-2">
                      <Input
                        value={newLessonTitle}
                        onChange={(e) => setNewLessonTitle(e.target.value)}
                        placeholder="عنوان الدرس *"
                        className="input-aurora rounded-xl text-white placeholder:text-[oklch(0.4_0.03_280)]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Textarea
                        value={newLessonDesc}
                        onChange={(e) => setNewLessonDesc(e.target.value)}
                        placeholder="وصف الدرس (اختياري)"
                        className="input-aurora rounded-xl text-white placeholder:text-[oklch(0.4_0.03_280)] min-h-[60px] resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs text-[oklch(0.55_0.04_280)]">الفيديو المرتبط</Label>
                        <select
                          value={newLessonVideoId}
                          onChange={(e) => setNewLessonVideoId(e.target.value)}
                          className="w-full h-8 rounded-lg bg-[oklch(0.13_0.028_280_/_0.6)] border border-[oklch(0.25_0.04_280)] px-2 text-xs text-white focus:border-[oklch(0.627_0.265_303.9_/_0.5)] focus:outline-none"
                        >
                          <option value="">بدون فيديو</option>
                          {videos.map((v) => (
                            <option key={v.id} value={v.id}>{v.title}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-end gap-2">
                        <div className="flex items-center gap-2 pb-1">
                          <Switch checked={newLessonIsFree} onCheckedChange={setNewLessonIsFree} size="sm" />
                          <Label className="text-xs text-[oklch(0.55_0.04_280)]">مجاني</Label>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handleAddLesson}
                      disabled={!newLessonTitle.trim() || isAddingLesson}
                      className="w-full rounded-xl bg-[oklch(0.627_0.265_303.9_/_0.1)] text-[oklch(0.827_0.165_303.9)] border border-[oklch(0.627_0.265_303.9_/_0.2)] hover:bg-[oklch(0.627_0.265_303.9_/_0.2)] h-9"
                    >
                      {isAddingLesson ? (
                        <>
                          <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                          <span>جارٍ الإضافة...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 ml-2" />
                          <span>إضافة درس</span>
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
