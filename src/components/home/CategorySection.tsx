'use client'

import { motion } from 'framer-motion'
import {
  Film,
  Code,
  Palette,
  TrendingUp,
  Music,
  Camera,
  GraduationCap,
  Gamepad2,
} from 'lucide-react'
import { useAppStore } from '@/store/app-store'

const categoryIcons: Record<string, typeof Film> = {
  programming: Code,
  design: Palette,
  marketing: TrendingUp,
  music: Music,
  photography: Camera,
  gaming: Gamepad2,
  education: GraduationCap,
  film: Film,
  courses: GraduationCap,
  'artificial-intelligence': Code,
  business: TrendingUp,
  'free-videos': Film,
  tutorials: GraduationCap,
  default: Film,
}

const categoryGradients = [
  'from-[oklch(0.627_0.265_303.9)] to-[oklch(0.715_0.183_192.5)]',
  'from-[oklch(0.645_0.246_16.4)] to-[oklch(0.755_0.183_68.5)]',
  'from-[oklch(0.656_0.241_354.3)] to-[oklch(0.627_0.265_303.9)]',
  'from-[oklch(0.715_0.183_192.5)] to-[oklch(0.696_0.17_162.48)]',
  'from-[oklch(0.696_0.17_162.48)] to-[oklch(0.627_0.265_303.9)]',
  'from-[oklch(0.755_0.183_68.5)] to-[oklch(0.645_0.246_16.4)]',
  'from-[oklch(0.623_0.214_259.8)] to-[oklch(0.627_0.265_303.9)]',
  'from-[oklch(0.627_0.265_303.9)] to-[oklch(0.656_0.241_354.3)]',
]

interface CategorySectionProps {
  initialCategories?: any[]
}

export default function CategorySection({ initialCategories = [] }: CategorySectionProps) {
  const navigateToSearch = useAppStore((s) => s.navigateToSearch)
  const categories = initialCategories

  return (
    <section>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-8"
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-white">تصفح التصنيفات</h2>
        <p className="text-sm text-[oklch(0.55_0.04_280)] mt-1.5">اختر التصنيف الذي يهمك</p>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map((category, index) => {
          const slug = category.slug || 'default'
          const Icon = categoryIcons[slug] || categoryIcons.default
          const gradientClass = categoryGradients[index % categoryGradients.length]

          return (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.98 }}
            >
              <div
                onClick={() => navigateToSearch(category.name)}
                className="cursor-pointer overflow-hidden glass-card rounded-2xl group hover:border-[oklch(0.627_0.265_303.9_/_0.3)] transition-all duration-300"
              >
                <div className={`relative h-28 flex flex-col items-center justify-center bg-gradient-to-br ${gradientClass} opacity-80 group-hover:opacity-100 transition-opacity duration-300 p-4`}>
                  {/* Grid overlay */}
                  <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                    backgroundSize: '15px 15px'
                  }} />
                  <Icon className="h-8 w-8 text-white/90 mb-2 relative z-10" />
                  <h3 className="text-white font-semibold text-sm relative z-10">{category.name}</h3>
                  <span className="text-white/70 text-xs mt-1 relative z-10">
                    {category._count.videos} فيديو
                  </span>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
