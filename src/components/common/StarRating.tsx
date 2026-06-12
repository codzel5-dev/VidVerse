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
                filled && 'fill-amber-400 text-amber-400',
                halfFilled && 'fill-amber-400/50 text-amber-400',
                !filled && !halfFilled && 'fill-stone-200 text-stone-200'
              )}
            />
          </button>
        )
      })}
      {showValue && (
        <span className="text-sm font-medium text-muted-foreground mr-1">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  )
}
