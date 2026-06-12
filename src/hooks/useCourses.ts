'use client'

import { useState, useEffect, useCallback } from 'react'

interface CourseData {
  id: string
  title: string
  slug: string
  description: string | null
  thumbnail: string | null
  price: number
  currency: string
  level: string
  isPublished: boolean
  isFeatured: boolean
  categoryId: string | null
  userId: string
  createdAt: string
  user: { id: string; name: string; avatar: string | null }
  category: { id: string; name: string; slug: string } | null
  courseTags: { tag: { id: string; name: string; slug: string } }[]
  _count: { enrollments: number; lessons: number }
  lessons?: {
    id: string
    title: string
    description: string | null
    order: number
    duration: number
    isFree: boolean
    video: { id: string; title: string; duration: number; thumbnail: string | null; isFree: boolean } | null
  }[]
  enrollments?: { id: string; userId: string; progress: number; isCompleted: boolean }[]
}

interface UseCoursesOptions {
  page?: number
  limit?: number
  category?: string | null
  level?: string
  sort?: string
  search?: string
}

export function useCourses(options: UseCoursesOptions = {}) {
  const [courses, setCourses] = useState<CourseData[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCourses = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (options.page) params.set('page', options.page.toString())
      if (options.limit) params.set('limit', options.limit.toString())
      if (options.category) params.set('category', options.category)
      if (options.level) params.set('level', options.level)
      if (options.sort) params.set('sort', options.sort)
      if (options.search) params.set('search', options.search)

      const res = await fetch(`/api/course?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch courses')
      const data = await res.json()
      setCourses(data.courses)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء جلب الكورسات')
    } finally {
      setLoading(false)
    }
  }, [options.page, options.limit, options.category, options.level, options.sort, options.search])

  useEffect(() => {
    let cancelled = false
    const doFetch = async () => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        if (options.page) params.set('page', options.page.toString())
        if (options.limit) params.set('limit', options.limit.toString())
        if (options.category) params.set('category', options.category)
        if (options.level) params.set('level', options.level)
        if (options.sort) params.set('sort', options.sort)
        if (options.search) params.set('search', options.search)

        const res = await fetch(`/api/course?${params.toString()}`)
        if (!res.ok) throw new Error('Failed to fetch courses')
        const data = await res.json()
        if (!cancelled) {
          setCourses(data.courses)
          setPagination(data.pagination)
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'حدث خطأ أثناء جلب الكورسات')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    doFetch()
    return () => { cancelled = true }
  }, [options.page, options.limit, options.category, options.level, options.sort, options.search])

  return { courses, pagination, loading, error, refetch: fetchCourses }
}

export function useCourseDetail(id: string | null) {
  const [course, setCourse] = useState<CourseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    const doFetch = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/course/${id}`)
        if (!res.ok) throw new Error('الكورس غير موجود')
        const data = await res.json()
        if (!cancelled) setCourse(data.course)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'حدث خطأ أثناء جلب الكورس')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    doFetch()
    return () => { cancelled = true }
  }, [id])

  const refetch = async () => {
    if (!id) return
    try {
      const res = await fetch(`/api/course/${id}`)
      if (!res.ok) throw new Error('الكورس غير موجود')
      const data = await res.json()
      setCourse(data.course)
    } catch {
      // silently fail refetch
    }
  }

  return { course, loading, error, refetch }
}

export type { CourseData }
