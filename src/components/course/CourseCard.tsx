'use client'

import { motion } from 'framer-motion'
import { BookOpen, Users, Star, ChevronLeft } from 'lucide-react'
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
  'from-[oklch(0.627_0.265_303.9)] via-[oklch(0.623_0.214_259.8)] to-[oklch(0.656_0.241_354.3)]',
  'from-[oklch(0.645_0.246_16.4)] via-[oklch(0.755_0.183_68.5)] to-[oklch(0.627_0.265_303.9)]',
  'from-[oklch(0.696_0.17_162.48)] via-[oklch(0.715_0.183_192.5)] to-[oklch(0.627_0.265_303.9)]',
  'from-[oklch(0.656_0.241_354.3)] via-[oklch(0.627_0.265_303.9)] to-[oklch(0.623_0.214_259.8)]',
]

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
      <div
        onClick={() => navigateToCourse(course.id)}
        className="group cursor-pointer card-aurora overflow-hidden"
      >
        {/* Cover */}
        <div className="relative aspect-[16/10] overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-br ${pattern} opacity-75 group-hover:opacity-95 transition-opacity duration-500`} />
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '18px 18px'
          }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <BookOpen className="h-12 w-12 text-white/30" />
          </div>
          <div className={`absolute top-3 right-3 text-xs rounded-lg px-2 py-1 border ${levelStyles[course.level] || 'bg-[oklch(0.25_0.04_280)] text-[oklch(0.6_0.04_280)] border-[oklch(0.25_0.04_280)]'}`}>
            {levelLabels[course.level] || course.level}
          </div>
          {course.isFeatured && (
            <div className="absolute top-3 left-3 badge-premium text-xs rounded-lg px-2 py-1">
              <Star className="h-3 w-3 ml-1 fill-current" />
              مميز
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-semibold text-white line-clamp-2 mb-2.5 group-hover:text-gradient-aurora transition-all duration-300">
            {course.title}
          </h3>

          <div className="flex items-center gap-2 mb-3">
            <Avatar className="h-6 w-6 border border-[oklch(0.627_0.265_303.9_/_0.3)]">
              <AvatarFallback className="bg-[oklch(0.627_0.265_303.9_/_0.15)] text-[oklch(0.827_0.165_303.9)] text-[10px] font-semibold">
                {course.user?.name?.charAt(0) || 'م'}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-[oklch(0.55_0.04_280)]">{course.user?.name || 'مجهول'}</span>
          </div>

          <div className="flex items-center gap-4 text-xs text-[oklch(0.5_0.03_280)] mb-3">
            <span className="flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" />
              {course._count.lessons} درس
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {course._count.enrollments} طالب
            </span>
          </div>

          <div className="cosmic-divider mb-3" />

          <div className="flex items-center justify-between pt-1">
            {course.price > 0 ? (
              <span className="text-lg font-bold text-gradient-coral-amber">
                ${course.price}
              </span>
            ) : (
              <Badge className="badge-free rounded-lg border">مجاني</Badge>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="text-[oklch(0.827_0.165_303.9)] hover:text-white hover:bg-[oklch(0.627_0.265_303.9_/_0.1)] rounded-xl text-xs"
            >
              التفاصيل
              <ChevronLeft className="h-3 w-3 mr-1" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
