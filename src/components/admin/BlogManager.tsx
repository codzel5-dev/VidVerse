'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Newspaper,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Image as ImageIcon,
  Star,
  Eye,
  Calendar,
  X,
  Save,
  Upload,
  ArrowRight,
  FileText,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
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

interface BlogPostListItem {
  id: string
  title: string
  slug: string
  excerpt: string | null
  coverImage: string | null
  status: string
  featured: boolean
  views: number
  readingTime: number
  createdAt: string
  updatedAt: string
  author: { id: string; name: string }
  _count: { tags: number }
}

interface BlogTag {
  id: string
  name: string
  slug: string
}

interface BlogPostFull {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  coverImage: string | null
  status: string
  featured: boolean
  views: number
  readingTime: number
  createdAt: string
  updatedAt: string
  author: { id: string; name: string; avatar: string | null }
  tags: BlogTag[]
}

interface BlogFormState {
  title: string
  content: string
  excerpt: string
  coverImage: string
  status: 'published' | 'draft'
  featured: boolean
  slug: string
  tags: string // comma-separated input
}

const emptyForm: BlogFormState = {
  title: '',
  content: '',
  excerpt: '',
  coverImage: '',
  status: 'draft',
  featured: false,
  slug: '',
  tags: '',
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/** Parse the comma-separated tags input into a cleaned, de-duplicated list. */
function parseTags(raw: string): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const part of raw.split(',')) {
    const trimmed = part.trim()
    if (!trimmed) continue
    const key = trimmed.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(trimmed)
  }
  return out
}

export default function BlogManager() {
  const user = useAuthStore((s) => s.user)
  const userId = user?.id

  const [posts, setPosts] = useState<BlogPostListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  const [view, setView] = useState<'list' | 'editor'>('list')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<BlogFormState>(emptyForm)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingPost, setIsLoadingPost] = useState(false)
  const [isUploadingCover, setIsUploadingCover] = useState(false)
  const [isInsertingImage, setIsInsertingImage] = useState(false)

  // Delete confirmation dialog
  const [deleteTarget, setDeleteTarget] = useState<BlogPostListItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const contentRef = useRef<HTMLTextAreaElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const insertImageInputRef = useRef<HTMLInputElement>(null)

  // ===== Fetch list =====
  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!userId) {
        setIsLoading(false)
        return
      }
      try {
        const res = await fetch('/api/blog/admin/list', {
          headers: { 'x-user-id': userId },
        })
        const data = await res.json()
        if (cancelled) return
        if (!res.ok) {
          throw new Error(data.error || 'فشل تحميل المقالات')
        }
        setPosts(data.posts || [])
      } catch (error) {
        if (cancelled) return
        console.error('Blog load error:', error)
        toast.error(
          error instanceof Error ? error.message : 'فشل تحميل المقالات'
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

  // ===== Editor open / close =====
  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setView('editor')
  }

  const openEdit = async (post: BlogPostListItem) => {
    if (!userId) return
    setIsLoadingPost(true)
    try {
      const res = await fetch(`/api/blog/admin/${post.id}`, {
        headers: { 'x-user-id': userId },
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'فشل تحميل المقال')
      }
      const full: BlogPostFull = data.post
      setEditingId(full.id)
      setForm({
        title: full.title,
        content: full.content,
        excerpt: full.excerpt || '',
        coverImage: full.coverImage || '',
        status: full.status === 'draft' ? 'draft' : 'published',
        featured: full.featured,
        // Leave slug empty so backend auto-regenerates unless user explicitly overrides
        slug: '',
        tags: full.tags.map((t) => t.name).join(', '),
      })
      setView('editor')
    } catch (error) {
      console.error('Blog load single error:', error)
      toast.error(
        error instanceof Error ? error.message : 'فشل تحميل المقال'
      )
    } finally {
      setIsLoadingPost(false)
    }
  }

  const cancelEdit = () => {
    setView('list')
    setEditingId(null)
    setForm(emptyForm)
  }

  // ===== Image uploads =====
  const handleCoverUpload = async (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('الملف يجب أن يكون صورة')
      return
    }
    setIsUploadingCover(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload-image', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'فشل رفع الصورة')
      }
      setForm((f) => ({ ...f, coverImage: data.image.url as string }))
      toast.success('تم رفع صورة الغلاف')
    } catch (error) {
      console.error('Cover upload error:', error)
      toast.error(
        error instanceof Error ? error.message : 'فشل رفع الصورة'
      )
    } finally {
      setIsUploadingCover(false)
      if (coverInputRef.current) coverInputRef.current.value = ''
    }
  }

  const handleInsertImage = async (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('الملف يجب أن يكون صورة')
      return
    }
    setIsInsertingImage(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload-image', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'فشل رفع الصورة')
      }
      const url = data.image.url as string
      const alt = file.name.replace(/\.[^/.]+$/, '') || 'image'
      const md = `![${alt}](${url})`

      const ta = contentRef.current
      if (ta) {
        const start = ta.selectionStart ?? form.content.length
        const end = ta.selectionEnd ?? form.content.length
        const before = form.content.slice(0, start)
        const after = form.content.slice(end)
        // Ensure surrounding newlines for readability
        const prefix = before.length > 0 && !before.endsWith('\n') ? '\n\n' : ''
        const suffix = after.length > 0 && !after.startsWith('\n') ? '\n\n' : ''
        const insertion = `${prefix}${md}${suffix}`
        const newContent = before + insertion + after
        setForm((f) => ({ ...f, content: newContent }))
        requestAnimationFrame(() => {
          ta.focus()
          const pos = (before + insertion).length
          ta.setSelectionRange(pos, pos)
        })
      } else {
        setForm((f) => ({
          ...f,
          content: `${f.content}\n\n${md}\n`,
        }))
      }
      toast.success('تم إدراج الصورة في المحتوى')
    } catch (error) {
      console.error('Insert image error:', error)
      toast.error(
        error instanceof Error ? error.message : 'فشل رفع الصورة'
      )
    } finally {
      setIsInsertingImage(false)
      if (insertImageInputRef.current) insertImageInputRef.current.value = ''
    }
  }

  // ===== Save (create or update) =====
  const handleSave = async () => {
    if (!userId) return
    if (!form.title.trim()) {
      toast.error('العنوان مطلوب')
      return
    }
    if (!form.content.trim()) {
      toast.error('المحتوى مطلوب')
      return
    }

    setIsSaving(true)
    try {
      const tagsArray = parseTags(form.tags)
      const isEditing = !!editingId
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      }

      if (isEditing) {
        const payload: Record<string, unknown> = {
          title: form.title.trim(),
          content: form.content,
          excerpt: form.excerpt.trim() || undefined,
          coverImage: form.coverImage.trim() || null,
          status: form.status,
          featured: form.featured,
          tags: tagsArray,
        }
        if (form.slug.trim()) {
          payload.slug = form.slug.trim()
        }
        const res = await fetch(`/api/blog/admin/${editingId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || 'فشل تحديث المقال')
        }
        toast.success('تم تحديث المقال بنجاح')
      } else {
        const payload = {
          title: form.title.trim(),
          content: form.content,
          excerpt: form.excerpt.trim() || undefined,
          coverImage: form.coverImage.trim() || undefined,
          status: form.status,
          featured: form.featured,
          tags: tagsArray,
          authorId: userId,
        }
        const res = await fetch('/api/blog/admin/list', {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || 'فشل إنشاء المقال')
        }
        toast.success('تم إنشاء المقال بنجاح')
      }

      setView('list')
      setEditingId(null)
      setForm(emptyForm)
      reload()
    } catch (error) {
      console.error('Blog save error:', error)
      toast.error(error instanceof Error ? error.message : 'فشل حفظ المقال')
    } finally {
      setIsSaving(false)
    }
  }

  // ===== Delete =====
  const handleDelete = async () => {
    if (!userId || !deleteTarget) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/blog/admin/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': userId },
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || 'فشل حذف المقال')
      }
      toast.success('تم حذف المقال')
      setDeleteTarget(null)
      reload()
    } catch (error) {
      console.error('Blog delete error:', error)
      toast.error(
        error instanceof Error ? error.message : 'فشل حذف المقال'
      )
    } finally {
      setIsDeleting(false)
    }
  }

  // ===== Render =====
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-[oklch(0.627_0.265_303.9)]" />
        <span className="mr-2 text-[oklch(0.55_0.04_280)]">
          جارٍ تحميل المقالات...
        </span>
      </div>
    )
  }

  if (view === 'editor') {
    return (
      <EditorView
        form={form}
        setForm={setForm}
        editingId={editingId}
        isSaving={isSaving}
        isLoadingPost={isLoadingPost}
        isUploadingCover={isUploadingCover}
        isInsertingImage={isInsertingImage}
        contentRef={contentRef}
        coverInputRef={coverInputRef}
        insertImageInputRef={insertImageInputRef}
        onCoverUpload={handleCoverUpload}
        onInsertImage={handleInsertImage}
        onSave={handleSave}
        onCancel={cancelEdit}
        tagsPreview={parseTags(form.tags)}
      />
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
              <Newspaper className="h-5 w-5 text-[oklch(0.827_0.165_303.9)]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">إدارة المدونة</h2>
              <p className="text-sm text-[oklch(0.55_0.04_280)] mt-1">
                إنشاء وتحرير مقالات المدونة بتنسيق ماركداون مع دعم صور الغلاف والوسوم.
              </p>
            </div>
          </div>
          <Button onClick={openCreate} className="btn-aurora rounded-xl">
            <Plus className="h-4 w-4 ml-2" />
            <span>مقال جديد</span>
          </Button>
        </div>
      </div>

      {/* List / empty state */}
      {posts.length === 0 ? (
        <div className="glass-card p-10 rounded-2xl border border-[oklch(0.25_0.04_280)] text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-[oklch(0.627_0.265_303.9_/_0.1)] flex items-center justify-center mb-4">
            <Newspaper className="h-7 w-7 text-[oklch(0.827_0.165_303.9)]" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1">
            لا توجد مقالات بعد
          </h3>
          <p className="text-sm text-[oklch(0.55_0.04_280)] mb-4">
            ابدأ بإنشاء أول مقال في المدونة.
          </p>
          <Button onClick={openCreate} className="btn-aurora rounded-xl">
            <Plus className="h-4 w-4 ml-2" />
            <span>مقال جديد</span>
          </Button>
        </div>
      ) : (
        <div className="glass-card rounded-2xl border border-[oklch(0.25_0.04_280)] overflow-hidden">
          {/* Table for md+ */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[oklch(0.13_0.028_280)] border-b border-[oklch(0.25_0.04_280)]">
                <tr className="text-[oklch(0.55_0.04_280)] text-right">
                  <th className="px-4 py-3 font-medium">المقال</th>
                  <th className="px-4 py-3 font-medium">الحالة</th>
                  <th className="px-4 py-3 font-medium">المشاهدات</th>
                  <th className="px-4 py-3 font-medium">التحديث</th>
                  <th className="px-4 py-3 font-medium text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr
                    key={post.id}
                    className="border-b border-[oklch(0.25_0.04_280_/_0.5)] hover:bg-[oklch(0.18_0.03_280_/_0.4)] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-11 w-11 rounded-lg overflow-hidden bg-[oklch(0.18_0.03_280)] shrink-0 flex items-center justify-center">
                          {post.coverImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={post.coverImage}
                              alt={post.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <FileText className="h-5 w-5 text-[oklch(0.4_0.03_280)]" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            {post.featured && (
                              <Star className="h-3.5 w-3.5 text-[oklch(0.83_0.18_84.5)] fill-[oklch(0.83_0.18_84.5)] shrink-0" />
                            )}
                            <span className="text-white font-medium line-clamp-1">
                              {post.title}
                            </span>
                          </div>
                          <p className="text-xs text-[oklch(0.5_0.04_280)] mt-0.5 line-clamp-1">
                            {post.author.name} •{' '}
                            {post._count.tags > 0
                              ? `${post._count.tags} وسوم`
                              : 'بدون وسوم'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {post.status === 'published' ? (
                        <Badge className="bg-[oklch(0.696_0.17_162.48_/_0.2)] text-[oklch(0.796_0.13_162.48)] border border-[oklch(0.696_0.17_162.48_/_0.3)] text-xs">
                          منشور
                        </Badge>
                      ) : (
                        <Badge className="bg-[oklch(0.795_0.184_86.04_/_0.2)] text-[oklch(0.845_0.17_86.04)] border border-[oklch(0.795_0.184_86.04_/_0.3)] text-xs">
                          مسودة
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[oklch(0.7_0.04_280)]">
                      <span className="inline-flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        <span dir="ltr">{post.views.toLocaleString('en-US')}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[oklch(0.55_0.04_280)] text-xs">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(post.updatedAt)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg hover:bg-[oklch(0.627_0.265_303.9_/_0.1)]"
                          onClick={() => openEdit(post)}
                          aria-label="تعديل"
                        >
                          <Pencil className="h-4 w-4 text-[oklch(0.827_0.165_303.9)]" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-[oklch(0.745_0.166_16.4)] hover:text-[oklch(0.845_0.166_16.4)] hover:bg-[oklch(0.645_0.246_16.4_/_0.1)]"
                          onClick={() => setDeleteTarget(post)}
                          aria-label="حذف"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards for mobile */}
          <div className="md:hidden divide-y divide-[oklch(0.25_0.04_280_/_0.5)]">
            {posts.map((post) => (
              <div key={post.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-lg overflow-hidden bg-[oklch(0.18_0.03_280)] shrink-0 flex items-center justify-center">
                    {post.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <FileText className="h-5 w-5 text-[oklch(0.4_0.03_280)]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      {post.featured && (
                        <Star className="h-3.5 w-3.5 text-[oklch(0.83_0.18_84.5)] fill-[oklch(0.83_0.18_84.5)] shrink-0" />
                      )}
                      <span className="text-white font-medium line-clamp-1">
                        {post.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {post.status === 'published' ? (
                        <Badge className="bg-[oklch(0.696_0.17_162.48_/_0.2)] text-[oklch(0.796_0.13_162.48)] border border-[oklch(0.696_0.17_162.48_/_0.3)] text-xs">
                          منشور
                        </Badge>
                      ) : (
                        <Badge className="bg-[oklch(0.795_0.184_86.04_/_0.2)] text-[oklch(0.845_0.17_86.04)] border border-[oklch(0.795_0.184_86.04_/_0.3)] text-xs">
                          مسودة
                        </Badge>
                      )}
                      <span className="text-xs text-[oklch(0.5_0.04_280)] inline-flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        <span dir="ltr">
                          {post.views.toLocaleString('en-US')}
                        </span>
                      </span>
                      <span className="text-xs text-[oklch(0.5_0.04_280)]">
                        {formatDate(post.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-3 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-lg hover:bg-[oklch(0.627_0.265_303.9_/_0.1)] text-[oklch(0.827_0.165_303.9)]"
                    onClick={() => openEdit(post)}
                  >
                    <Pencil className="h-3.5 w-3.5 ml-1.5" />
                    تعديل
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-lg text-[oklch(0.745_0.166_16.4)] hover:bg-[oklch(0.645_0.246_16.4_/_0.1)]"
                    onClick={() => setDeleteTarget(post)}
                  >
                    <Trash2 className="h-3.5 w-3.5 ml-1.5" />
                    حذف
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
              هل أنت متأكد من حذف المقال &laquo;{deleteTarget?.title}&raquo;؟ لا
              يمكن التراجع عن هذا الإجراء.
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

// ===== Editor View =====
interface EditorViewProps {
  form: BlogFormState
  setForm: React.Dispatch<React.SetStateAction<BlogFormState>>
  editingId: string | null
  isSaving: boolean
  isLoadingPost: boolean
  isUploadingCover: boolean
  isInsertingImage: boolean
  contentRef: React.RefObject<HTMLTextAreaElement | null>
  coverInputRef: React.RefObject<HTMLInputElement | null>
  insertImageInputRef: React.RefObject<HTMLInputElement | null>
  onCoverUpload: (file: File | undefined) => void
  onInsertImage: (file: File | undefined) => void
  onSave: () => void
  onCancel: () => void
  tagsPreview: string[]
}

function EditorView({
  form,
  setForm,
  editingId,
  isSaving,
  isLoadingPost,
  isUploadingCover,
  isInsertingImage,
  contentRef,
  coverInputRef,
  insertImageInputRef,
  onCoverUpload,
  onInsertImage,
  onSave,
  onCancel,
  tagsPreview,
}: EditorViewProps) {
  if (isLoadingPost) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-[oklch(0.627_0.265_303.9)]" />
        <span className="mr-2 text-[oklch(0.55_0.04_280)]">
          جارٍ تحميل المقال...
        </span>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="glass-card p-5 rounded-2xl border border-[oklch(0.25_0.04_280)]">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              disabled={isSaving}
              className="rounded-lg hover:bg-[oklch(0.18_0.03_280)] text-[oklch(0.7_0.04_280)]"
              aria-label="رجوع"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Newspaper className="h-5 w-5 text-[oklch(0.827_0.165_303.9)]" />
                {editingId ? 'تعديل المقال' : 'مقال جديد'}
              </h2>
              <p className="text-xs text-[oklch(0.55_0.04_280)] mt-0.5">
                {editingId
                  ? 'عدّل المحتوى ثم احفظ التغييرات'
                  : 'أدخل تفاصيل المقال الجديد ثم احفظ'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isSaving}
              className="rounded-xl border-[oklch(0.25_0.04_280)] text-[oklch(0.7_0.04_280)] hover:bg-[oklch(0.18_0.03_280)]"
            >
              <X className="h-4 w-4 ml-1.5" />
              <span>إلغاء</span>
            </Button>
            <Button
              onClick={onSave}
              disabled={!form.title.trim() || !form.content.trim() || isSaving}
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
                  <span>{editingId ? 'حفظ التغييرات' : 'نشر المقال'}</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Title (full width) */}
      <div className="glass-card p-5 rounded-2xl border border-[oklch(0.25_0.04_280)] space-y-2">
        <Label className="text-[oklch(0.7_0.04_280)]">
          العنوان <span className="text-[oklch(0.745_0.166_16.4)]">*</span>
        </Label>
        <Input
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="عنوان المقال..."
          className="input-aurora rounded-xl text-white text-lg font-medium placeholder:text-[oklch(0.4_0.03_280)] h-11"
        />
      </div>

      {/* Cover image upload */}
      <div className="glass-card p-5 rounded-2xl border border-[oklch(0.25_0.04_280)] space-y-3">
        <Label className="text-[oklch(0.7_0.04_280)] flex items-center gap-1.5">
          <ImageIcon className="h-3.5 w-3.5 text-[oklch(0.715_0.183_192.5)]" />
          صورة الغلاف
        </Label>
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onCoverUpload(e.target.files?.[0])}
        />
        {form.coverImage ? (
          <div className="flex items-start gap-4">
            <div className="relative h-24 w-40 rounded-xl overflow-hidden bg-[oklch(0.18_0.03_280)] shrink-0 border border-[oklch(0.25_0.04_280)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={form.coverImage}
                alt="معاينة الغلاف"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <p className="text-xs text-[oklch(0.55_0.04_280)] line-clamp-1" dir="ltr">
                {form.coverImage}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg border-[oklch(0.25_0.04_280)] text-[oklch(0.7_0.04_280)] hover:bg-[oklch(0.18_0.03_280)]"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={isUploadingCover}
                >
                  <Upload className="h-3.5 w-3.5 ml-1.5" />
                  تغيير الصورة
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-lg text-[oklch(0.745_0.166_16.4)] hover:bg-[oklch(0.645_0.246_16.4_/_0.1)]"
                  onClick={() => setForm((f) => ({ ...f, coverImage: '' }))}
                  disabled={isUploadingCover}
                >
                  <X className="h-3.5 w-3.5 ml-1.5" />
                  إزالة
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="rounded-xl border-[oklch(0.25_0.04_280)] text-[oklch(0.7_0.04_280)] hover:bg-[oklch(0.18_0.03_280)]"
              onClick={() => coverInputRef.current?.click()}
              disabled={isUploadingCover}
            >
              {isUploadingCover ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  جارٍ الرفع...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 ml-2" />
                  رفع صورة الغلاف
                </>
              )}
            </Button>
            <span className="text-xs text-[oklch(0.5_0.04_280)]">
              PNG / JPG / WEBP — حتى 8 ميجابايت
            </span>
          </div>
        )}
      </div>

      {/* Content (markdown) */}
      <div className="glass-card p-5 rounded-2xl border border-[oklch(0.25_0.04_280)] space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <Label className="text-[oklch(0.7_0.04_280)] flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-[oklch(0.755_0.183_68.5)]" />
            المحتوى (ماركداون) <span className="text-[oklch(0.745_0.166_16.4)]">*</span>
          </Label>
          <input
            ref={insertImageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onInsertImage(e.target.files?.[0])}
          />
          <Button
            variant="ghost"
            size="sm"
            className="rounded-lg text-[oklch(0.827_0.165_303.9)] hover:bg-[oklch(0.627_0.265_303.9_/_0.1)]"
            onClick={() => insertImageInputRef.current?.click()}
            disabled={isInsertingImage}
          >
            {isInsertingImage ? (
              <>
                <Loader2 className="h-3.5 w-3.5 ml-1.5 animate-spin" />
                جارٍ الإدراج...
              </>
            ) : (
              <>
                <ImageIcon className="h-3.5 w-3.5 ml-1.5" />
                إدراج صورة في المحتوى
              </>
            )}
          </Button>
        </div>
        <Textarea
          ref={contentRef}
          value={form.content}
          onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
          placeholder={'# العنوان الرئيسي\n\nاكتب محتوى المقال هنا بتنسيق ماركداون...'}
          dir="ltr"
          className="input-aurora rounded-xl text-white placeholder:text-[oklch(0.4_0.03_280)] min-h-[400px] font-mono text-sm leading-relaxed resize-y"
        />
        <p className="text-xs text-[oklch(0.5_0.04_280)]">
          استخدم ماركداون: <code dir="ltr" className="text-[oklch(0.7_0.04_280)]"># عنوان</code>،{' '}
          <code dir="ltr" className="text-[oklch(0.7_0.04_280)]">**عريض**</code>،{' '}
          <code dir="ltr" className="text-[oklch(0.7_0.04_280)]">![بديل](رابط)</code>
        </p>
      </div>

      {/* Excerpt + Slug */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="glass-card p-5 rounded-2xl border border-[oklch(0.25_0.04_280)] space-y-2">
          <Label className="text-[oklch(0.7_0.04_280)]">المقتطف (اختياري)</Label>
          <Textarea
            value={form.excerpt}
            onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
            placeholder="وصف قصير يظهر في بطاقة المقال. يُولّد تلقائياً من المحتوى إذا تُرك فارغاً."
            className="input-aurora rounded-xl text-white placeholder:text-[oklch(0.4_0.03_280)] min-h-[80px] resize-none text-sm"
          />
        </div>
        <div className="glass-card p-5 rounded-2xl border border-[oklch(0.25_0.04_280)] space-y-2">
          <Label className="text-[oklch(0.7_0.04_280)]">المعرّف (slug) (اختياري)</Label>
          <Input
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            placeholder="يُولّد تلقائياً من العنوان"
            dir="ltr"
            className="input-aurora rounded-xl text-white placeholder:text-[oklch(0.4_0.03_280)] font-mono text-sm"
          />
          <p className="text-xs text-[oklch(0.5_0.04_280)]">
            اتركه فارغاً ليُولّد تلقائياً عند الحفظ
          </p>
        </div>
      </div>

      {/* Tags */}
      <div className="glass-card p-5 rounded-2xl border border-[oklch(0.25_0.04_280)] space-y-3">
        <Label className="text-[oklch(0.7_0.04_280)]">الوسوم</Label>
        <Input
          value={form.tags}
          onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
          placeholder="تكنولوجيا، برمجة، ذكاء اصطناعي"
          className="input-aurora rounded-xl text-white placeholder:text-[oklch(0.4_0.03_280)]"
        />
        {tagsPreview.length > 0 ? (
          <div className="flex items-center gap-1.5 flex-wrap">
            {tagsPreview.map((tag) => (
              <Badge
                key={tag}
                className="bg-[oklch(0.627_0.265_303.9_/_0.12)] text-[oklch(0.827_0.165_303.9)] border border-[oklch(0.627_0.265_303.9_/_0.3)] text-xs"
              >
                {tag}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[oklch(0.5_0.04_280)]">
            افصل بين الوسوم بفاصلة. تُحوّل إلى معرّفات (slugs) تلقائياً عند الحفظ.
          </p>
        )}
      </div>

      {/* Status + Featured */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="glass-card p-5 rounded-2xl border border-[oklch(0.25_0.04_280)] space-y-2">
          <Label className="text-[oklch(0.7_0.04_280)]">الحالة</Label>
          <select
            value={form.status}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                status: e.target.value === 'draft' ? 'draft' : 'published',
              }))
            }
            className="w-full h-9 rounded-xl bg-[oklch(0.13_0.028_280_/_0.6)] border border-[oklch(0.25_0.04_280)] px-3 text-sm text-white focus:border-[oklch(0.627_0.265_303.9_/_0.5)] focus:outline-none"
          >
            <option value="published">منشور</option>
            <option value="draft">مسودة</option>
          </select>
          <p className="text-xs text-[oklch(0.5_0.04_280)]">
            المسودات لا تظهر في المدونة العامة
          </p>
        </div>
        <div className="glass-card p-5 rounded-2xl border border-[oklch(0.25_0.04_280)] flex items-center justify-between">
          <div>
            <Label className="text-[oklch(0.7_0.04_280)] flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 text-[oklch(0.83_0.18_84.5)]" />
              مقال مميز
            </Label>
            <p className="text-xs text-[oklch(0.5_0.04_280)] mt-1">
              يظهر في قسم المقالات المميزة
            </p>
          </div>
          <Switch
            checked={form.featured}
            onCheckedChange={(v) => setForm((f) => ({ ...f, featured: v }))}
          />
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="glass-card p-4 rounded-2xl border border-[oklch(0.25_0.04_280)] flex items-center justify-between gap-2 sticky bottom-4">
        <p className="text-xs text-[oklch(0.55_0.04_280)]">
          {editingId ? 'وضع التعديل' : 'مقال جديد'}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSaving}
            className="rounded-xl border-[oklch(0.25_0.04_280)] text-[oklch(0.7_0.04_280)] hover:bg-[oklch(0.18_0.03_280)]"
          >
            <X className="h-4 w-4 ml-1.5" />
            <span>إلغاء</span>
          </Button>
          <Button
            onClick={onSave}
            disabled={!form.title.trim() || !form.content.trim() || isSaving}
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
                <span>{editingId ? 'حفظ التغييرات' : 'نشر المقال'}</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
