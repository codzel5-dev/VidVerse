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
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
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

const levelColors: Record<string, string> = {
  beginner: 'bg-emerald-100 text-emerald-700',
  intermediate: 'bg-amber-100 text-amber-700',
  advanced: 'bg-rose-100 text-rose-700',
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
        <p className="text-muted-foreground mb-4">الكورس غير موجود</p>
        <Button onClick={goHome} className="rounded-2xl gradient-emerald-teal text-white border-0">
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
            <div className="aspect-[21/9] bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center">
              <GraduationCap className="h-20 w-20 text-white/30" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex items-center gap-2 mb-3">
                <Badge className={`${levelColors[course.level] || 'bg-stone-100 text-stone-600'} border-0 rounded-lg`}>
                  {levelLabels[course.level] || course.level}
                </Badge>
                {course.isFeatured && (
                  <Badge className="bg-amber-400 text-white border-0 rounded-lg">
                    <Star className="h-3 w-3 ml-1 fill-white" />
                    مميز
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{course.title}</h1>
            </div>
          </div>

          {/* Description */}
          {course.description && (
            <Card className="p-5 rounded-2xl border-0 shadow-sm">
              <h3 className="font-semibold text-stone-800 mb-3">نبذة عن الكورس</h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {course.description}
              </p>
            </Card>
          )}

          {/* Lessons */}
          <Card className="p-5 rounded-2xl border-0 shadow-sm">
            <h3 className="font-semibold text-stone-800 mb-4">
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
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-stone-50 transition-colors group"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      lesson.isFree || isEnrolled
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-stone-100 text-stone-400'
                    }`}>
                      {lesson.isFree || isEnrolled ? (
                        <Play className="h-4 w-4 fill-current" />
                      ) : (
                        <Lock className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-right">
                      <p className="text-sm font-medium text-stone-700 group-hover:text-emerald-700 transition-colors line-clamp-1">
                        {lesson.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {Math.floor(lesson.duration / 60)} دقيقة
                        </span>
                        {lesson.isFree && (
                          <Badge className="bg-emerald-50 text-emerald-600 border-0 rounded text-[10px] px-1.5 py-0">
                            مجاني
                          </Badge>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{index + 1}</span>
                  </button>
                </motion.div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Price & Enroll Card */}
          <Card className="p-5 rounded-2xl border-0 shadow-md sticky top-20">
            <div className="text-center mb-4">
              {course.price > 0 ? (
                <div className="text-4xl font-bold text-emerald-600 mb-1">${course.price}</div>
              ) : (
                <div className="text-4xl font-bold text-emerald-600 mb-1">مجاني</div>
              )}
            </div>

            <Button
              onClick={handleEnroll}
              disabled={isEnrolled}
              className={`w-full rounded-2xl h-12 text-base font-semibold ${
                isEnrolled
                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                  : 'gradient-emerald-teal text-white border-0'
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

            <Separator className="my-4" />

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  الدروس
                </span>
                <span className="font-medium">{course._count?.lessons || 0} درس</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  المدة
                </span>
                <span className="font-medium">{Math.floor(totalDuration / 60)} دقيقة</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  الطلاب
                </span>
                <span className="font-medium">{course._count?.enrollments || 0} طالب</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  المستوى
                </span>
                <span className="font-medium">{levelLabels[course.level] || course.level}</span>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Instructor */}
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-emerald-100">
                <AvatarFallback className="bg-emerald-50 text-emerald-700 font-semibold">
                  {course.user?.name?.charAt(0) || 'م'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-stone-800">{course.user?.name || 'المدرب'}</p>
                <p className="text-xs text-muted-foreground">مدرب</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  )
}
