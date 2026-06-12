'use client'

import { motion } from 'framer-motion'
import { Film, Search } from 'lucide-react'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: 'film' | 'search'
  action?: {
    label: string
    onClick: () => void
  }
}

export default function EmptyState({ title, description, icon = 'film', action }: EmptyStateProps) {
  const Icon = icon === 'film' ? Film : Search

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      <div className="w-20 h-20 rounded-3xl bg-[oklch(0.627_0.265_303.9_/_0.1)] flex items-center justify-center mb-4">
        <Icon className="h-10 w-10 text-[oklch(0.627_0.265_303.9_/_0.5)]" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      {description && (
        <p className="text-[oklch(0.55_0.04_280)] text-center max-w-sm mb-4">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="btn-aurora px-6 py-2.5 rounded-2xl font-medium"
        >
          <span>{action.label}</span>
        </button>
      )}
    </motion.div>
  )
}
