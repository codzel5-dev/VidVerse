'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Eye, DollarSign } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { useAppStore } from '@/store/app-store'

interface AdminCourse {
  id: string
  title: string
  price: number
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
  const navigateToCourse = useAppStore((s) => s.navigateToCourse)

  useEffect(() => {
    fetch('/api/course?limit=50')
      .then((res) => res.json())
      .then((data) => setCourses(data.courses || []))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{courses.length} كورس</p>

      <div className="space-y-3">
        {courses.map((course, index) => (
          <motion.div
            key={course.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <Card className="p-4 rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-20 h-14 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shrink-0">
                  <BookOpen className="h-6 w-6 text-white/60" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-stone-800 line-clamp-1">{course.title}</h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <span>{course.user?.name}</span>
                    <span>•</span>
                    <span>{course._count.lessons} درس</span>
                    <span>•</span>
                    <span>{course._count.enrollments} طالب</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className="bg-stone-100 text-stone-600 border-0 rounded-lg text-xs">
                    {levelLabels[course.level] || course.level}
                  </Badge>
                  {course.price > 0 ? (
                    <Badge className="bg-emerald-100 text-emerald-700 border-0 rounded-lg text-xs">
                      <DollarSign className="h-3 w-3 ml-0.5" />${course.price}
                    </Badge>
                  ) : (
                    <Badge className="bg-sky-100 text-sky-700 border-0 rounded-lg text-xs">مجاني</Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg shrink-0"
                  onClick={() => navigateToCourse(course.id)}
                >
                  <Eye className="h-4 w-4 text-stone-500" />
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {courses.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">لا توجد كورسات</div>
      )}
    </div>
  )
}
