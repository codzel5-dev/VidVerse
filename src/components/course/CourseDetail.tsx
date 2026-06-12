'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  BookOpen,
  Clock,
  Users,
  Play,
  CheckCircle,
  Lock,
  Star,
  GraduationCap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { useCourseDetail } from '@/hooks/useCourses'
import { useAuthStore } from '@/store/auth-store'
import { useAppStore } from '@/store/app-store'
import { toast } from 'sonner'

const levelLabels: Record<string, string> = {
  beginner: 'مبتدئ',
  intermediate: 'متوسط',
  advanced: 'متقدم',
}

const levelStyles: Record<string, string> = {
  beginner: 'bg-[oklch(0.696_0.17_162.48_/_0.15)] text-[oklch(0.796_0.13_162.48)] border-[oklch(0.696_0.17_162.48_/_0.3)]',
  intermediate: 'bg-[oklch(0.755_0.183_68.5_/_0.15)] text-[oklch(0.855_0.183_68.5)] border-[oklch(0.755_0.183_68.5_/_0.3)]',
  advanced: 'bg-[oklch(0.645_0.246_16.4_/_0.15)] text-[oklch(0.745_0.166_16.4)] border-[oklch(0.645_0.246_16.4_/_0.3)]',
}

export default function CourseDetail() {
  const selectedCourseId = useAppStore((s) => s.selectedCourseId)
  const goHome = useAppStore((s) => s.goHome)
  const navigateToVideo = useAppStore((s) => s.navigateToVideo)
  const { course, loading } = useCourseDetail(selectedCourseId)
  const user = useAuthStore((s) => s.user)

  const [isEnrolled, setIsEnrolled] = useState(false)

  const handleEnroll = async () => {
    if (!user) { toast.error('يرجى تسجيل الدخول أولاً'); return }
    try {
      const res = await fetch(`/api/course/${selectedCourseId}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
        body: JSON.stringify({ userId: user.id }),
      })
      if (res.ok) {
        setIsEnrolled(true)
        toast.success('تم التسجيل في الكورس بنجاح!')
      } else {
        const data = await res.json()
        toast.error(data.error || 'حدث خطأ')
      }
    } catch {
      toast.error('حدث خطأ أثناء التسجيل')
    }
  }

  if (loading) return <LoadingSpinner text="جاري تحميل الكورس..." />

  if (!course) {
    return (
      <div className="text-center py-16">
        <p className="text-[oklch(0.55_0.04_280)] mb-4">الكورس غير موجود</p>
        <Button onClick={goHome} className="rounded-2xl btn-aurora text-white border-0">
          العودة للرئيسية
        </Button>
      </div>
    )
  }

  const totalDuration = (course.lessons || []).reduce((sum, l) => sum + l.duration, 0)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="relative rounded-2xl overflow-hidden">
            <div className="aspect-[21/9] bg-gradient-to-br from-[oklch(0.627_0.265_303.9)] via-[oklch(0.715_0.183_192.5)] to-[oklch(0.645_0.246_16.4)] flex items-center justify-center">
              <GraduationCap className="h-20 w-20 text-white/30" />
            </div>
            {/* Grid overlay */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '18px 18px'
            }} />
            <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.08_0.02_280)] via-[oklch(0.08_0.02_280_/_0.4)] to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex items-center gap-2 mb-3">
                <Badge className={`${levelStyles[course.level] || 'bg-[oklch(0.25_0.04_280)] text-[oklch(0.6_0.04_280)] border-[oklch(0.25_0.04_280)]'} border rounded-lg`}>
                  {levelLabels[course.level] || course.level}
                </Badge>
                {course.isFeatured && (
                  <Badge className="badge-premium border-0 rounded-lg">
                    <Star className="h-3 w-3 ml-1 fill-current" />
                    مميز
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{course.title}</h1>
            </div>
          </div>

          {/* Description */}
          {course.description && (
            <div className="glass-card rounded-2xl p-5">
              <h3 className="font-semibold text-white mb-3">نبذة عن الكورس</h3>
              <p className="text-sm text-[oklch(0.7_0.04_280)] leading-relaxed whitespace-pre-line">
                {course.description}
              </p>
            </div>
          )}

          {/* Lessons */}
          <div className="glass-card rounded-2xl p-5">
            <h3 className="font-semibold text-white mb-4">
              المحتوى التعليمي ({course._count?.lessons || course.lessons?.length || 0} درس)
            </h3>
            <div className="space-y-2">
              {(course.lessons || []).map((lesson, index) => (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <button
                    onClick={() => {
                      if (lesson.video && (lesson.isFree || isEnrolled)) {
                        navigateToVideo(lesson.video.id)
                      }
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[oklch(0.18_0.03_280)] transition-colors group"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      lesson.isFree || isEnrolled
                        ? 'bg-[oklch(0.696_0.17_162.48_/_0.15)] text-[oklch(0.796_0.13_162.48)]'
                        : 'bg-[oklch(0.18_0.03_280)] text-[oklch(0.55_0.04_280)]'
                    }`}>
                      {lesson.isFree || isEnrolled ? (
                        <Play className="h-4 w-4 fill-current" />
                      ) : (
                        <Lock className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-right">
                      <p className="text-sm font-medium text-[oklch(0.7_0.04_280)] group-hover:text-[oklch(0.827_0.165_303.9)] transition-colors line-clamp-1">
                        {lesson.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-[oklch(0.55_0.04_280)] mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {Math.floor(lesson.duration / 60)} دقيقة
                        </span>
                        {lesson.isFree && (
                          <Badge className="badge-free rounded text-[10px] px-1.5 py-0">
                            مجاني
                          </Badge>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-[oklch(0.55_0.04_280)] shrink-0">{index + 1}</span>
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Price & Enroll Card */}
          <div className="glass-card rounded-2xl p-5 sticky top-20">
            <div className="text-center mb-4">
              {course.price > 0 ? (
                <div className="text-4xl font-bold text-gradient-coral-amber mb-1">${course.price}</div>
              ) : (
                <div className="text-4xl font-bold text-gradient-coral-amber mb-1">مجاني</div>
              )}
            </div>

            <Button
              onClick={handleEnroll}
              disabled={isEnrolled}
              className={`w-full rounded-2xl h-12 text-base font-semibold border-0 ${
                isEnrolled
                  ? 'bg-[oklch(0.696_0.17_162.48_/_0.15)] text-[oklch(0.796_0.13_162.48)] hover:bg-[oklch(0.696_0.17_162.48_/_0.15)]'
                  : 'btn-aurora text-white'
              }`}
            >
              {isEnrolled ? (
                <>
                  <CheckCircle className="h-5 w-5 ml-2" />
                  مسجل بالفعل
                </>
              ) : (
                <>
                  <GraduationCap className="h-5 w-5 ml-2" />
                  سجل الآن
                </>
              )}
            </Button>

            <div className="cosmic-divider my-4" />

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[oklch(0.55_0.04_280)] flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  الدروس
                </span>
                <span className="font-medium text-white">{course._count?.lessons || 0} درس</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[oklch(0.55_0.04_280)] flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  المدة
                </span>
                <span className="font-medium text-white">{Math.floor(totalDuration / 60)} دقيقة</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[oklch(0.55_0.04_280)] flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  الطلاب
                </span>
                <span className="font-medium text-white">{course._count?.enrollments || 0} طالب</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[oklch(0.55_0.04_280)] flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  المستوى
                </span>
                <span className="font-medium text-white">{levelLabels[course.level] || course.level}</span>
              </div>
            </div>

            <div className="cosmic-divider my-4" />

            {/* Instructor */}
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-[oklch(0.627_0.265_303.9_/_0.3)]">
                <AvatarFallback className="bg-[oklch(0.627_0.265_303.9_/_0.15)] text-[oklch(0.827_0.165_303.9)] font-semibold">
                  {course.user?.name?.charAt(0) || 'م'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-white">{course.user?.name || 'المدرب'}</p>
                <p className="text-xs text-[oklch(0.55_0.04_280)]">مدرب</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
