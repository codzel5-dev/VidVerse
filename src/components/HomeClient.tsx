'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import HeroSection from '@/components/home/HeroSection'
import LatestVideos from '@/components/home/LatestVideos'
import FeaturedCourses from '@/components/home/FeaturedCourses'
import TopRatedVideos from '@/components/home/TopRatedVideos'
import CategorySection from '@/components/home/CategorySection'
import StatsBar from '@/components/home/StatsBar'
import VideoDetail from '@/components/video/VideoDetail'
import CourseDetail from '@/components/course/CourseDetail'
import LoginForm from '@/components/auth/LoginForm'
import RegisterForm from '@/components/auth/RegisterForm'
import ProfilePage from '@/components/auth/ProfilePage'
import AdminDashboard from '@/components/admin/AdminDashboard'
import SearchResults from '@/components/search/SearchResults'
import { useAppStore } from '@/store/app-store'

export interface InitialData {
  videos: any[]
  courses: any[]
  categories: any[]
  stats: {
    totalVideos: number
    totalUsers: number
    totalViews: number
    totalCourses: number
    totalRevenue: number
    freeVideos: number
    featuredVideos: number
  }
}

// Global cache for initial data
let _initialData: InitialData | null = null

export function getInitialData(): InitialData | null {
  return _initialData
}

function HomeView({ data }: { data: InitialData }) {
  return (
    <div className="space-y-0">
      <HeroSection stats={data.stats} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 py-12">
        <StatsBar stats={data.stats} />
        <LatestVideos initialVideos={data.videos} />
        <FeaturedCourses initialCourses={data.courses} />
        <TopRatedVideos initialVideos={data.videos} />
        <CategorySection initialCategories={data.categories} />
      </div>
    </div>
  )
}

function ViewRenderer({ data }: { data: InitialData }) {
  const currentView = useAppStore((s) => s.currentView)

  return (
    <AnimatePresence mode="wait">
      <motion.main
        key={currentView}
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
            <ProfilePage />
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
  const setSearchQuery = useAppStore((s) => s.setSearchQuery)

  // Initialize from URL parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const videoCode = params.get('v')
    const courseCode = params.get('c')
    const search = params.get('q')

    if (videoCode) {
      setSelectedVideoId(videoCode)
      setView('video')
    } else if (courseCode) {
      setSelectedCourseId(courseCode)
      setView('course')
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
      const search = params.get('q')

      if (videoCode) {
        setSelectedVideoId(videoCode)
        setView('video')
      } else if (courseCode) {
        setSelectedCourseId(courseCode)
        setView('course')
      } else if (search) {
        setSearchQuery(search)
        setView('search')
      } else {
        setView('home')
        setSelectedVideoId(null)
        setSelectedCourseId(null)
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
