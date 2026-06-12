'use client'

import { LayoutGrid, List } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ViewToggleProps {
  view: 'grid' | 'list'
  onViewChange: (view: 'grid' | 'list') => void
}

export default function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1 bg-stone-100 rounded-xl p-1">
      <button
        onClick={() => onViewChange('grid')}
        className={cn(
          'p-1.5 rounded-lg transition-all duration-200',
          view === 'grid'
            ? 'bg-white shadow-sm text-emerald-600'
            : 'text-muted-foreground hover:text-stone-600'
        )}
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
      <button
        onClick={() => onViewChange('list')}
        className={cn(
          'p-1.5 rounded-lg transition-all duration-200',
          view === 'list'
            ? 'bg-white shadow-sm text-emerald-600'
            : 'text-muted-foreground hover:text-stone-600'
        )}
      >
        <List className="h-4 w-4" />
      </button>
    </div>
  )
}
