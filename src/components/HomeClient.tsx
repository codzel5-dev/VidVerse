'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu } from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Sidebar from '@/components/layout/Sidebar'
import AdBannerSlider from '@/components/home/AdBannerSlider'
import CategoryChips from '@/components/home/CategoryChips'
import MainVideoGrid from '@/components/home/MainVideoGrid'
import FeaturedCourses from '@/components/home/FeaturedCourses'
import VideoDetail from '@/components/video/VideoDetail'
import CourseDetail from '@/components/course/CourseDetail'
import LoginForm from '@/components/auth/LoginForm'
import RegisterForm from '@/components/auth/RegisterForm'
import ProfilePage from '@/components/auth/ProfilePage'
import AdminDashboard from '@/components/admin/AdminDashboard'
import SearchResults from '@/components/search/SearchResults'
import { useAppStore } from '@/store/app-store'

export interface Banner {
  id: string
  title: string
  subtitle: string | null
  description: string | null
  imageUrl: string | null
  videoUrl: string | null
  linkUrl: string | null
  buttonText: string | null
  isActive: boolean
  order: number
}

export interface InitialData {
  videos: VideoData[]
  courses: CourseData[]
  categories: CategoryData[]
  stats: {
    totalVideos: number
    totalUsers: number
    totalViews: number
    totalCourses: number
    totalRevenue: number
    freeVideos: number
    featuredVideos: number
  }
  banners?: Banner[]
}

interface VideoData {
  id: string
  title: string
  slug: string
  shareCode: string
  description: string | null
  thumbnail: string | null
  duration: number
  views: number
  isFree: boolean
  isPublished: boolean
  isFeatured: boolean
  embedUrl: string | null
  categoryId: string | null
  userId: string
  createdAt: string
  user: { id: string; name: string; avatar: string | null }
  category: { id: string; name: string; slug: string } | null
  videoTags: { tag: { id: string; name: string; slug: string } }[]
  _count: { likes: number; comments: number }
}

interface CourseData {
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
}

interface CategoryData {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  color: string | null
  order: number
  isActive: boolean
  _count: { videos: number; courses: number }
}

// Global cache for initial data
let _initialData: InitialData | null = null

export function getInitialData(): InitialData | null {
  return _initialData
}

function HomeView({ data }: { data: InitialData }) {
  const { activeCategory, sidebarOpen, setSidebarOpen } = useAppStore()
  const [banners, setBanners] = useState<Banner[]>(data.banners || [])

  // Refetch banners periodically (in case admin added new ones)
  useEffect(() => {
    let cancelled = false
    const fetchBanners = async () => {
      try {
        const res = await fetch('/api/banners')
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled && Array.isArray(data.banners)) {
          setBanners(data.banners)
        }
      } catch {
        // silent
      }
    }
    // Refetch after a short delay to ensure latest
    const t = setTimeout(fetchBanners, 800)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [])

  return (
    <div className="flex">
      {/* Sidebar - desktop only, hidden on home view when activeCategory is null for more space */}
      <div className="hidden lg:block w-64 shrink-0 sticky top-16 self-start h-[calc(100vh-4rem)] overflow-hidden">
        <Sidebar />
      </div>

      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed bottom-20 right-4 z-30 w-12 h-12 rounded-full btn-aurora shadow-2xl flex items-center justify-center"
        aria-label="القائمة"
      >
        <Menu className="h-5 w-5 text-white" />
      </button>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Ad Banner Slider */}
        <AdBannerSlider banners={banners} />

        {/* Category chips bar (sticky) */}
        <CategoryChips categories={data.categories} />

        {/* Main video grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <MainVideoGrid initialVideos={data.videos} activeCategory={activeCategory} />

          {/* Featured courses */}
          <div className="mt-12">
            <FeaturedCourses initialCourses={data.courses} />
          </div>
        </div>
      </div>
    </div>
  )
}

function ViewRenderer({ data }: { data: InitialData }) {
  const currentView = useAppStore((s) => s.currentView)
  const selectedUserId = useAppStore((s) => s.selectedUserId)

  return (
    <AnimatePresence mode="wait">
      <motion.main
        key={currentView + (selectedUserId || '')}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="flex-1"
      >
        {currentView === 'home' && <HomeView data={data} />}
        {currentView === 'video' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <VideoDetail />
          </div>
        )}
        {currentView === 'course' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <CourseDetail />
          </div>
        )}
        {currentView === 'profile' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <ProfilePage userId={selectedUserId} />
          </div>
        )}
        {currentView === 'admin' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <AdminDashboard />
          </div>
        )}
        {currentView === 'search' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <SearchResults />
          </div>
        )}
        {currentView === 'login' && <LoginForm />}
        {currentView === 'register' && <RegisterForm />}
      </motion.main>
    </AnimatePresence>
  )
}

export default function HomeClient({ initialData }: { initialData: InitialData }) {
  // Store initial data for access by child components
  useEffect(() => {
    _initialData = initialData
  }, [initialData])

  const setView = useAppStore((s) => s.setView)
  const setSelectedVideoId = useAppStore((s) => s.setSelectedVideoId)
  const setSelectedCourseId = useAppStore((s) => s.setSelectedCourseId)
  const setSelectedUserId = useAppStore((s) => s.setSelectedUserId)
  const setSearchQuery = useAppStore((s) => s.setSearchQuery)

  // Initialize from URL parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const videoCode = params.get('v')
    const courseCode = params.get('c')
    const userCode = params.get('u')
    const search = params.get('q')

    if (videoCode) {
      setSelectedVideoId(videoCode)
      setView('video')
    } else if (courseCode) {
      setSelectedCourseId(courseCode)
      setView('course')
    } else if (userCode) {
      setSelectedUserId(userCode)
      setView('profile')
    } else if (search) {
      setSearchQuery(search)
      setView('search')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search)
      const videoCode = params.get('v')
      const courseCode = params.get('c')
      const userCode = params.get('u')
      const search = params.get('q')

      if (videoCode) {
        setSelectedVideoId(videoCode)
        setView('video')
      } else if (courseCode) {
        setSelectedCourseId(courseCode)
        setView('course')
      } else if (userCode) {
        setSelectedUserId(userCode)
        setView('profile')
      } else if (search) {
        setSearchQuery(search)
        setView('search')
      } else {
        setView('home')
        setSelectedVideoId(null)
        setSelectedCourseId(null)
        setSelectedUserId(null)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen flex flex-col bg-background cosmic-stars">
      <Header />
      <ViewRenderer data={initialData} />
      <Footer />
    </div>
  )
}
