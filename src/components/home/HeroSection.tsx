'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Play, BookOpen, Users, Eye, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/app-store'

interface HeroSectionProps {
  stats?: {
    totalVideos: number
    totalUsers: number
    totalViews: number
    totalCourses: number
    totalRevenue: number
    freeVideos: number
    featuredVideos: number
  }
}

function AnimatedCounter({ target, duration = 2000 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0)
  const [mounted, setMounted] = useState(false)
  const hasAnimated = useRef(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || hasAnimated.current) return
    hasAnimated.current = true

    let start = 0
    const increment = target / (duration / 16)
    const timer = setInterval(() => {
      start += increment
      if (start >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)

    return () => clearInterval(timer)
  }, [target, duration, mounted])

  if (!mounted) return <span>0</span>
  return <span>{count.toLocaleString('ar-EG')}</span>
}

export default function HeroSection({ stats: propStats }: HeroSectionProps) {
  const { navigateToSearch, goHome } = useAppStore()
  const stats = propStats

  const statItems = [
    { icon: Video, label: 'فيديو', value: stats?.totalVideos || 0, color: 'from-emerald-400 to-teal-500' },
    { icon: Users, label: 'مستخدم', value: stats?.totalUsers || 0, color: 'from-amber-400 to-orange-500' },
    { icon: Eye, label: 'مشاهدة', value: stats?.totalViews || 0, color: 'from-rose-400 to-pink-500' },
    { icon: BookOpen, label: 'كورس', value: stats?.totalCourses || 0, color: 'from-violet-400 to-purple-500' },
  ]

  return (
    <section className="relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 gradient-emerald-teal opacity-95" />

      {/* Floating shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ y: [-20, 20, -20], rotate: [0, 10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-20 left-[10%] w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-sm"
        />
        <motion.div
          animate={{ y: [20, -20, 20], rotate: [0, -10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute top-40 right-[15%] w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm"
        />
        <motion.div
          animate={{ y: [-15, 15, -15], rotate: [0, 15, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute bottom-20 left-[20%] w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm"
        />
        <motion.div
          animate={{ y: [10, -10, 10] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          className="absolute top-10 right-[40%] w-12 h-12 rounded-xl bg-white/5 backdrop-blur-sm"
        />
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center max-w-3xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6"
          >
            مجتمع الفيديو
            <br />
            <span className="text-emerald-200">الأكثر تطوراً</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="text-lg sm:text-xl text-white/80 mb-10 leading-relaxed"
          >
            اكتشف آلاف الفيديوهات التعليمية والدورات المتخصصة في البرمجة والتصميم والتسويق وغيرها الكثير
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Button
              size="lg"
              onClick={() => goHome()}
              className="rounded-2xl bg-white text-emerald-700 hover:bg-white/90 font-semibold px-8 h-12 text-base shadow-lg"
            >
              <Play className="h-5 w-5 ml-2 fill-emerald-700" />
              استكشف الفيديوهات
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigateToSearch('كورس')}
              className="rounded-2xl border-white/30 text-white hover:bg-white/10 font-semibold px-8 h-12 text-base"
            >
              <BookOpen className="h-5 w-5 ml-2" />
              تصفح الكورسات
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.8 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto"
          >
            {statItems.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9 + index * 0.1 }}
                className="bg-white/15 backdrop-blur-md rounded-2xl p-4 text-center"
              >
                <stat.icon className="h-5 w-5 text-white/80 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">
                  <AnimatedCounter target={stat.value} />
                </div>
                <div className="text-sm text-white/70">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
