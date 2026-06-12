'use client'

import { motion } from 'framer-motion'
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
} from 'lucide-react'
import { useAppStore } from '@/store/app-store'
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

const categoryColors: string[] = [
  'from-emerald-400 to-teal-500',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-pink-500',
  'from-violet-400 to-purple-500',
  'from-cyan-400 to-blue-500',
  'from-lime-400 to-green-500',
  'from-fuchsia-400 to-pink-500',
  'from-sky-400 to-indigo-500',
]

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen, activeCategory, setActiveCategory, navigateToSearch } = useAppStore()
  const { categories, loading } = useCategories()

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: sidebarOpen ? 0 : 320,
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed top-16 right-0 bottom-0 w-72 bg-white border-l border-stone-200 z-50 lg:static lg:translate-x-0 lg:z-auto"
      >
        <div className="flex items-center justify-between p-4 lg:hidden">
          <h3 className="font-semibold text-stone-800">التصنيفات</h3>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-lg hover:bg-stone-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <ScrollArea className="h-[calc(100vh-4rem)] lg:h-auto">
          <div className="p-4 space-y-1.5">
            <button
              onClick={() => { setActiveCategory(null); navigateToSearch('') }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm',
                !activeCategory
                  ? 'bg-emerald-50 text-emerald-700 font-medium'
                  : 'text-stone-600 hover:bg-stone-50'
              )}
            >
              <div className="w-8 h-8 rounded-lg gradient-emerald-teal flex items-center justify-center">
                <Film className="h-4 w-4 text-white" />
              </div>
              <span>الكل</span>
            </button>

            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                  <div className="w-8 h-8 rounded-lg bg-stone-100 animate-pulse" />
                  <div className="h-4 w-24 bg-stone-100 rounded animate-pulse" />
                </div>
              ))
            ) : (
              categories.map((category, index) => {
                const slug = category.slug || 'default'
                const Icon = categoryIcons[slug] || categoryIcons.default
                const colorClass = categoryColors[index % categoryColors.length]

                return (
                  <button
                    key={category.id}
                    onClick={() => {
                      setActiveCategory(activeCategory === category.id ? null : category.id)
                      navigateToSearch(category.name)
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm',
                      activeCategory === category.id
                        ? 'bg-emerald-50 text-emerald-700 font-medium'
                        : 'text-stone-600 hover:bg-stone-50'
                    )}
                  >
                    <div className={cn('w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center', colorClass)}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <span className="flex-1 text-right">{category.name}</span>
                    <span className="text-xs text-muted-foreground bg-stone-100 px-2 py-0.5 rounded-full">
                      {category._count.videos}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </ScrollArea>
      </motion.aside>
    </>
  )
}
