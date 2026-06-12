'use client'

import { ChevronLeft } from 'lucide-react'
import { motion } from 'framer-motion'

interface SectionHeaderProps {
  title: string
  subtitle?: string
  onSeeAll?: () => void
  seeAllText?: string
}

export default function SectionHeader({ title, subtitle, onSeeAll, seeAllText = 'عرض الكل' }: SectionHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="flex items-center justify-between mb-8"
    >
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white">{title}</h2>
        {subtitle && (
          <p className="text-sm text-[oklch(0.55_0.04_280)] mt-1.5">{subtitle}</p>
        )}
      </div>
      {onSeeAll && (
        <button
          onClick={onSeeAll}
          className="flex items-center gap-1.5 text-[oklch(0.827_0.165_303.9)] hover:text-[oklch(0.927_0.165_303.9)] font-medium text-sm transition-colors group"
        >
          <span>{seeAllText}</span>
          <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform rtl-flip" />
        </button>
      )}
    </motion.div>
  )
}
