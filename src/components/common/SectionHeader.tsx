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
      className="flex items-center justify-between mb-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-stone-800">{title}</h2>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
      {onSeeAll && (
        <button
          onClick={onSeeAll}
          className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium text-sm transition-colors group"
        >
          <span>{seeAllText}</span>
          <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform rtl-flip" />
        </button>
      )}
    </motion.div>
  )
}
