'use client'

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  rating: number
  maxRating?: number
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
  onRate?: (rating: number) => void
  showValue?: boolean
}

export default function StarRating({
  rating,
  maxRating = 5,
  size = 'md',
  interactive = false,
  onRate,
  showValue = false,
}: StarRatingProps) {
  const sizeClasses = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxRating }, (_, i) => {
        const filled = i < Math.floor(rating)
        const halfFilled = !filled && i < rating

        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onRate?.(i + 1)}
            className={cn(
              'transition-colors',
              interactive && 'cursor-pointer hover:scale-110',
              !interactive && 'cursor-default'
            )}
          >
            <Star
              className={cn(
                sizeClasses[size],
                'transition-colors',
                filled && 'fill-[oklch(0.755_0.183_68.5)] text-[oklch(0.755_0.183_68.5)]',
                halfFilled && 'fill-[oklch(0.755_0.183_68.5_/_0.5)] text-[oklch(0.755_0.183_68.5)]',
                !filled && !halfFilled && 'fill-[oklch(0.25_0.04_280)] text-[oklch(0.25_0.04_280)]'
              )}
            />
          </button>
        )
      })}
      {showValue && (
        <span className="text-sm font-medium text-[oklch(0.55_0.04_280)] mr-1">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  )
}
