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
      <div className="w-20 h-20 rounded-3xl bg-stone-100 flex items-center justify-center mb-4">
        <Icon className="h-10 w-10 text-stone-400" />
      </div>
      <h3 className="text-lg font-semibold text-stone-700 mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground text-center max-w-sm mb-4">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2.5 rounded-2xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  )
}
