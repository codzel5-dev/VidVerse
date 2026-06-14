'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Eye, DollarSign, Pencil, Trash2, Plus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { useAppStore } from '@/store/app-store'
import { useAuthStore } from '@/store/auth-store'
import { toast } from 'sonner'
import CourseCreateForm from './CourseCreateForm'
import CourseEditForm from './CourseEditForm'

interface AdminCourse {
  id: string
  title: string
  price: number
  currency: string
  level: string
  isPublished: boolean
  isFeatured: boolean
  createdAt: string
  user: { id: string; name: string }
  category: { id: string; name: string } | null
  _count: { enrollments: number; lessons: number }
}

const levelLabels: Record<string, string> = {
  beginner: 'مبتدئ',
  intermediate: 'متوسط',
  advanced: 'متقدم',
}

export default function CourseManager() {
  const [courses, setCourses] = useState<AdminCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const navigateToCourse = useAppStore((s) => s.navigateToCourse)
  const user = useAuthStore((s) => s.user)

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false)

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false)
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null)

  // Load on mount and when refreshKey changes
  useEffect(() => {
    const userId = user?.id
    let cancelled = false

    const load = async () => {
      try {
        const headers: HeadersInit = {}
        if (userId) headers['x-user-id'] = userId
        const res = await fetch('/api/course?limit=50', { headers })
        const data = await res.json()
        if (!cancelled) setCourses(data.courses || [])
      } catch {
        if (!cancelled) setCourses([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [user?.id, refreshKey])

  const reloadCourses = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الكورس؟ سيتم حذف جميع الدروس المرتبطة به.')) return
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' }
      if (user?.id) headers['x-user-id'] = user.id
      const res = await fetch(`/api/course/${id}`, { method: 'DELETE', headers })
      if (res.ok) {
        setCourses((prev) => prev.filter((c) => c.id !== id))
        toast.success('تم حذف الكورس')
      } else {
        const data = await res.json()
        throw new Error(data.error || 'فشل الحذف')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'حدث خطأ أثناء حذف الكورس')
    }
  }

  const handleEdit = (courseId: string) => {
    setEditingCourseId(courseId)
    setEditOpen(true)
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[oklch(0.55_0.04_280)]">{courses.length} كورس</p>
        <Button
          onClick={() => setCreateOpen(true)}
          className="btn-aurora rounded-xl h-9"
        >
          <Plus className="h-4 w-4 ml-1.5" />
          <span>إنشاء كورس</span>
        </Button>
      </div>

      <div className="space-y-3">
        {courses.map((course, index) => (
          <motion.div
            key={course.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <Card className="glass-card p-4 rounded-2xl hover:border-[oklch(0.627_0.265_303.9_/_0.3)] transition-all duration-300">
              <div className="flex items-center gap-4">
                {/* Thumbnail */}
                <div className="w-20 h-14 rounded-xl bg-gradient-to-br from-[oklch(0.627_0.265_303.9)] to-[oklch(0.656_0.241_354.3)] flex items-center justify-center shrink-0">
                  <BookOpen className="h-6 w-6 text-white/60" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-white line-clamp-1">{course.title}</h4>
                  <div className="flex items-center gap-2 text-xs text-[oklch(0.55_0.04_280)] mt-1">
                    <span>{course.user?.name}</span>
                    <span>•</span>
                    <span>{course._count.lessons} درس</span>
                    <span>•</span>
                    <span>{course._count.enrollments} طالب</span>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                  <Badge className="bg-[oklch(0.18_0.03_280)] text-[oklch(0.7_0.04_280)] border border-[oklch(0.25_0.04_280)] rounded-lg text-xs">
                    {levelLabels[course.level] || course.level}
                  </Badge>
                  {course.price > 0 ? (
                    <Badge className="badge-premium border-0 rounded-lg text-xs">
                      <DollarSign className="h-3 w-3 ml-0.5" />${course.price}
                    </Badge>
                  ) : (
                    <Badge className="badge-free border-0 rounded-lg text-xs">مجاني</Badge>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg hover:bg-[oklch(0.18_0.03_280)]"
                    onClick={() => navigateToCourse(course.id)}
                  >
                    <Eye className="h-4 w-4 text-[oklch(0.55_0.04_280)]" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg hover:bg-[oklch(0.627_0.265_303.9_/_0.1)]"
                    onClick={() => handleEdit(course.id)}
                  >
                    <Pencil className="h-4 w-4 text-[oklch(0.827_0.165_303.9)]" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg text-[oklch(0.745_0.166_16.4)] hover:text-[oklch(0.845_0.166_16.4)] hover:bg-[oklch(0.645_0.246_16.4_/_0.1)]"
                    onClick={() => handleDelete(course.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {courses.length === 0 && (
        <div className="text-center py-8 text-[oklch(0.55_0.04_280)]">لا توجد كورسات</div>
      )}

      {/* Create Dialog */}
      <CourseCreateForm
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCourseCreated={reloadCourses}
      />

      {/* Edit Dialog */}
      <CourseEditForm
        open={editOpen}
        onOpenChange={setEditOpen}
        courseId={editingCourseId}
        onCourseUpdated={reloadCourses}
      />
    </div>
  )
}
