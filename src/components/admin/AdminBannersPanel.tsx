'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Megaphone,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Image as ImageIcon,
  Video as VideoIcon,
  ExternalLink,
  Calendar,
  ArrowUp,
  X,
  Save,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuthStore } from '@/store/auth-store'
import { toast } from 'sonner'

interface AdBanner {
  id: string
  title: string
  subtitle: string | null
  description: string | null
  imageUrl: string | null
  videoUrl: string | null
  linkUrl: string | null
  buttonText: string | null
  isActive: boolean
  order: number
  startsAt: string | null
  endsAt: string | null
  createdAt: string
  updatedAt: string
}

interface BannerFormState {
  title: string
  subtitle: string
  description: string
  imageUrl: string
  videoUrl: string
  linkUrl: string
  buttonText: string
  order: string
  isActive: boolean
  startsAt: string
  endsAt: string
}

const emptyForm: BannerFormState = {
  title: '',
  subtitle: '',
  description: '',
  imageUrl: '',
  videoUrl: '',
  linkUrl: '',
  buttonText: '',
  order: '0',
  isActive: true,
  startsAt: '',
  endsAt: '',
}

// Convert an ISO date string to a value usable in datetime-local input
function toDateInputValue(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function AdminBannersPanel() {
  const user = useAuthStore((s) => s.user)
  const userId = user?.id

  const [banners, setBanners] = useState<AdBanner[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<BannerFormState>(emptyForm)
  const [isSaving, setIsSaving] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!userId) {
        setIsLoading(false)
        return
      }
      try {
        const res = await fetch('/api/admin/banners', {
          headers: { 'x-user-id': userId },
        })
        const data = await res.json()
        if (cancelled) return
        if (!res.ok) {
          throw new Error(data.error || 'فشل تحميل البانرات')
        }
        setBanners(data.banners || [])
      } catch (error) {
        if (cancelled) return
        console.error('Banners load error:', error)
        toast.error(error instanceof Error ? error.message : 'فشل تحميل البانرات')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [userId, refreshKey])

  const reload = () => setRefreshKey((k) => k + 1)

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEdit = (banner: AdBanner) => {
    setEditingId(banner.id)
    setForm({
      title: banner.title,
      subtitle: banner.subtitle || '',
      description: banner.description || '',
      imageUrl: banner.imageUrl || '',
      videoUrl: banner.videoUrl || '',
      linkUrl: banner.linkUrl || '',
      buttonText: banner.buttonText || '',
      order: String(banner.order ?? 0),
      isActive: banner.isActive,
      startsAt: toDateInputValue(banner.startsAt),
      endsAt: toDateInputValue(banner.endsAt),
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!userId) return
    if (!form.title.trim()) {
      toast.error('العنوان مطلوب')
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || null,
        description: form.description.trim() || null,
        imageUrl: form.imageUrl.trim() || null,
        videoUrl: form.videoUrl.trim() || null,
        linkUrl: form.linkUrl.trim() || null,
        buttonText: form.buttonText.trim() || null,
        order: Number(form.order) || 0,
        isActive: form.isActive,
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      }

      const isEditing = !!editingId
      const url = isEditing
        ? `/api/admin/banners/${editingId}`
        : '/api/admin/banners'
      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'فشل حفظ البانر')
      }

      toast.success(isEditing ? 'تم تحديث البانر بنجاح' : 'تم إنشاء البانر بنجاح')
      setDialogOpen(false)
      setEditingId(null)
      setForm(emptyForm)
      reload()
    } catch (error) {
      console.error('Banner save error:', error)
      toast.error(error instanceof Error ? error.message : 'فشل حفظ البانر')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (banner: AdBanner) => {
    if (!userId) return
    const confirmed = window.confirm(
      `هل أنت متأكد من حذف البانر "${banner.title}"؟`
    )
    if (!confirmed) return

    try {
      const res = await fetch(`/api/admin/banners/${banner.id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': userId },
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || 'فشل حذف البانر')
      }
      toast.success('تم حذف البانر')
      reload()
    } catch (error) {
      console.error('Banner delete error:', error)
      toast.error(error instanceof Error ? error.message : 'فشل حذف البانر')
    }
  }

  const handleToggleActive = async (banner: AdBanner) => {
    if (!userId) return
    setTogglingId(banner.id)
    // Optimistic update
    const newValue = !banner.isActive
    setBanners((prev) =>
      prev.map((b) => (b.id === banner.id ? { ...b, isActive: newValue } : b))
    )
    try {
      const res = await fetch(`/api/admin/banners/${banner.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({ isActive: newValue }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || 'فشل تحديث حالة البانر')
      }
      toast.success(newValue ? 'تم تفعيل البانر' : 'تم إيقاف البانر')
    } catch (error) {
      // Rollback on error
      setBanners((prev) =>
        prev.map((b) => (b.id === banner.id ? { ...b, isActive: banner.isActive } : b))
      )
      console.error('Banner toggle error:', error)
      toast.error(error instanceof Error ? error.message : 'فشل تحديث حالة البانر')
    } finally {
      setTogglingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-[oklch(0.627_0.265_303.9)]" />
        <span className="mr-2 text-[oklch(0.55_0.04_280)]">جارٍ تحميل البانرات...</span>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header card */}
      <div className="glass-card p-6 rounded-2xl border border-[oklch(0.25_0.04_280)]">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 rounded-2xl bg-[oklch(0.627_0.265_303.9_/_0.15)] flex items-center justify-center shrink-0">
              <Megaphone className="h-5 w-5 text-[oklch(0.827_0.165_303.9)]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">إدارة الإعلانات</h2>
              <p className="text-sm text-[oklch(0.55_0.04_280)] mt-1">
                إنشاء وإدارة البانرات الإعلانية. كل بانر يعرض صورة على اليسار وفيديو تلقائي على اليمين.
              </p>
            </div>
          </div>
          <Button onClick={openCreate} className="btn-aurora rounded-xl">
            <Plus className="h-4 w-4 ml-2" />
            <span>إضافة بانر</span>
          </Button>
        </div>
      </div>

      {/* Banners list / empty state */}
      {banners.length === 0 ? (
        <div className="glass-card p-10 rounded-2xl border border-[oklch(0.25_0.04_280)] text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-[oklch(0.627_0.265_303.9_/_0.1)] flex items-center justify-center mb-4">
            <Megaphone className="h-7 w-7 text-[oklch(0.827_0.165_303.9)]" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1">لا توجد بانرات بعد</h3>
          <p className="text-sm text-[oklch(0.55_0.04_280)] mb-4">
            ابدأ بإنشاء بانر إعلاني جديد ليظهر على الصفحة الرئيسية.
          </p>
          <Button onClick={openCreate} className="btn-aurora rounded-xl">
            <Plus className="h-4 w-4 ml-2" />
            <span>إضافة بانر</span>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {banners.map((banner, index) => (
            <motion.div
              key={banner.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.04, 0.3) }}
            >
              <Card className="glass-card p-4 rounded-2xl border border-[oklch(0.25_0.04_280)] hover:border-[oklch(0.627_0.265_303.9_/_0.3)] transition-all duration-300">
                {/* Thumbnail preview (half-image / half-video style) */}
                <div className="relative w-full aspect-[16/6] rounded-xl overflow-hidden bg-[oklch(0.13_0.028_280)] mb-3 flex">
                  {/* Left half - image */}
                  <div className="relative w-1/2 h-full overflow-hidden">
                    {banner.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={banner.imageUrl}
                        alt={banner.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.opacity = '0'
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[oklch(0.18_0.03_280)]">
                        <ImageIcon className="h-5 w-5 text-[oklch(0.4_0.03_280)]" />
                      </div>
                    )}
                  </div>
                  {/* Right half - video */}
                  <div className="relative w-1/2 h-full overflow-hidden">
                    {banner.videoUrl ? (
                      <video
                        src={banner.videoUrl}
                        className="w-full h-full object-cover"
                        muted
                        loop
                        playsInline
                        preload="metadata"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[oklch(0.18_0.03_280)]">
                        <VideoIcon className="h-5 w-5 text-[oklch(0.4_0.03_280)]" />
                      </div>
                    )}
                  </div>

                  {/* Status badge */}
                  <div className="absolute top-2 right-2 z-10">
                    {banner.isActive ? (
                      <Badge className="bg-[oklch(0.696_0.17_162.48_/_0.2)] text-[oklch(0.796_0.13_162.48)] border border-[oklch(0.696_0.17_162.48_/_0.3)] text-xs backdrop-blur-md">
                        نشط
                      </Badge>
                    ) : (
                      <Badge className="bg-[oklch(0.745_0.166_16.4_/_0.2)] text-[oklch(0.845_0.166_16.4)] border border-[oklch(0.745_0.166_16.4_/_0.3)] text-xs backdrop-blur-md">
                        متوقف
                      </Badge>
                    )}
                  </div>

                  {/* Order badge */}
                  <div className="absolute top-2 left-2 z-10">
                    <Badge className="bg-[oklch(0.13_0.028_280_/_0.7)] text-[oklch(0.7_0.04_280)] border border-[oklch(0.25_0.04_280)] text-xs backdrop-blur-md gap-1">
                      <ArrowUp className="h-3 w-3" />
                      <span>{banner.order}</span>
                    </Badge>
                  </div>
                </div>

                {/* Info */}
                <div className="min-w-0">
                  <h3 className="font-semibold text-white line-clamp-1">{banner.title}</h3>
                  {banner.subtitle && (
                    <p className="text-xs text-[oklch(0.55_0.04_280)] line-clamp-1 mt-0.5">
                      {banner.subtitle}
                    </p>
                  )}
                  {banner.buttonText && (
                    <div className="mt-2 inline-flex items-center gap-1 text-xs text-[oklch(0.7_0.04_280)]">
                      <ExternalLink className="h-3 w-3" />
                      <span dir="ltr">{banner.buttonText}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[oklch(0.25_0.04_280_/_0.5)]">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={banner.isActive}
                      onCheckedChange={() => handleToggleActive(banner)}
                      disabled={togglingId === banner.id}
                    />
                    <span className="text-xs text-[oklch(0.55_0.04_280)] inline-flex items-center gap-1">
                      {togglingId === banner.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : banner.isActive ? (
                        'نشط'
                      ) : (
                        'متوقف'
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg hover:bg-[oklch(0.627_0.265_303.9_/_0.1)]"
                      onClick={() => openEdit(banner)}
                      aria-label="تعديل"
                    >
                      <Pencil className="h-4 w-4 text-[oklch(0.827_0.165_303.9)]" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg text-[oklch(0.745_0.166_16.4)] hover:text-[oklch(0.845_0.166_16.4)] hover:bg-[oklch(0.645_0.246_16.4_/_0.1)]"
                      onClick={() => handleDelete(banner)}
                      aria-label="حذف"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(v) => setDialogOpen(v)}>
        <DialogContent className="sm:max-w-2xl bg-[oklch(0.13_0.028_280)] border-[oklch(0.25_0.04_280)] text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-lg flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-[oklch(0.827_0.165_303.9)]" />
              {editingId ? 'تعديل البانر' : 'إنشاء بانر جديد'}
            </DialogTitle>
            <DialogDescription className="text-[oklch(0.55_0.04_280)]">
              {editingId
                ? 'عدّل تفاصيل البانر ثم احفظ التغييرات'
                : 'أدخل تفاصيل البانر الإعلاني الجديد'}
            </DialogDescription>
          </DialogHeader>

          {/* Live preview */}
          <BannerPreview form={form} />

          {/* Tabs to organize fields */}
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="w-full justify-start rounded-2xl bg-[oklch(0.13_0.028_280)] border border-[oklch(0.25_0.04_280)] p-1 h-auto gap-1">
              <TabsTrigger
                value="content"
                className="rounded-xl data-[state=active]:bg-[oklch(0.627_0.265_303.9_/_0.15)] data-[state=active]:text-[oklch(0.827_0.165_303.9)] text-xs"
              >
                المحتوى
              </TabsTrigger>
              <TabsTrigger
                value="media"
                className="rounded-xl data-[state=active]:bg-[oklch(0.627_0.265_303.9_/_0.15)] data-[state=active]:text-[oklch(0.827_0.165_303.9)] text-xs"
              >
                الوسائط
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="rounded-xl data-[state=active]:bg-[oklch(0.627_0.265_303.9_/_0.15)] data-[state=active]:text-[oklch(0.827_0.165_303.9)] text-xs"
              >
                الإعدادات
              </TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-[oklch(0.7_0.04_280)]">
                  العنوان <span className="text-[oklch(0.745_0.166_16.4)]">*</span>
                </Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="أدخل عنوان البانر"
                  className="input-aurora rounded-xl text-white placeholder:text-[oklch(0.4_0.03_280)]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[oklch(0.7_0.04_280)]">العنوان الفرعي</Label>
                <Input
                  value={form.subtitle}
                  onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                  placeholder="نص قصير يظهر تحت العنوان"
                  className="input-aurora rounded-xl text-white placeholder:text-[oklch(0.4_0.03_280)]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[oklch(0.7_0.04_280)]">الوصف</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="وصف البانر..."
                  className="input-aurora rounded-xl text-white placeholder:text-[oklch(0.4_0.03_280)] min-h-[70px] resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[oklch(0.7_0.04_280)]">نص الزر</Label>
                <Input
                  value={form.buttonText}
                  onChange={(e) => setForm((f) => ({ ...f, buttonText: e.target.value }))}
                  placeholder="اكتشف المزيد"
                  className="input-aurora rounded-xl text-white placeholder:text-[oklch(0.4_0.03_280)]"
                />
              </div>
            </TabsContent>

            <TabsContent value="media" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-[oklch(0.7_0.04_280)] flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-[oklch(0.715_0.183_192.5)]" />
                  رابط الصورة (النصف الأيسر)
                </Label>
                <Input
                  value={form.imageUrl}
                  onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                  dir="ltr"
                  className="input-aurora rounded-xl text-white placeholder:text-[oklch(0.4_0.03_280)]"
                />
                <p className="text-xs text-[oklch(0.5_0.04_280)]">
                  صورة ثابتة تظهر في النصف الأيسر من البانر
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-[oklch(0.7_0.04_280)] flex items-center gap-1.5">
                  <VideoIcon className="h-3.5 w-3.5 text-[oklch(0.755_0.183_68.5)]" />
                  رابط الفيديو (النصف الأيمن)
                </Label>
                <Input
                  value={form.videoUrl}
                  onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))}
                  placeholder="https://example.com/video.mp4"
                  dir="ltr"
                  className="input-aurora rounded-xl text-white placeholder:text-[oklch(0.4_0.03_280)]"
                />
                <p className="text-xs text-[oklch(0.5_0.04_280)]">
                  فيديو .mp4 يعمل تلقائياً بصوت مكتوم في النصف الأيمن من البانر
                </p>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-[oklch(0.7_0.04_280)]">رابط عند النقر</Label>
                  <Input
                    value={form.linkUrl}
                    onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
                    placeholder="https://..."
                    dir="ltr"
                    className="input-aurora rounded-xl text-white placeholder:text-[oklch(0.4_0.03_280)]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[oklch(0.7_0.04_280)]">الترتيب</Label>
                  <Input
                    type="number"
                    value={form.order}
                    onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))}
                    placeholder="0"
                    dir="ltr"
                    className="input-aurora rounded-xl text-white placeholder:text-[oklch(0.4_0.03_280)]"
                  />
                  <p className="text-xs text-[oklch(0.5_0.04_280)]">
                    ترتيب الظهور (الأقل يظهر أولاً)
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-[oklch(0.25_0.04_280)] px-3 py-2.5">
                <div>
                  <Label className="text-[oklch(0.7_0.04_280)]">نشط</Label>
                  <p className="text-xs text-[oklch(0.5_0.04_280)]">تفعيل / إيقاف البانر</p>
                </div>
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-[oklch(0.7_0.04_280)] flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-[oklch(0.696_0.17_162.48)]" />
                    تاريخ البداية
                  </Label>
                  <Input
                    type="datetime-local"
                    value={form.startsAt}
                    onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
                    dir="ltr"
                    className="input-aurora rounded-xl text-white placeholder:text-[oklch(0.4_0.03_280)]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[oklch(0.7_0.04_280)] flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-[oklch(0.745_0.166_16.4)]" />
                    تاريخ النهاية
                  </Label>
                  <Input
                    type="datetime-local"
                    value={form.endsAt}
                    onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))}
                    dir="ltr"
                    className="input-aurora rounded-xl text-white placeholder:text-[oklch(0.4_0.03_280)]"
                  />
                </div>
              </div>
              <p className="text-xs text-[oklch(0.5_0.04_280)]">
                اترك التواريخ فارغة ليعمل البانر دائماً (طالما كان نشطاً)
              </p>
            </TabsContent>
          </Tabs>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[oklch(0.25_0.04_280_/_0.5)]">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isSaving}
              className="rounded-xl border-[oklch(0.25_0.04_280)] text-[oklch(0.7_0.04_280)] hover:bg-[oklch(0.18_0.03_280)]"
            >
              <X className="h-4 w-4 ml-1.5" />
              <span>إلغاء</span>
            </Button>
            <Button
              onClick={handleSave}
              disabled={!form.title.trim() || isSaving}
              className="btn-aurora rounded-xl"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  <span>جارٍ الحفظ...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 ml-2" />
                  <span>{editingId ? 'حفظ التغييرات' : 'إنشاء البانر'}</span>
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

// ===== Banner Live Preview =====
function BannerPreview({ form }: { form: BannerFormState }) {
  const hasImage = form.imageUrl.trim().length > 0
  const hasVideo = form.videoUrl.trim().length > 0

  return (
    <div className="rounded-2xl border border-[oklch(0.25_0.04_280)] overflow-hidden bg-[oklch(0.08_0.02_280)]">
      <div className="flex items-center justify-between px-3 py-2 bg-[oklch(0.13_0.028_280)] border-b border-[oklch(0.25_0.04_280)]">
        <span className="text-xs text-[oklch(0.55_0.04_280)]">معاينة مباشرة</span>
        <Badge className="badge-aurora text-[10px]">معاينة</Badge>
      </div>
      <div className="relative w-full aspect-[16/6] flex">
        {/* Left half - image */}
        <div className="relative w-1/2 h-full overflow-hidden bg-[oklch(0.18_0.03_280)]">
          {hasImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={form.imageUrl}
              alt="معاينة الصورة"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.opacity = '0'
              }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <ImageIcon className="h-5 w-5 text-[oklch(0.4_0.03_280)] mx-auto mb-1" />
                <span className="text-[10px] text-[oklch(0.45_0.03_280)]">الصورة</span>
              </div>
            </div>
          )}
        </div>
        {/* Right half - video */}
        <div className="relative w-1/2 h-full overflow-hidden bg-[oklch(0.13_0.028_280)]">
          {hasVideo ? (
            <video
              key={form.videoUrl}
              src={form.videoUrl}
              className="w-full h-full object-cover"
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <VideoIcon className="h-5 w-5 text-[oklch(0.4_0.03_280)] mx-auto mb-1" />
                <span className="text-[10px] text-[oklch(0.45_0.03_280)]">الفيديو</span>
              </div>
            </div>
          )}
        </div>

        {/* Overlay text (shown on top of media) */}
        <div className="absolute inset-0 flex flex-col justify-center px-6 pointer-events-none">
          <div className="max-w-[60%]">
            {form.title.trim() && (
              <h4 className="text-sm font-bold text-white drop-shadow-md line-clamp-1">
                {form.title}
              </h4>
            )}
            {form.subtitle.trim() && (
              <p className="text-[11px] text-white/85 drop-shadow-md line-clamp-1 mt-0.5">
                {form.subtitle}
              </p>
            )}
            {form.buttonText.trim() && (
              <div className="inline-flex items-center mt-1.5 px-2.5 py-1 rounded-md bg-white/15 backdrop-blur-sm text-[10px] text-white font-medium border border-white/20">
                {form.buttonText}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
