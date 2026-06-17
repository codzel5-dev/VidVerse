'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  Film,
  GraduationCap,
  TrendingUp,
  Music,
  Palette,
  Code,
  Camera,
  Gamepad2,
  BookOpen,
  X,
  Home,
  Flame,
  Clock,
  ThumbsUp,
  Bookmark,
  Settings,
  User,
} from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { useAuthStore } from '@/store/auth-store'
import { useCategories } from '@/hooks/useCategories'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'

const categoryIcons: Record<string, typeof Film> = {
  programming: Code,
  design: Palette,
  marketing: TrendingUp,
  music: Music,
  photography: Camera,
  gaming: Gamepad2,
  education: BookOpen,
  film: Film,
  default: GraduationCap,
}

// Aurora gradient palette for category icons
const categoryGradients: string[] = [
  'from-[oklch(0.627_0.265_303.9)] to-[oklch(0.715_0.183_192.5)]',
  'from-[oklch(0.645_0.246_16.4)] to-[oklch(0.755_0.183_68.5)]',
  'from-[oklch(0.656_0.241_354.3)] to-[oklch(0.627_0.265_303.9)]',
  'from-[oklch(0.696_0.17_162.48)] to-[oklch(0.715_0.183_192.5)]',
  'from-[oklch(0.623_0.214_259.8)] to-[oklch(0.627_0.265_303.9)]',
  'from-[oklch(0.755_0.183_68.5)] to-[oklch(0.645_0.246_16.4)]',
]

export default function Sidebar() {
  const {
    sidebarOpen,
    setSidebarOpen,
    activeCategory,
    setActiveCategory,
    navigateToSearch,
    goHome,
    setView,
    navigateToProfileTab,
  } = useAppStore() as {
    sidebarOpen: boolean
    setSidebarOpen: (open: boolean) => void
    activeCategory: string | null
    setActiveCategory: (c: string | null) => void
    navigateToSearch: (q: string) => void
    goHome: () => void
    setView: (v: 'home' | 'video' | 'course' | 'profile' | 'admin' | 'search' | 'login' | 'register') => void
    navigateToProfileTab: (tab: 'videos' | 'courses' | 'saved') => void
  }
  const { categories, loading } = useCategories()
  const { user } = useAuthStore()

  const handleCategory = (categoryId: string | null, categoryName?: string) => {
    setActiveCategory(categoryId)
    if (categoryId === null) {
      goHome()
    } else if (categoryName) {
      navigateToSearch(categoryName)
    }
    setSidebarOpen(false)
  }

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: sidebarOpen ? 0 : 320,
        }}
        transition={{ type: 'spring', damping: 28, stiffness: 240 }}
        className="fixed top-16 right-0 bottom-0 w-72 bg-[oklch(0.10_0.025_280)] border-l border-[oklch(0.20_0.03_280)] z-50 lg:static lg:translate-x-0 lg:z-auto lg:bg-transparent lg:border-0"
      >
        <div className="flex items-center justify-between p-4 lg:hidden">
          <h3 className="font-semibold text-white">القوائم</h3>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg hover:bg-[oklch(0.18_0.03_280)] text-[oklch(0.7_0.04_280)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <ScrollArea className="h-[calc(100vh-4rem)] lg:h-[calc(100vh-9rem)]">
          <div className="p-3 space-y-1">
            {/* Main nav */}
            <SidebarItem
              icon={Home}
              label="الرئيسية"
              active={activeCategory === null}
              onClick={() => handleCategory(null)}
            />
            <SidebarItem
              icon={Flame}
              label="الرائج"
              onClick={() => {
                navigateToSearch('')
                setSidebarOpen(false)
              }}
            />
            <SidebarItem
              icon={Clock}
              label="الأحدث"
              onClick={() => {
                navigateToSearch('')
                setSidebarOpen(false)
              }}
            />
            <SidebarItem
              icon={ThumbsUp}
              label="الأعلى تقييماً"
              onClick={() => {
                navigateToSearch('')
                setSidebarOpen(false)
              }}
            />
            {user && (
              <SidebarItem
                icon={Bookmark}
                label="المحفوظات"
                onClick={() => {
                  navigateToProfileTab('saved')
                  setSidebarOpen(false)
                }}
              />
            )}

            {/* Divider */}
            <div className="h-px bg-[oklch(0.20_0.03_280)] my-3" />

            {/* Categories label */}
            <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-[oklch(0.45_0.03_280)]">
              التصنيفات
            </div>

            {/* All categories */}
            <SidebarItem
              icon={Film}
              label="كل التصنيفات"
              active={activeCategory === null}
              onClick={() => handleCategory(null)}
            />

            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[oklch(0.18_0.03_280)] animate-pulse" />
                  <div className="h-4 w-24 bg-[oklch(0.18_0.03_280)] rounded animate-pulse" />
                </div>
              ))
            ) : (
              categories.map((category, index) => {
                const slug = category.slug || 'default'
                const Icon = categoryIcons[slug] || categoryIcons.default
                const gradientClass = categoryGradients[index % categoryGradients.length]

                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategory(category.id, category.name)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm group',
                      activeCategory === category.id
                        ? 'bg-[oklch(0.627_0.265_303.9_/_0.15)] text-white font-medium'
                        : 'text-[oklch(0.7_0.04_280)] hover:bg-[oklch(0.15_0.03_280)] hover:text-white'
                    )}
                  >
                    <div
                      className={cn(
                        'w-7 h-7 rounded-lg bg-gradient-to-br flex items-center justify-center shrink-0 transition-transform group-hover:scale-110',
                        gradientClass
                      )}
                    >
                      <Icon className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="flex-1 text-right truncate">{category.name}</span>
                    {category._count?.videos !== undefined && (
                      <span
                        className={cn(
                          'text-[10px] px-1.5 py-0.5 rounded-md',
                          activeCategory === category.id
                            ? 'bg-white/20 text-white'
                            : 'bg-[oklch(0.18_0.03_280)] text-[oklch(0.55_0.04_280)]'
                        )}
                      >
                        {category._count.videos}
                      </span>
                    )}
                  </button>
                )
              })
            )}

            {/* Divider */}
            <div className="h-px bg-[oklch(0.20_0.03_280)] my-3" />

            {/* User section */}
            {user ? (
              <>
                <SidebarItem
                  icon={User}
                  label="الملف الشخصي"
                  onClick={() => {
                    setView('profile')
                    setSidebarOpen(false)
                  }}
                />
                {user.role === 'admin' && (
                  <SidebarItem
                    icon={Settings}
                    label="لوحة التحكم"
                    onClick={() => {
                      setView('admin')
                      setSidebarOpen(false)
                    }}
                  />
                )}
              </>
            ) : (
              <>
                <SidebarItem
                  icon={User}
                  label="تسجيل الدخول"
                  onClick={() => {
                    setView('login')
                    setSidebarOpen(false)
                  }}
                />
              </>
            )}

            {/* Footer info */}
            <div className="px-3 pt-4 pb-2 text-[11px] text-[oklch(0.4_0.03_280)] leading-relaxed">
              <p>© 2026 VidVerse</p>
              <p className="mt-1">منصة الفيديو الاحترافية</p>
            </div>
          </div>
        </ScrollArea>
      </motion.aside>
    </>
  )
}

function SidebarItem({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof Home
  label: string
  active?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm group',
        active
          ? 'bg-[oklch(0.627_0.265_303.9_/_0.15)] text-white font-medium'
          : 'text-[oklch(0.7_0.04_280)] hover:bg-[oklch(0.15_0.03_280)] hover:text-white'
      )}
    >
      <Icon
        className={cn(
          'h-4 w-4 shrink-0 transition-colors',
          active ? 'text-[oklch(0.827_0.165_303.9)]' : 'text-[oklch(0.6_0.04_280)] group-hover:text-white'
        )}
      />
      <span className="flex-1 text-right">{label}</span>
    </button>
  )
}
