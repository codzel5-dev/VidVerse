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
import { Card } from '@/components/ui/card'
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

const categoryColors = [
  'from-emerald-400 to-teal-500',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-pink-500',
  'from-violet-400 to-purple-500',
  'from-cyan-400 to-sky-500',
  'from-lime-400 to-green-500',
  'from-fuchsia-400 to-pink-500',
  'from-indigo-400 to-violet-500',
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
        className="mb-6"
      >
        <h2 className="text-2xl font-bold text-stone-800">تصفح التصنيفات</h2>
        <p className="text-sm text-muted-foreground mt-1">اختر التصنيف الذي يهمك</p>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map((category, index) => {
          const slug = category.slug || 'default'
          const Icon = categoryIcons[slug] || categoryIcons.default
          const colorClass = categoryColors[index % categoryColors.length]

          return (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                onClick={() => navigateToSearch(category.name)}
                className="cursor-pointer border-0 shadow-sm overflow-hidden bg-white card-hover rounded-2xl"
              >
                <div className={`relative h-28 flex flex-col items-center justify-center bg-gradient-to-br ${colorClass} p-4`}>
                  <Icon className="h-8 w-8 text-white/90 mb-2" />
                  <h3 className="text-white font-semibold text-sm">{category.name}</h3>
                  <span className="text-white/70 text-xs mt-1">
                    {category._count.videos} فيديو
                  </span>
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
