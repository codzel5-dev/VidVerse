'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Settings,
  Save,
  Loader2,
  Eye,
  EyeOff,
  TestTube,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ShieldCheck,
  Database,
  Server,
  RefreshCw,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/store/auth-store'
import { toast } from 'sonner'

interface ConfigItem {
  key: string
  label: string
  category: string
  isSecret: boolean
  description: string
  placeholder: string
  value: string
  hasValue: boolean
  source: 'db' | 'env' | 'none'
}

export default function AdminSettingsPanel() {
  const user = useAuthStore((s) => s.user)
  const userId = user?.id

  const [items, setItems] = useState<ConfigItem[]>([])
  const [draftValues, setDraftValues] = useState<Record<string, string>>({})
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; url?: string; error?: string } | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!userId) return
      try {
        const res = await fetch('/api/admin/config', { headers: { 'x-user-id': userId } })
        const data = await res.json()
        if (cancelled) return
        if (!res.ok) {
          throw new Error(data.error || 'فشل تحميل الإعدادات')
        }
        const fetched: ConfigItem[] = data.items || []
        setItems(fetched)
        const drafts: Record<string, string> = {}
        for (const item of fetched) {
          drafts[item.key] = item.isSecret ? '' : item.value
        }
        setDraftValues(drafts)
        setTestResult(null)
      } catch (error) {
        if (cancelled) return
        console.error('Config load error:', error)
        toast.error(error instanceof Error ? error.message : 'فشل تحميل الإعدادات')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [userId])

  const toggleReveal = async (key: string, isSecret: boolean) => {
    if (!isSecret || !userId) return

    const next = new Set(revealedKeys)
    if (next.has(key)) {
      next.delete(key)
      setRevealedKeys(next)
      return
    }

    try {
      const res = await fetch('/api/admin/config?reveal=1', { headers: { 'x-user-id': userId } })
      const data = await res.json()
      if (res.ok) {
        const item = (data.items || []).find((i: ConfigItem) => i.key === key)
        if (item) {
          setItems((prev) => prev.map((it) => (it.key === key ? { ...it, value: item.value } : it)))
          next.add(key)
          setRevealedKeys(next)
        }
      }
    } catch {
      toast.error('تعذر عرض القيمة')
    }
  }

  const handleSave = async () => {
    if (!userId) return
    setIsSaving(true)
    try {
      const settings: Record<string, string> = {}
      for (const item of items) {
        const draft = draftValues[item.key] ?? ''
        if (item.isSecret) {
          if (draft.trim()) settings[item.key] = draft.trim()
        } else {
          if (draft !== item.value) settings[item.key] = draft
        }
      }

      if (Object.keys(settings).length === 0) {
        toast.info('لا توجد تغييرات لحفظها')
        return
      }

      const res = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify({ settings }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'فشل حفظ الإعدادات')
      }

      setItems(data.items || [])
      const drafts: Record<string, string> = {}
      for (const item of data.items || []) {
        drafts[item.key] = item.isSecret ? '' : item.value
      }
      setDraftValues(drafts)
      setRevealedKeys(new Set())
      setTestResult(null)
      toast.success('تم حفظ الإعدادات بنجاح')
    } catch (error) {
      console.error('Config save error:', error)
      toast.error(error instanceof Error ? error.message : 'فشل حفظ الإعدادات')
    } finally {
      setIsSaving(false)
    }
  }

  const handleTest = async () => {
    if (!userId) return
    setIsTesting(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/admin/config?action=test', {
        method: 'POST',
        headers: { 'x-user-id': userId },
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'فشل اختبار الإعدادات')
      }

      setTestResult({ ok: true, url: data.testUrl })
      toast.success('تم اختبار الإعدادات بنجاح')
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'فشل اختبار الإعدادات'
      setTestResult({ ok: false, error: msg })
      toast.error(msg)
    } finally {
      setIsTesting(false)
    }
  }

  const handleReload = () => {
    setIsLoading(true)
    // Re-trigger the load effect by toggling a state change
    // Easier: just reload the page section by re-mounting via state
    setItems([])
    setDraftValues({})
    setRevealedKeys(new Set())
    setTestResult(null)
    // Force re-fetch
    setTimeout(async () => {
      if (!userId) return
      try {
        const res = await fetch('/api/admin/config', { headers: { 'x-user-id': userId } })
        const data = await res.json()
        if (res.ok) {
          const fetched: ConfigItem[] = data.items || []
          setItems(fetched)
          const drafts: Record<string, string> = {}
          for (const item of fetched) {
            drafts[item.key] = item.isSecret ? '' : item.value
          }
          setDraftValues(drafts)
        }
      } catch (error) {
        toast.error('فشل إعادة التحميل')
      } finally {
        setIsLoading(false)
      }
    }, 0)
  }

  const sourceBadge = (source: ConfigItem['source']) => {
    if (source === 'db') {
      return (
        <Badge className="bg-[oklch(0.696_0.17_162.48_/_0.15)] text-[oklch(0.796_0.13_162.48)] border border-[oklch(0.696_0.17_162.48_/_0.3)] text-xs gap-1">
          <Database className="h-3 w-3" />
          قاعدة البيانات
        </Badge>
      )
    }
    if (source === 'env') {
      return (
        <Badge className="bg-[oklch(0.627_0.265_303.9_/_0.15)] text-[oklch(0.827_0.165_303.9)] border border-[oklch(0.627_0.265_303.9_/_0.3)] text-xs gap-1">
          <Server className="h-3 w-3" />
          ملف .env
        </Badge>
      )
    }
    return (
      <Badge className="bg-[oklch(0.745_0.166_16.4_/_0.15)] text-[oklch(0.745_0.166_16.4)] border border-[oklch(0.745_0.166_16.4_/_0.3)] text-xs gap-1">
        <XCircle className="h-3 w-3" />
        غير مُعرّف
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-[oklch(0.627_0.265_303.9)]" />
        <span className="mr-2 text-[oklch(0.55_0.04_280)]">جارٍ تحميل الإعدادات...</span>
      </div>
    )
  }

  const hasUnsavedChanges = items.some((item) => {
    const draft = draftValues[item.key] ?? ''
    if (item.isSecret) return draft.trim().length > 0
    return draft !== item.value
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header card */}
      <div className="glass-card p-6 rounded-2xl border border-[oklch(0.25_0.04_280)]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 rounded-2xl bg-[oklch(0.627_0.265_303.9_/_0.15)] flex items-center justify-center shrink-0">
              <Settings className="h-5 w-5 text-[oklch(0.827_0.165_303.9)]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">إعدادات الرفع</h2>
              <p className="text-sm text-[oklch(0.55_0.04_280)] mt-1">
                إدارة متغيرات خدمة رفع الصور المصغّرة. تُحفظ في قاعدة البيانات وتعمل على أي استضافة.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReload}
            disabled={isLoading}
            className="text-[oklch(0.55_0.04_280)] hover:text-white shrink-0"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Info banner */}
        <div className="mt-4 p-3 rounded-xl bg-[oklch(0.627_0.265_303.9_/_0.08)] border border-[oklch(0.627_0.265_303.9_/_0.2)] flex items-start gap-2">
          <Info className="h-4 w-4 text-[oklch(0.827_0.165_303.9)] shrink-0 mt-0.5" />
          <p className="text-xs text-[oklch(0.7_0.04_280)] leading-relaxed">
            القيم المُدخلة هنا تُحفظ في قاعدة البيانات وتأخذ الأولوية عن متغيرات ملف <code className="text-[oklch(0.827_0.165_303.9)]">.env</code>.
            هذا يتيح تغيير الإعدادات بدون إعادة النشر، ويعمل على أي منصة استضافة.
          </p>
        </div>
      </div>

      {/* Image upload settings */}
      <div className="glass-card p-6 rounded-2xl border border-[oklch(0.25_0.04_280)]">
        <div className="flex items-center gap-2 mb-5">
          <ShieldCheck className="h-4 w-4 text-[oklch(0.796_0.13_162.48)]" />
          <h3 className="text-base font-semibold text-white">إعدادات خدمة رفع الصور</h3>
          <span className="text-xs text-[oklch(0.55_0.04_280)]">(picser.pages.dev → GitHub repo)</span>
        </div>

        <div className="space-y-5">
          {items.map((item) => {
            const isRevealed = revealedKeys.has(item.key) || !item.isSecret
            const draft = draftValues[item.key] ?? ''
            const showPlaceholder = item.isSecret && !draft && !isRevealed

            return (
              <div key={item.key} className="space-y-1.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-[oklch(0.85_0.04_280)] font-medium">
                      {item.label}
                    </Label>
                    <code className="text-xs text-[oklch(0.4_0.03_280)] font-mono bg-[oklch(0.13_0.028_280)] px-1.5 py-0.5 rounded">
                      {item.key}
                    </code>
                  </div>
                  {sourceBadge(item.source)}
                </div>

                <div className="relative">
                  <Input
                    type={item.isSecret && !isRevealed ? 'password' : 'text'}
                    value={showPlaceholder ? '' : draft}
                    onChange={(e) => setDraftValues((prev) => ({ ...prev, [item.key]: e.target.value }))}
                    placeholder={item.isSecret && item.hasValue && !isRevealed ? '•••••••• (أدخل قيمة جديدة للاستبدال)' : item.placeholder}
                    dir="ltr"
                    className="input-aurora rounded-xl text-white placeholder:text-[oklch(0.4_0.03_280)] pr-10 font-mono text-sm"
                  />
                  {item.isSecret && (
                    <button
                      type="button"
                      onClick={() => toggleReveal(item.key, item.isSecret)}
                      className="absolute inset-y-0 left-2 flex items-center text-[oklch(0.55_0.04_280)] hover:text-[oklch(0.7_0.04_280)] transition-colors"
                      aria-label={isRevealed ? 'إخفاء' : 'إظهار'}
                    >
                      {isRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  )}
                </div>

                <p className="text-xs text-[oklch(0.5_0.04_280)] leading-relaxed">
                  {item.description}
                </p>

                {/* Current value hint for secrets when masked */}
                {item.isSecret && item.hasValue && !isRevealed && (
                  <p className="text-xs text-[oklch(0.45_0.04_280)] italic">
                    القيمة الحالية: <span className="font-mono">{item.value}</span>
                  </p>
                )}
              </div>
            )
          })}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-3 mt-6 pt-5 border-t border-[oklch(0.25_0.04_280)]">
          <Button
            onClick={handleSave}
            disabled={!hasUnsavedChanges || isSaving}
            className="btn-aurora rounded-xl"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                جارٍ الحفظ...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 ml-2" />
                حفظ الإعدادات
              </>
            )}
          </Button>

          <Button
            onClick={handleTest}
            disabled={isTesting || isSaving}
            variant="outline"
            className="rounded-xl border-[oklch(0.25_0.04_280)] text-[oklch(0.7_0.04_280)] hover:bg-[oklch(0.18_0.03_280)]"
          >
            {isTesting ? (
              <>
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                جارٍ الاختبار...
              </>
            ) : (
              <>
                <TestTube className="h-4 w-4 ml-2" />
                اختبار الإعدادات
              </>
            )}
          </Button>

          {hasUnsavedChanges && (
            <span className="text-xs text-[oklch(0.827_0.165_303.9)]">
              • لديك تغييرات غير محفوظة
            </span>
          )}
        </div>

        {/* Test result */}
        {testResult && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-4 p-4 rounded-xl border ${
              testResult.ok
                ? 'bg-[oklch(0.696_0.17_162.48_/_0.1)] border-[oklch(0.696_0.17_162.48_/_0.3)]'
                : 'bg-[oklch(0.745_0.166_16.4_/_0.1)] border-[oklch(0.745_0.166_16.4_/_0.3)]'
            }`}
          >
            {testResult.ok ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[oklch(0.796_0.13_162.48)]" />
                  <p className="text-sm text-[oklch(0.796_0.13_162.48)] font-medium">
                    تم رفع صورة الاختبار بنجاح!
                  </p>
                </div>
                {testResult.url && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[oklch(0.55_0.04_280)]">رابط الصورة:</span>
                    <a
                      href={testResult.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[oklch(0.827_0.165_303.9)] hover:underline font-mono break-all flex items-center gap-1"
                      dir="ltr"
                    >
                      {testResult.url.slice(0, 80)}...
                      <ExternalLink className="h-3 w-3 inline shrink-0" />
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <XCircle className="h-4 w-4 text-[oklch(0.745_0.166_16.4)] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-[oklch(0.745_0.166_16.4)] font-medium">
                    فشل اختبار الإعدادات
                  </p>
                  <p className="text-xs text-[oklch(0.65_0.05_16.4)] mt-1 break-words">
                    {testResult.error}
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Help / documentation card */}
      <div className="glass-card p-6 rounded-2xl border border-[oklch(0.25_0.04_280)]">
        <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
          <Info className="h-4 w-4 text-[oklch(0.827_0.165_303.9)]" />
          كيف أحصل على هذه القيم؟
        </h3>
        <ol className="space-y-2 text-sm text-[oklch(0.65_0.04_280)] list-decimal pr-5">
          <li>
            <strong className="text-[oklch(0.8_0.04_280)]">GitHub Token:</strong>{' '}
            اذهب إلى{' '}
            <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-[oklch(0.827_0.165_303.9)] hover:underline inline-flex items-center gap-1">
              GitHub Settings → Tokens <ExternalLink className="h-3 w-3" />
            </a>{' '}
            وأنشئ Personal Access Token (classic) مع صلاحية <code className="font-mono text-xs bg-[oklch(0.13_0.028_280)] px-1 rounded">repo</code>.
          </li>
          <li>
            <strong className="text-[oklch(0.8_0.04_280)]">GitHub Owner:</strong>{' '}
            اسم المستخدم أو المنظمة التي تملك الـ repo.
          </li>
          <li>
            <strong className="text-[oklch(0.8_0.04_280)]">GitHub Repo:</strong>{' '}
            اسم الـ repository الذي سيُخزّن الصور (يجب أن يكون موجوداً مسبقاً).
          </li>
          <li>
            <strong className="text-[oklch(0.8_0.04_280)]">GitHub Branch:</strong>{' '}
            اسم الفرع (افتراضياً <code className="font-mono text-xs bg-[oklch(0.13_0.028_280)] px-1 rounded">main</code>).
          </li>
          <li>
            <strong className="text-[oklch(0.8_0.04_280)]">Upload Folder:</strong>{' '}
            مجلد داخل الـ repo لتخزين الصور (افتراضياً <code className="font-mono text-xs bg-[oklch(0.13_0.028_280)] px-1 rounded">uploads</code>).
          </li>
          <li>
            <strong className="text-[oklch(0.8_0.04_280)]">Picser Upload URL:</strong>{' '}
            رابط خدمة الرفع (افتراضياً <code className="font-mono text-xs bg-[oklch(0.13_0.028_280)] px-1 rounded" dir="ltr">https://picser.pages.dev/api/public-upload</code>).
          </li>
        </ol>
      </div>
    </motion.div>
  )
}
