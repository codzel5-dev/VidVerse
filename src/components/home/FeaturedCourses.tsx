'use client'

import CourseCard from '@/components/course/CourseCard'
import SectionHeader from '@/components/common/SectionHeader'
import EmptyState from '@/components/common/EmptyState'
import { useAppStore } from '@/store/app-store'

interface CourseItem {
  id: string
  title: string
  slug: string
  description: string | null
  thumbnail: string | null
  price: number
  isFree: boolean
  isPublished: boolean
  level: string | null
  userId: string
  createdAt: string
  user: { id: string; name: string; avatar: string | null }
  category: { id: string; name: string; slug: string } | null
  lessons: { id: string }[]
  _count: { enrollments: number }
  [key: string]: unknown
}

interface FeaturedCoursesProps {
  initialCourses?: CourseItem[]
}

export default function FeaturedCourses({ initialCourses = [] }: FeaturedCoursesProps) {
  const navigateToSearch = useAppStore((s) => s.navigateToSearch)
  const courses = initialCourses

  if (courses.length === 0) {
    return (
      <div>
        <SectionHeader title="الكورسات المميزة" />
        <EmptyState title="لا توجد كورسات" description="لم يتم العثور على كورسات حالياً" />
      </div>
    )
  }

  return (
    <section>
      <SectionHeader
        title="الكورسات المميزة"
        subtitle="تعلم من أفضل المدربين"
        onSeeAll={() => navigateToSearch('كورس')}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {courses.map((course, index) => (
          <CourseCard key={course.id} course={course} index={index} />
        ))}
      </div>
    </section>
  )
}
