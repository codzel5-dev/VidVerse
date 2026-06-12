'use client'

import { motion } from 'framer-motion'
import { Video, Users, Eye, BookOpen, TrendingUp } from 'lucide-react'

interface StatsBarProps {
  stats?: {
    totalVideos: number
    totalUsers: number
    totalViews: number
    totalCourses: number
    freeVideos: number
    [key: string]: unknown
  }
}

export default function StatsBar({ stats }: StatsBarProps) {
  if (!stats) return null

  const items = [
    { icon: Video, label: 'إجمالي الفيديوهات', value: stats.totalVideos, color: 'text-emerald-600 bg-emerald-50' },
    { icon: Users, label: 'المستخدمون', value: stats.totalUsers, color: 'text-amber-600 bg-amber-50' },
    { icon: Eye, label: 'المشاهدات', value: stats.totalViews, color: 'text-rose-600 bg-rose-50' },
    { icon: BookOpen, label: 'الكورسات', value: stats.totalCourses, color: 'text-violet-600 bg-violet-50' },
    { icon: TrendingUp, label: 'الفيديوهات المجانية', value: stats.freeVideos, color: 'text-teal-600 bg-teal-50' },
  ]

  return (
    <section className="py-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {items.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.08 }}
            className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100"
          >
            <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center mb-3`}>
              <item.icon className="h-5 w-5" />
            </div>
            <div className="text-2xl font-bold text-stone-800">
              {item.value.toLocaleString('ar-EG')}
            </div>
            <div className="text-xs text-muted-foreground mt-1">{item.label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
