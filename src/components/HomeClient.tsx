'use client'

import { useState, useEffect, useCallback } from 'react'
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
    <div className="space-y-12">
      <HeroSection stats={data.stats} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
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
  _initialData = initialData

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Header />
      <ViewRenderer data={initialData} />
      <Footer />
    </div>
  )
}
