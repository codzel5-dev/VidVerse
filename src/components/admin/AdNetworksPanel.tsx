'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Megaphone,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  X,
  Save,
  Info,
  Code2,
  ArrowUp,
  AlertTriangle,
  Globe,
  Tag,
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
  DialogFooter,
} from '@/components/ui/dialog'
import { useAuthStore } from '@/store/auth-store'
import { toast } from 'sonner'

type AdType = 'external' | 'inline'
type AdPlacement = 'head' | 'body-start' | 'body-end'

interface AdNetwork {
  id: string
  name: string
  type: string | null
  scriptUrl: string | null
  inlineScript: string | null
  zoneId: string | null
  domain: string | null
  async: boolean
  defer: boolean
  cfAsync: boolean
  placement: string
  isActive: boolean
  order: number
  notes: string | null
  createdAt: string
  updatedAt: string
}

interface AdFormState {
  name: string
  type: AdType
  scriptUrl: string
  inlineScript: string
  zoneId: string
  domain: string
  placement: AdPlacement
  order: string
  cfAsync: boolean
  async: boolean
  defer: boolean
  isActive: boolean
  notes: string
}

const emptyForm: AdFormState = {
  name: '',
  type: 'external',
  scriptUrl: '',
  inlineScript: '',
  zoneId: '',
  domain: '',
  placement: 'head',
  order: '0',
  cfAsync: true,
  async: true,
  defer: false,
  isActive: true,
  notes: '',
}

const placementLabels: Record<AdPlacement, string> = {
  head: 'داخل <head>',
  'body-start': 'بداية <body>',
  'body-end': 'نهاية <body>',
}

/**
 * Build a live HTML preview string of the script tag that will be injected.
 * For inline scripts, the user may paste the whole `<script>...</script>`
 * wrapper; we strip and rebuild it with our own attributes for the preview.
 */
function buildPreview(form: AdFormState): string {
  const attrs: string[] = []
  if (form.cfAsync) attrs.push('data-cfasync="false"')

  if (form.type === 'external') {
    if (form.async) attrs.push('async')
    if (form.defer) attrs.push('defer')
    const src = form.scriptUrl.trim()
    if (src) attrs.push(`src="${src}"`)
    return `<script ${attrs.join(' ')}></script>`
  }

  // inline
  const code = form.inlineScript.trim()
  const stripped = code
    .replace(/^\s*<script[^>]*>/i, '')
    .replace(/<\/script>\s*$/i, '')
    .trim()
  return `<script ${attrs.join(' ')}>${stripped}</script>`
}

/** Try to extract a zoneId from the script content for convenience. */
function extractZoneId(form: AdFormState): string | null {
  const text =
    form.type === 'external'
      ? form.scriptUrl
      : form.inlineScript
  if (!text) return null
  // Matches z=12345678 or zone='12345678' or dataset.zone='12345678'
  const m = text.match(/(?:z=|zone=['"]?|dataset\.zone=['"]?)(\d{4,})/)
  return m ? m[1] : null
}

export default function AdNetworksPanel() {
  const user = useAuthStore((s) => s.user)
  const userId = user?.id

  const [networks, setNetworks] = useState<AdNetwork[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<AdFormState>(emptyForm)
  const [isSaving, setIsSaving] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // Delete confirmation dialog
  const [deleteTarget, setDeleteTarget] = useState<AdNetwork | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // ===== Fetch list =====
  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!userId) {
        setIsLoading(false)
        return
      }
      try {
        const res = await fetch('/api/ads', {
          headers: { 'x-user-id': userId },
        })
        const data = await res.json()
        if (cancelled) return
        if (!res.ok) {
          throw new Error(data.error || 'فشل تحميل شبكات الإعلانات')
        }
        setNetworks(data.networks || [])
      } catch (error) {
        if (cancelled) return
        console.error('Ad networks load error:', error)
        toast.error(
          error instanceof Error
            ? error.message
            : 'فشل تحميل شبكات الإعلانات'
        )
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

  // ===== Open / close editor =====
  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEdit = (n: AdNetwork) => {
    setEditingId(n.id)
    setForm({
      name: n.name,
      type: (n.type === 'inline' ? 'inline' : 'external') as AdType,
      scriptUrl: n.scriptUrl || '',
      inlineScript: n.inlineScript || '',
      zoneId: n.zoneId || '',
      domain: n.domain || '',
      placement: (['head', 'body-start', 'body-end'].includes(n.placement)
        ? n.placement
        : 'head') as AdPlacement,
      order: String(n.order ?? 0),
      cfAsync: n.cfAsync,
      async: n.async,
      defer: n.defer,
      isActive: n.isActive,
      notes: n.notes || '',
    })
    setDialogOpen(true)
  }

  // ===== Save =====
  const handleSave = async () => {
    if (!userId) return
    if (!form.name.trim()) {
      toast.error('اسم الشبكة مطلوب')
      return
    }
    if (form.type === 'external' && !form.scriptUrl.trim()) {
      toast.error('رابط السكربت مطلوب للنوع external')
      return
    }
    if (form.type === 'inline' && !form.inlineScript.trim()) {
      toast.error('السكربت المضمّن مطلوب للنوع inline')
      return
    }

    // Auto-fill zoneId if empty and extractable
    let zoneId = form.zoneId.trim()
    if (!zoneId) {
      const extracted = extractZoneId(form)
      if (extracted) zoneId = extracted
    }

    setIsSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        type: form.type,
        scriptUrl: form.type === 'external' ? form.scriptUrl.trim() : null,
        inlineScript: form.type === 'inline' ? form.inlineScript.trim() : null,
        zoneId: zoneId || null,
        domain: form.domain.trim() || null,
        placement: form.placement,
        order: Number(form.order) || 0,
        cfAsync: form.cfAsync,
        async: form.async,
        defer: form.defer,
        isActive: form.isActive,
        notes: form.notes.trim() || null,
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      }

      const isEditing = !!editingId
      const url = isEditing ? `/api/ads/${editingId}` : '/api/ads'
      const method = isEditing ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'فشل حفظ شبكة الإعلانات')
      }

      toast.success(
        isEditing
          ? 'تم تحديث شبكة الإعلانات بنجاح'
          : 'تم إنشاء شبكة الإعلانات بنجاح'
      )
      setDialogOpen(false)
      setEditingId(null)
      setForm(emptyForm)
      reload()
    } catch (error) {
      console.error('Ad network save error:', error)
      toast.error(
        error instanceof Error ? error.message : 'فشل حفظ شبكة الإعلانات'
      )
    } finally {
      setIsSaving(false)
    }
  }

  // ===== Delete =====
  const handleDelete = async () => {
    if (!userId || !deleteTarget) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/ads/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': userId },
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || 'فشل حذف شبكة الإعلانات')
      }
      toast.success('تم حذف شبكة الإعلانات')
      setDeleteTarget(null)
      reload()
    } catch (error) {
      console.error('Ad network delete error:', error)
      toast.error(
        error instanceof Error ? error.message : 'فشل حذف شبكة الإعلانات'
      )
    } finally {
      setIsDeleting(false)
    }
  }

  // ===== Toggle active (inline) =====
  const handleToggleActive = async (n: AdNetwork) => {
    if (!userId) return
    setTogglingId(n.id)
    // Optimistic update
    const newValue = !n.isActive
    setNetworks((prev) =>
      prev.map((x) => (x.id === n.id ? { ...x, isActive: newValue } : x))
    )
    try {
      const res = await fetch(`/api/ads/${n.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({ isActive: newValue }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || 'فشل تحديث حالة الشبكة')
      }
      toast.success(newValue ? 'تم تفعيل الشبكة' : 'تم إيقاف الشبكة')
    } catch (error) {
      // Rollback
      setNetworks((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, isActive: n.isActive } : x))
      )
      console.error('Ad network toggle error:', error)
      toast.error(
        error instanceof Error ? error.message : 'فشل تحديث حالة الشبكة'
      )
    } finally {
      setTogglingId(null)
    }
  }

  // ===== Render =====
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-[oklch(0.627_0.265_303.9)]" />
        <span className="mr-2 text-[oklch(0.55_0.04_280)]">
          جارٍ تحميل شبكات الإعلانات...
        </span>
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
              <h2 className="text-xl font-bold text-white">إعلانات المدونة</h2>
              <p className="text-sm text-[oklch(0.55_0.04_280)] mt-1 max-w-2xl">
                إدارة سكربتات شركات الإعلانات التي تُحقن في صفحات المقالات فقط
                (ليست لمنصة الفيديوهات).
              </p>
            </div>
          </div>
          <Button onClick={openCreate} className="btn-aurora rounded-xl">
            <Plus className="h-4 w-4 ml-2" />
            <span>إضافة شبكة</span>
          </Button>
        </div>
      </div>

      {/* Info banner */}
      <div className="glass-card p-4 rounded-2xl border border-[oklch(0.715_0.183_192.5_/_0.3)] bg-[oklch(0.715_0.183_192.5_/_0.06)] flex items-start gap-3">
        <Info className="h-5 w-5 text-[oklch(0.715_0.183_192.5)] shrink-0 mt-0.5" />
        <p className="text-sm text-[oklch(0.75_0.04_280)] leading-relaxed">
          السكربتات المُفعّلة ستُحقن تلقائياً في صفحات مقالات المدونة فقط.
          شركة الإعلانات نفسها تقرّر أين وكيف يظهر الإعلان.
        </p>
      </div>

      {/* List / empty state */}
      {networks.length === 0 ? (
        <div className="glass-card p-10 rounded-2xl border border-[oklch(0.25_0.04_280)] text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-[oklch(0.627_0.265_303.9_/_0.1)] flex items-center justify-center mb-4">
            <Megaphone className="h-7 w-7 text-[oklch(0.827_0.165_303.9)]" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1">
            لا توجد شبكات إعلانات بعد
          </h3>
          <p className="text-sm text-[oklch(0.55_0.04_280)] mb-4">
            أضف شبكة إعلانات (Monetag / 5gvci / ...) ليُحقن سكربتها في مقالات
            المدونة.
          </p>
          <Button onClick={openCreate} className="btn-aurora rounded-xl">
            <Plus className="h-4 w-4 ml-2" />
            <span>إضافة شبكة</span>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {networks.map((n, index) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.04, 0.3) }}
            >
              <Card className="glass-card p-4 rounded-2xl border border-[oklch(0.25_0.04_280)] hover:border-[oklch(0.627_0.265_303.9_/_0.3)] transition-all duration-300 gap-3">
                {/* Header row: name + type + order */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-white line-clamp-1">
                        {n.name}
                      </h3>
                      {n.type && (
                        <Badge
                          className={
                            n.type === 'inline'
                              ? 'bg-[oklch(0.795_0.184_86.04_/_0.2)] text-[oklch(0.845_0.17_86.04)] border border-[oklch(0.795_0.184_86.04_/_0.3)] text-xs'
                              : 'bg-[oklch(0.627_0.265_303.9_/_0.15)] text-[oklch(0.827_0.165_303.9)] border border-[oklch(0.627_0.265_303.9_/_0.3)] text-xs'
                          }
                        >
                          {n.type === 'inline' ? 'مضمّن' : 'خارجي'}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs text-[oklch(0.55_0.04_280)]">
                      <span className="inline-flex items-center gap-1">
                        <ArrowUp className="h-3 w-3" />
                        <span dir="ltr">{n.order}</span>
                      </span>
                      {n.zoneId && (
                        <span className="inline-flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          <span dir="ltr">z={n.zoneId}</span>
                        </span>
                      )}
                      {n.domain && (
                        <span className="inline-flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          <span dir="ltr" className="line-clamp-1">
                            {n.domain}
                          </span>
                        </span>
                      )}
                      <Badge
                        className="bg-[oklch(0.13_0.028_280)] text-[oklch(0.7_0.04_280)] border border-[oklch(0.25_0.04_280)] text-[10px]"
                      >
                        {placementLabels[n.placement as AdPlacement] ||
                          n.placement}
                      </Badge>
                    </div>
                  </div>
                  {n.isActive ? (
                    <Badge className="bg-[oklch(0.696_0.17_162.48_/_0.2)] text-[oklch(0.796_0.13_162.48)] border border-[oklch(0.696_0.17_162.48_/_0.3)] text-xs">
                      نشط
                    </Badge>
                  ) : (
                    <Badge className="bg-[oklch(0.745_0.166_16.4_/_0.2)] text-[oklch(0.845_0.166_16.4)] border border-[oklch(0.745_0.166_16.4_/_0.3)] text-xs">
                      متوقف
                    </Badge>
                  )}
                </div>

                {/* Script preview */}
                <div className="rounded-lg bg-[oklch(0.08_0.02_280)] border border-[oklch(0.25_0.04_280)] p-2.5 overflow-x-auto">
                  <code
                    dir="ltr"
                    className="text-[11px] text-[oklch(0.7_0.15_192.5)] font-mono whitespace-pre-wrap break-all leading-relaxed block"
                  >
                    {n.type === 'inline'
                      ? n.inlineScript?.slice(0, 160) +
                        (n.inlineScript && n.inlineScript.length > 160
                          ? '…'
                          : '')
                      : n.scriptUrl || '—'}
                  </code>
                </div>

                {n.notes && (
                  <p className="text-xs text-[oklch(0.55_0.04_280)] line-clamp-2">
                    {n.notes}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-1 border-t border-[oklch(0.25_0.04_280_/_0.5)]">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={n.isActive}
                      onCheckedChange={() => handleToggleActive(n)}
                      disabled={togglingId === n.id}
                    />
                    <span className="text-xs text-[oklch(0.55_0.04_280)] inline-flex items-center gap-1">
                      {togglingId === n.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : n.isActive ? (
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
                      onClick={() => openEdit(n)}
                      aria-label="تعديل"
                    >
                      <Pencil className="h-4 w-4 text-[oklch(0.827_0.165_303.9)]" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg text-[oklch(0.745_0.166_16.4)] hover:text-[oklch(0.845_0.166_16.4)] hover:bg-[oklch(0.645_0.246_16.4_/_0.1)]"
                      onClick={() => setDeleteTarget(n)}
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
      <Dialog
        open={dialogOpen}
        onOpenChange={(v) => {
          if (!isSaving) setDialogOpen(v)
        }}
      >
        <DialogContent className="sm:max-w-2xl bg-[oklch(0.13_0.028_280)] border-[oklch(0.25_0.04_280)] text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-lg flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-[oklch(0.827_0.165_303.9)]" />
              {editingId ? 'تعديل شبكة الإعلانات' : 'إنشاء شبكة إعلانات جديدة'}
            </DialogTitle>
            <DialogDescription className="text-[oklch(0.55_0.04_280)]">
              {editingId
                ? 'عدّل تفاصيل الشبكة ثم احفظ التغييرات'
                : 'أدخل تفاصيل شبكة الإعلانات الجديدة'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Name + Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-[oklch(0.7_0.04_280)]">
                  الاسم <span className="text-[oklch(0.745_0.166_16.4)]">*</span>
                </Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Monetag Vignette"
                  className="input-aurora rounded-xl text-white placeholder:text-[oklch(0.4_0.03_280)]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[oklch(0.7_0.04_280)]">النوع</Label>
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      type: e.target.value === 'inline' ? 'inline' : 'external',
                    }))
                  }
                  className="w-full h-8 rounded-lg bg-[oklch(0.13_0.028_280_/_0.6)] border border-[oklch(0.25_0.04_280)] px-3 text-sm text-white focus:border-[oklch(0.627_0.265_303.9_/_0.5)] focus:outline-none"
                >
                  <option value="external">خارجي (script src)</option>
                  <option value="inline">مضمّن (IIFE code)</option>
                </select>
              </div>
            </div>

            {/* Type-specific field */}
            {form.type === 'external' ? (
              <div className="space-y-2">
                <Label className="text-[oklch(0.7_0.04_280)]">
                  رابط السكربت (scriptUrl){' '}
                  <span className="text-[oklch(0.745_0.166_16.4)]">*</span>
                </Label>
                <Input
                  value={form.scriptUrl}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, scriptUrl: e.target.value }))
                  }
                  placeholder="https://5gvci.com/act/files/tag.min.js?z=11176998"
                  dir="ltr"
                  className="input-aurora rounded-xl text-white placeholder:text-[oklch(0.4_0.03_280)] font-mono text-sm"
                />
                <p className="text-xs text-[oklch(0.5_0.04_280)]">
                  رابط ملف <code dir="ltr">.js</code> الذي توفّره شركة الإعلانات.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="text-[oklch(0.7_0.04_280)]">
                  السكربت المضمّن (inlineScript){' '}
                  <span className="text-[oklch(0.745_0.166_16.4)]">*</span>
                </Label>
                <Textarea
                  value={form.inlineScript}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, inlineScript: e.target.value }))
                  }
                  placeholder={`<script>(function(s){s.dataset.zone='11177944',s.src='https://n6wxm.com/vignette.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))</script>`}
                  dir="ltr"
                  className="input-aurora rounded-xl text-white placeholder:text-[oklch(0.4_0.03_280)] min-h-[140px] font-mono text-xs leading-relaxed resize-y"
                />
                <p className="text-xs text-[oklch(0.5_0.04_280)]">
                  الصق كود IIFE كاملاً. يمكن إحاطته بوسم{' '}
                  <code dir="ltr">&lt;script&gt;</code> أو تركه بدونها.
                </p>
              </div>
            )}

            {/* Live preview */}
            <div className="rounded-2xl border border-[oklch(0.25_0.04_280)] overflow-hidden bg-[oklch(0.08_0.02_280)]">
              <div className="flex items-center justify-between px-3 py-2 bg-[oklch(0.13_0.028_280)] border-b border-[oklch(0.25_0.04_280)]">
                <span className="text-xs text-[oklch(0.55_0.04_280)] inline-flex items-center gap-1.5">
                  <Code2 className="h-3.5 w-3.5 text-[oklch(0.715_0.183_192.5)]" />
                  معاينة السكربت النهائي
                </span>
                <Badge className="badge-aurora text-[10px]">معاينة</Badge>
              </div>
              <pre
                dir="ltr"
                className="p-3 text-[11px] text-[oklch(0.75_0.15_192.5)] font-mono whitespace-pre-wrap break-all leading-relaxed max-h-[120px] overflow-y-auto"
              >
                {buildPreview(form)}
              </pre>
            </div>

            {/* Zone + Domain + Placement + Order */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-[oklch(0.7_0.04_280)] flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-[oklch(0.715_0.183_192.5)]" />
                  معرّف المنطقة (zoneId) (اختياري)
                </Label>
                <Input
                  value={form.zoneId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, zoneId: e.target.value }))
                  }
                  placeholder="11176998"
                  dir="ltr"
                  className="input-aurora rounded-xl text-white placeholder:text-[oklch(0.4_0.03_280)] font-mono text-sm"
                />
                <p className="text-xs text-[oklch(0.5_0.04_280)]">
                  يُستخرج تلقائياً من السكربت إذا تُرك فارغاً
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-[oklch(0.7_0.04_280)] flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-[oklch(0.715_0.183_192.5)]" />
                  النطاق (domain) (اختياري)
                </Label>
                <Input
                  value={form.domain}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, domain: e.target.value }))
                  }
                  placeholder="n6wxm.com"
                  dir="ltr"
                  className="input-aurora rounded-xl text-white placeholder:text-[oklch(0.4_0.03_280)] font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[oklch(0.7_0.04_280)]">موضع الحقن</Label>
                <select
                  value={form.placement}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      placement: e.target.value as AdPlacement,
                    }))
                  }
                  className="w-full h-8 rounded-lg bg-[oklch(0.13_0.028_280_/_0.6)] border border-[oklch(0.25_0.04_280)] px-3 text-sm text-white focus:border-[oklch(0.627_0.265_303.9_/_0.5)] focus:outline-none"
                >
                  <option value="head">داخل &lt;head&gt;</option>
                  <option value="body-start">بداية &lt;body&gt;</option>
                  <option value="body-end">نهاية &lt;body&gt;</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-[oklch(0.7_0.04_280)]">الترتيب</Label>
                <Input
                  type="number"
                  value={form.order}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, order: e.target.value }))
                  }
                  placeholder="0"
                  dir="ltr"
                  className="input-aurora rounded-xl text-white placeholder:text-[oklch(0.4_0.03_280)]"
                />
                <p className="text-xs text-[oklch(0.5_0.04_280)]">
                  ترتيب الحقن (الأقل أولاً)
                </p>
              </div>
            </div>

            {/* Switches */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SwitchRow
                label="cfAsync = false"
                description='يضيف data-cfasync="false" (يمنع Cloudflare من تأجيل السكربت)'
                checked={form.cfAsync}
                onChange={(v) => setForm((f) => ({ ...f, cfAsync: v }))}
              />
              <SwitchRow
                label="نشط (isActive)"
                description="تفعيل / إيقاف الشبكة"
                checked={form.isActive}
                onChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
              />
              {form.type === 'external' && (
                <>
                  <SwitchRow
                    label="async"
                    description="تحميل غير متزامن (external فقط)"
                    checked={form.async}
                    onChange={(v) => setForm((f) => ({ ...f, async: v }))}
                  />
                  <SwitchRow
                    label="defer"
                    description="تأجيل التنفيذ بعد التحليل (external فقط)"
                    checked={form.defer}
                    onChange={(v) => setForm((f) => ({ ...f, defer: v }))}
                  />
                </>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-[oklch(0.7_0.04_280)]">ملاحظات (اختياري)</Label>
              <Textarea
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                placeholder="ملاحظات داخلية حول هذه الشبكة..."
                className="input-aurora rounded-xl text-white placeholder:text-[oklch(0.4_0.03_280)] min-h-[70px] resize-none text-sm"
              />
            </div>
          </div>

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
              disabled={!form.name.trim() || isSaving}
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
                  <span>{editingId ? 'حفظ التغييرات' : 'إنشاء الشبكة'}</span>
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(v) => {
          if (!isDeleting && !v) setDeleteTarget(null)
        }}
      >
        <DialogContent className="sm:max-w-md bg-[oklch(0.13_0.028_280)] border-[oklch(0.25_0.04_280)] text-white">
          <DialogHeader>
            <DialogTitle className="text-white text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[oklch(0.745_0.166_16.4)]" />
              تأكيد الحذف
            </DialogTitle>
            <DialogDescription className="text-[oklch(0.55_0.04_280)]">
              هل أنت متأكد من حذف شبكة الإعلانات &laquo;{deleteTarget?.name}&raquo;؟
              لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="border-t border-[oklch(0.25_0.04_280_/_0.5)]">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
              className="rounded-xl border-[oklch(0.25_0.04_280)] text-[oklch(0.7_0.04_280)] hover:bg-[oklch(0.18_0.03_280)]"
            >
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-xl bg-[oklch(0.645_0.246_16.4_/_0.2)] text-[oklch(0.845_0.166_16.4)] hover:bg-[oklch(0.645_0.246_16.4_/_0.3)] border border-[oklch(0.645_0.246_16.4_/_0.3)]"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  جارٍ الحذف...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 ml-2" />
                  حذف
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

// ===== Switch row helper =====
function SwitchRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[oklch(0.25_0.04_280)] px-3 py-2.5 bg-[oklch(0.13_0.028_280_/_0.4)]">
      <div className="min-w-0">
        <Label className="text-[oklch(0.7_0.04_280)] text-sm" dir="ltr">
          {label}
        </Label>
        <p className="text-[11px] text-[oklch(0.5_0.04_280)] mt-0.5">
          {description}
        </p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}
