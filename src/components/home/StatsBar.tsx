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
    { icon: Video, label: 'إجمالي الفيديوهات', value: stats.totalVideos, gradient: 'bg-[oklch(0.627_0.265_303.9_/_0.1)]', iconColor: 'text-[oklch(0.827_0.165_303.9)]' },
    { icon: Users, label: 'المستخدمون', value: stats.totalUsers, gradient: 'bg-[oklch(0.645_0.246_16.4_/_0.1)]', iconColor: 'text-[oklch(0.745_0.166_16.4)]' },
    { icon: Eye, label: 'المشاهدات', value: stats.totalViews, gradient: 'bg-[oklch(0.656_0.241_354.3_/_0.1)]', iconColor: 'text-[oklch(0.756_0.161_354.3)]' },
    { icon: BookOpen, label: 'الكورسات', value: stats.totalCourses, gradient: 'bg-[oklch(0.715_0.183_192.5_/_0.1)]', iconColor: 'text-[oklch(0.815_0.183_192.5)]' },
    { icon: TrendingUp, label: 'الفيديوهات المجانية', value: stats.freeVideos, gradient: 'bg-[oklch(0.696_0.17_162.48_/_0.1)]', iconColor: 'text-[oklch(0.796_0.13_162.48)]' },
  ]

  return (
    <section className="py-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {items.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.08 }}
            className="glass-card rounded-2xl p-5 group hover:border-[oklch(0.627_0.265_303.9_/_0.3)] transition-all duration-300"
          >
            <div className={`w-11 h-11 rounded-xl ${item.gradient} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
              <item.icon className={`h-5 w-5 ${item.iconColor}`} />
            </div>
            <div className="text-2xl font-bold text-white">
              {item.value.toLocaleString('ar-EG')}
            </div>
            <div className="text-xs text-[oklch(0.55_0.04_280)] mt-1">{item.label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
