'use client'

import { motion } from 'framer-motion'
import { BookOpen, Users, Star, ChevronLeft } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAppStore } from '@/store/app-store'
import type { CourseData } from '@/hooks/useCourses'

interface CourseCardProps {
  course: CourseData
  index?: number
}

const coursePatterns = [
  'from-violet-500 via-purple-500 to-fuchsia-500',
  'from-amber-500 via-orange-500 to-rose-500',
  'from-emerald-500 via-teal-500 to-cyan-500',
  'from-sky-500 via-blue-500 to-indigo-500',
]

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

export default function CourseCard({ course, index = 0 }: CourseCardProps) {
  const navigateToCourse = useAppStore((s) => s.navigateToCourse)
  const pattern = coursePatterns[index % coursePatterns.length]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Card
        onClick={() => navigateToCourse(course.id)}
        className="group cursor-pointer border-0 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden bg-white card-hover rounded-2xl"
      >
        {/* Cover */}
        <div className="relative aspect-[16/10] overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-br ${pattern} opacity-85`} />
          <div className="absolute inset-0 flex items-center justify-center">
            <BookOpen className="h-12 w-12 text-white/40" />
          </div>
          <Badge className={`absolute top-3 right-3 text-xs rounded-lg border-0 ${levelColors[course.level] || 'bg-stone-100 text-stone-600'}`}>
            {levelLabels[course.level] || course.level}
          </Badge>
          {course.isFeatured && (
            <Badge className="absolute top-3 left-3 bg-amber-400 text-white text-xs rounded-lg border-0">
              <Star className="h-3 w-3 ml-1 fill-white" />
              مميز
            </Badge>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-semibold text-stone-800 line-clamp-2 mb-2 group-hover:text-emerald-700 transition-colors">
            {course.title}
          </h3>

          <div className="flex items-center gap-2 mb-3">
            <Avatar className="h-6 w-6 border border-stone-200">
              <AvatarFallback className="bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
                {course.user?.name?.charAt(0) || 'م'}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">{course.user?.name || 'مجهول'}</span>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" />
              {course._count.lessons} درس
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {course._count.enrollments} طالب
            </span>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-stone-100">
            {course.price > 0 ? (
              <span className="text-lg font-bold text-emerald-600">
                ${course.price}
              </span>
            ) : (
              <Badge className="bg-emerald-100 text-emerald-700 border-0 rounded-lg">مجاني</Badge>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl text-xs"
            >
              التفاصيل
              <ChevronLeft className="h-3 w-3 mr-1" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
