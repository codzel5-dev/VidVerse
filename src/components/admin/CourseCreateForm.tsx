'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Loader2, BookOpen } from 'lucide-react'
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

interface CourseCreateFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCourseCreated: () => void
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

export default function CourseCreateForm({ open, onOpenChange, onCourseCreated }: CourseCreateFormProps) {
  const user = useAuthStore((s) => s.user)

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
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    fetch('/api/category')
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => setCategories([]))
  }, [])

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setThumbnail('')
    setPrice('0')
    setCurrency('USD')
    setLevel('beginner')
    setCategoryId('')
    setIsPublished(false)
    setIsFeatured(false)
    setIsSubmitting(false)
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('عنوان الكورس مطلوب')
      return
    }

    setIsSubmitting(true)

    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' }
      if (user?.id) headers['x-user-id'] = user.id

      const res = await fetch('/api/course', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          thumbnail: thumbnail.trim() || undefined,
          price: parseFloat(price) || 0,
          currency,
          level,
          categoryId: categoryId || undefined,
          isPublished,
          isFeatured,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'فشل إنشاء الكورس')
      }

      toast.success('تم إنشاء الكورس بنجاح')
      onCourseCreated()
      resetForm()
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to create course:', error)
      toast.error(error instanceof Error ? error.message : 'حدث خطأ أثناء إنشاء الكورس')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v) }}>
      <DialogContent className="sm:max-w-lg bg-[oklch(0.13_0.028_280)] border-[oklch(0.25_0.04_280)] text-white max-h-[90vh] overflow-y-auto" showCloseButton>
        <DialogHeader>
          <DialogTitle className="text-white text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[oklch(0.827_0.165_303.9)]" />
            إنشاء كورس جديد
          </DialogTitle>
          <DialogDescription className="text-[oklch(0.55_0.04_280)]">
            أدخل تفاصيل الكورس الجديد
          </DialogDescription>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
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
                className="input-aurora rounded-xl text-white placeholder:text-[oklch(0.4_0.03_280)]"
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
                      : 'bg-[oklch(0.08_0.02_280)] text-[oklch(0.55_0.04_280)] border border-[oklch(0.25_0.04_280)] hover:border-[oklch(0.25_0.04_280_/_0.5)]'
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

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || isSubmitting}
            className="w-full btn-aurora rounded-xl h-10"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                <span>جارٍ الإنشاء...</span>
              </>
            ) : (
              <span>إنشاء الكورس</span>
            )}
          </Button>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
