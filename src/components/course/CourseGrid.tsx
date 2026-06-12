'use client'

import { motion } from 'framer-motion'
import { useCourses, type CourseData } from '@/hooks/useCourses'
import CourseCard from './CourseCard'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import EmptyState from '@/components/common/EmptyState'

interface CourseGridProps {
  courses?: CourseData[]
  loading?: boolean
}

export default function CourseGrid({ courses: propCourses, loading: propLoading }: CourseGridProps) {
  const { courses: fetchedCourses, loading: fetchedLoading } = useCourses({ limit: 12 })
  const courses = propCourses || fetchedCourses
  const loading = propLoading !== undefined ? propLoading : fetchedLoading

  if (loading) return <LoadingSpinner text="جاري تحميل الكورسات..." />
  if (courses.length === 0) {
    return <EmptyState title="لا توجد كورسات" description="لم يتم العثور على كورسات" />
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
    >
      {courses.map((course, index) => (
        <CourseCard key={course.id} course={course} index={index} />
      ))}
    </motion.div>
  )
}
