'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Play, BookOpen, Users, Eye, Video, Sparkles } from 'lucide-react'
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

// Floating particles component
function FloatingParticles() {
  const [mounted, setMounted] = useState(false)
  const [particles, setParticles] = useState<Array<{
    id: number
    size: number
    x: number
    y: number
    delay: number
    duration: number
    color: string
  }>>([])

  useEffect(() => {
    const generated = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      size: Math.random() * 4 + 2,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 5,
      duration: Math.random() * 4 + 4,
      color: [
        'oklch(0.627 0.265 303.9 / 0.3)',
        'oklch(0.715 0.183 192.5 / 0.3)',
        'oklch(0.645 0.246 16.4 / 0.2)',
        'oklch(0.755 0.183 68.5 / 0.2)',
      ][i % 4],
    }))
    setParticles(generated)
    setMounted(true)
  }, [])

  if (!mounted) return <div className="absolute inset-0 overflow-hidden pointer-events-none" />

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            background: p.color,
            left: `${p.x}%`,
            top: `${p.y}%`,
            filter: 'blur(0.5px)',
          }}
          animate={{
            y: [-20, 20, -20],
            x: [-10, 10, -10],
            opacity: [0.3, 0.8, 0.3],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

export default function HeroSection({ stats: propStats }: HeroSectionProps) {
  const { navigateToSearch, goHome } = useAppStore()
  const stats = propStats

  const statItems = [
    { icon: Video, label: 'فيديو', value: stats?.totalVideos || 0, gradient: 'from-[oklch(0.627_0.265_303.9)] to-[oklch(0.715_0.183_192.5)]' },
    { icon: Users, label: 'مستخدم', value: stats?.totalUsers || 0, gradient: 'from-[oklch(0.645_0.246_16.4)] to-[oklch(0.755_0.183_68.5)]' },
    { icon: Eye, label: 'مشاهدة', value: stats?.totalViews || 0, gradient: 'from-[oklch(0.656_0.241_354.3)] to-[oklch(0.627_0.265_303.9)]' },
    { icon: BookOpen, label: 'كورس', value: stats?.totalCourses || 0, gradient: 'from-[oklch(0.696_0.17_162.48)] to-[oklch(0.715_0.183_192.5)]' },
  ]

  return (
    <section className="relative overflow-hidden aurora-bg">
      {/* Background layers */}
      <div className="absolute inset-0 bg-gradient-to-b from-[oklch(0.10_0.04_280)] via-[oklch(0.12_0.05_303.9)] to-[oklch(0.08_0.02_280)]" />
      
      {/* Animated aurora orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ 
            x: [-50, 50, -50], 
            y: [-30, 30, -30],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[10%] left-[15%] w-[500px] h-[500px] rounded-full bg-[oklch(0.627_0.265_303.9_/_0.08)] blur-[100px]"
        />
        <motion.div
          animate={{ 
            x: [30, -30, 30], 
            y: [-40, 40, -40],
            scale: [1.1, 0.9, 1.1]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute top-[30%] right-[10%] w-[400px] h-[400px] rounded-full bg-[oklch(0.715_0.183_192.5_/_0.06)] blur-[80px]"
        />
        <motion.div
          animate={{ 
            x: [-20, 20, -20], 
            y: [20, -20, 20],
            scale: [1, 1.15, 1]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
          className="absolute bottom-[10%] left-[40%] w-[350px] h-[350px] rounded-full bg-[oklch(0.645_0.246_16.4_/_0.05)] blur-[90px]"
        />
      </div>

      {/* Floating particles */}
      <FloatingParticles />

      {/* Decorative geometric shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
          className="absolute top-[15%] right-[20%] w-32 h-32 border border-[oklch(0.627_0.265_303.9_/_0.1)] rounded-3xl"
        />
        <motion.div
          animate={{ rotate: [360, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          className="absolute bottom-[20%] left-[15%] w-24 h-24 border border-[oklch(0.715_0.183_192.5_/_0.1)] rounded-full"
        />
        <motion.div
          animate={{ rotate: [0, 180, 360] }}
          transition={{ duration: 50, repeat: Infinity, ease: 'linear' }}
          className="absolute top-[50%] right-[8%] w-16 h-16 border border-[oklch(0.645_0.246_16.4_/_0.08)] rotate-45"
        />
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 badge-aurora rounded-full px-4 py-1.5 mb-8"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="text-sm font-medium">منصة الفيديو الأكثر تطوراً</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-4xl sm:text-5xl lg:text-7xl font-extrabold leading-tight mb-6"
          >
            <span className="text-white">اكتشف عالم</span>
            <br />
            <span className="text-gradient-aurora">الفيديو المتقدم</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="text-lg sm:text-xl text-[oklch(0.65_0.03_280)] mb-12 leading-relaxed max-w-2xl mx-auto"
          >
            آلاف الفيديوهات التعليمية والدورات المتخصصة في البرمجة والتصميم والتسويق — كل ما تحتاجه في مكان واحد
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
          >
            <Button
              size="lg"
              onClick={() => goHome()}
              className="btn-aurora rounded-2xl font-semibold px-8 h-13 text-base"
            >
              <Play className="h-5 w-5 ml-2 fill-white" />
              <span>استكشف الفيديوهات</span>
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigateToSearch('كورس')}
              className="rounded-2xl border-[oklch(0.627_0.265_303.9_/_0.3)] text-white hover:bg-[oklch(0.627_0.265_303.9_/_0.1)] hover:border-[oklch(0.627_0.265_303.9_/_0.5)] font-semibold px-8 h-13 text-base bg-transparent"
            >
              <BookOpen className="h-5 w-5 ml-2" />
              <span>تصفح الكورسات</span>
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.8 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto"
          >
            {statItems.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9 + index * 0.1 }}
                className="glass-card rounded-2xl p-5 text-center group hover:border-[oklch(0.627_0.265_303.9_/_0.3)] transition-all duration-300"
              >
                <stat.icon className="h-5 w-5 text-[oklch(0.715_0.183_192.5)] mx-auto mb-3 group-hover:text-[oklch(0.815_0.183_192.5)] transition-colors" />
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                  <AnimatedCounter target={stat.value} />
                </div>
                <div className="text-sm text-[oklch(0.55_0.04_280)]">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[oklch(0.08_0.02_280)] to-transparent" />
    </section>
  )
}
