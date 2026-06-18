'use client'

import { useRef, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Home, Flame, Clock, ThumbsUp, Bookmark } from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { cn } from '@/lib/utils'

interface Category {
  id: string
  name: string
  slug: string
  icon?: string | null
  color?: string | null
  _count?: { videos: number; courses: number }
}

interface CategoryChipsProps {
  categories: Category[]
}

const QUICK_FILTERS = [
  { id: 'home', label: 'الرئيسية', icon: Home },
  { id: 'trending', label: 'الرائج', icon: Flame },
  { id: 'latest', label: 'الأحدث', icon: Clock },
  { id: 'top', label: 'الأعلى تقييماً', icon: ThumbsUp },
  { id: 'saved', label: 'المحفوظات', icon: Bookmark },
] as const

export default function CategoryChips({ categories }: CategoryChipsProps) {
  const { activeCategory, setActiveCategory, navigateToSearch, navigateToProfileTab, goHome, user } = useAppStore() as {
    activeCategory: string | null
    setActiveCategory: (c: string | null) => void
    navigateToSearch: (q: string) => void
    navigateToProfileTab: (tab: 'videos' | 'courses' | 'saved') => void
    goHome: () => void
    user: { id: string } | null
  }
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showLeftFade, setShowLeftFade] = useState(false)
  const [showRightFade, setShowRightFade] = useState(true)

  const updateFades = () => {
    const el = scrollRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    // RTL: scrollLeft is negative or reversed in some browsers
    const maxScroll = scrollWidth - clientWidth
    setShowRightFade(Math.abs(scrollLeft) < maxScroll - 4)
    setShowLeftFade(Math.abs(scrollLeft) > 4)
  }

  useEffect(() => {
    updateFades()
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', updateFades, { passive: true })
    window.addEventListener('resize', updateFades)
    return () => {
      el.removeEventListener('scroll', updateFades)
      window.removeEventListener('resize', updateFades)
    }
  }, [categories.length])

  const handleQuickFilter = (id: string) => {
    if (id === 'home') {
      goHome()
    } else if (id === 'trending') {
      setActiveCategory(null)
      navigateToSearch('')
    } else if (id === 'latest') {
      navigateToSearch('')
    } else if (id === 'top') {
      navigateToSearch('')
    } else if (id === 'saved') {
      if (user) navigateToProfileTab('saved')
      else navigateToSearch('')
    }
  }

  const handleCategory = (catId: string | null) => {
    setActiveCategory(catId)
    if (catId) {
      const cat = categories.find((c) => c.id === catId)
      if (cat) navigateToSearch(cat.slug)
    } else {
      goHome()
    }
  }

  const scrollBy = (dir: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' })
  }

  return (
    <div className="sticky top-16 z-30 bg-[oklch(0.08_0.02_280_/_0.85)] backdrop-blur-xl border-b border-[oklch(0.20_0.03_280)] lg:hidden">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        <div className="relative flex items-center gap-1 py-3">
          {/* Left scroll button (RTL: points right) */}
          {showLeftFade && (
            <button
              onClick={() => scrollBy('left')}
              aria-label="تمرير لليمين"
              className="shrink-0 w-9 h-9 rounded-full glass-aurora border border-[oklch(0.25_0.04_280)] text-white hover:bg-[oklch(0.627_0.265_303.9_/_0.2)] flex items-center justify-center transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}

          {/* Scrollable chips */}
          <div
            ref={scrollRef}
            className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-hide scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {/* Quick filters */}
            {QUICK_FILTERS.map((f) => {
              const Icon = f.icon
              const isActive = activeCategory === null && f.id === 'home'
              return (
                <button
                  key={f.id}
                  onClick={() => handleQuickFilter(f.id)}
                  className={cn(
                    'shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300',
                    isActive
                      ? 'bg-white text-[oklch(0.10_0.025_280)] shadow-lg'
                      : 'glass-aurora text-[oklch(0.85_0.02_280)] border border-[oklch(0.22_0.03_280)] hover:bg-[oklch(0.18_0.03_280)] hover:text-white'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{f.label}</span>
                </button>
              )
            })}

            {/* Divider */}
            <div className="shrink-0 h-7 w-px bg-[oklch(0.22_0.03_280)] mx-1" />

            {/* All */}
            <button
              onClick={() => handleCategory(null)}
              className={cn(
                'shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300',
                activeCategory === null
                  ? 'bg-white text-[oklch(0.10_0.025_280)] shadow-lg'
                  : 'glass-aurora text-[oklch(0.85_0.02_280)] border border-[oklch(0.22_0.03_280)] hover:bg-[oklch(0.18_0.03_280)] hover:text-white'
              )}
            >
              الكل
            </button>

            {/* Categories */}
            {categories.map((cat, idx) => {
              const isActive = activeCategory === cat.id
              return (
                <motion.button
                  key={cat.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(idx * 0.02, 0.3) }}
                  onClick={() => handleCategory(cat.id)}
                  className={cn(
                    'shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300',
                    isActive
                      ? 'text-white shadow-lg'
                      : 'glass-aurora text-[oklch(0.85_0.02_280)] border border-[oklch(0.22_0.03_280)] hover:bg-[oklch(0.18_0.03_280)] hover:text-white'
                  )}
                  style={
                    isActive
                      ? {
                          background:
                            cat.color ||
                            'linear-gradient(135deg, oklch(0.627 0.265 303.9), oklch(0.715 0.183 192.5))',
                        }
                      : undefined
                  }
                >
                  <span>{cat.name}</span>
                  {cat._count && cat._count.videos > 0 && (
                    <span
                      className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded-md',
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-[oklch(0.18_0.03_280)] text-[oklch(0.55_0.04_280)]'
                      )}
                    >
                      {cat._count.videos}
                    </span>
                  )}
                </motion.button>
              )
            })}

            {/* Spacer to allow scroll */}
            <div className="shrink-0 w-2" />
          </div>

          {/* Right scroll button (RTL: points left) */}
          {showRightFade && (
            <button
              onClick={() => scrollBy('right')}
              aria-label="تمرير لليسار"
              className="shrink-0 w-9 h-9 rounded-full glass-aurora border border-[oklch(0.25_0.04_280)] text-white hover:bg-[oklch(0.627_0.265_303.9_/_0.2)] flex items-center justify-center transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
