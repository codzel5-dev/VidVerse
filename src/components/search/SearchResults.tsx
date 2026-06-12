'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Video, BookOpen, Tag } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import EmptyState from '@/components/common/EmptyState'
import VideoCard from '@/components/video/VideoCard'
import CourseCard from '@/components/course/CourseCard'
import { useAppStore } from '@/store/app-store'
import type { VideoData } from '@/hooks/useVideos'
import type { CourseData } from '@/hooks/useCourses'

interface CategoryResult {
  id: string
  name: string
  slug: string
  _count: { videos: number; courses: number }
}

export default function SearchResults() {
  const searchQuery = useAppStore((s) => s.searchQuery)
  const [videos, setVideos] = useState<VideoData[]>([])
  const [courses, setCourses] = useState<CourseData[]>([])
  const [categories, setCategories] = useState<CategoryResult[]>([])
  const [loading, setLoading] = useState(true)
  const navigateToSearch = useAppStore((s) => s.navigateToSearch)

  useEffect(() => {
    if (!searchQuery) return
    let cancelled = false
    const doSearch = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
        const data = await res.json()
        if (!cancelled) {
          setVideos(data.results?.videos || [])
          setCourses(data.results?.courses || [])
          setCategories(data.results?.categories || [])
        }
      } catch {
        if (!cancelled) {
          setVideos([])
          setCourses([])
          setCategories([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    doSearch()
    return () => { cancelled = true }
  }, [searchQuery])

  if (loading) return <LoadingSpinner text="جاري البحث..." />

  const totalResults = videos.length + courses.length + categories.length

  if (!searchQuery) {
    return <EmptyState title="ابحث عن محتوى" description="أدخل كلمة بحث للعثور على فيديوهات وكورسات" icon="search" />
  }

  if (totalResults === 0) {
    return (
      <EmptyState
        title="لا توجد نتائج"
        description={`لم يتم العثور على نتائج لـ "${searchQuery}"`}
        icon="search"
        action={{ label: 'عرض الكل', onClick: () => navigateToSearch('') }}
      />
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">
          نتائج البحث عن &quot;{searchQuery}&quot;
        </h1>
        <p className="text-sm text-[oklch(0.55_0.04_280)] mt-1">{totalResults} نتيجة</p>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="rounded-2xl bg-[oklch(0.13_0.028_280)] border border-[oklch(0.25_0.04_280)] p-1 h-auto">
          <TabsTrigger value="all" className="rounded-xl data-[state=active]:bg-[oklch(0.627_0.265_303.9_/_0.15)] data-[state=active]:text-[oklch(0.827_0.165_303.9)]">
            الكل ({totalResults})
          </TabsTrigger>
          <TabsTrigger value="videos" className="rounded-xl data-[state=active]:bg-[oklch(0.627_0.265_303.9_/_0.15)] data-[state=active]:text-[oklch(0.827_0.165_303.9)]">
            <Video className="h-4 w-4 ml-1" />
            فيديوهات ({videos.length})
          </TabsTrigger>
          <TabsTrigger value="courses" className="rounded-xl data-[state=active]:bg-[oklch(0.627_0.265_303.9_/_0.15)] data-[state=active]:text-[oklch(0.827_0.165_303.9)]">
            <BookOpen className="h-4 w-4 ml-1" />
            كورسات ({courses.length})
          </TabsTrigger>
          {categories.length > 0 && (
            <TabsTrigger value="categories" className="rounded-xl data-[state=active]:bg-[oklch(0.627_0.265_303.9_/_0.15)] data-[state=active]:text-[oklch(0.827_0.165_303.9)]">
              <Tag className="h-4 w-4 ml-1" />
              تصنيفات ({categories.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="all" className="mt-4 space-y-8">
          {videos.length > 0 && (
            <div>
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Video className="h-5 w-5 text-[oklch(0.796_0.13_162.48)]" />
                فيديوهات
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {videos.slice(0, 4).map((video, index) => (
                  <VideoCard key={video.id} video={video} index={index} />
                ))}
              </div>
            </div>
          )}
          {courses.length > 0 && (
            <div>
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[oklch(0.855_0.183_68.5)]" />
                كورسات
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {courses.slice(0, 4).map((course, index) => (
                  <CourseCard key={course.id} course={course} index={index} />
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="videos" className="mt-4">
          {videos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {videos.map((video, index) => (
                <VideoCard key={video.id} video={video} index={index} />
              ))}
            </div>
          ) : (
            <EmptyState title="لا توجد فيديوهات" icon="search" />
          )}
        </TabsContent>

        <TabsContent value="courses" className="mt-4">
          {courses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {courses.map((course, index) => (
                <CourseCard key={course.id} course={course} index={index} />
              ))}
            </div>
          ) : (
            <EmptyState title="لا توجد كورسات" icon="search" />
          )}
        </TabsContent>

        <TabsContent value="categories" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <Card
                key={cat.id}
                onClick={() => navigateToSearch(cat.name)}
                className="glass-card p-4 rounded-2xl cursor-pointer hover:border-[oklch(0.627_0.265_303.9_/_0.3)] transition-all duration-300 card-aurora"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl gradient-aurora flex items-center justify-center">
                    <Tag className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">{cat.name}</h4>
                    <p className="text-xs text-[oklch(0.55_0.04_280)]">
                      {cat._count.videos} فيديو • {cat._count.courses} كورس
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
