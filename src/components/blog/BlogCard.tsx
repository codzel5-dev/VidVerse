'use client'

import { motion } from 'framer-motion'
import { Newspaper, Clock, Eye } from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { formatBlogDate } from '@/lib/blog-utils'
import type { BlogPostSummary } from './types'

// Aurora gradient fallback patterns for posts without a cover image.
// Reused across all three variants to keep the visual language consistent.
const coverPatterns = [
  'from-[oklch(0.627_0.265_303.9)] via-[oklch(0.715_0.183_192.5)] to-[oklch(0.696_0.17_162.48)]',
  'from-[oklch(0.645_0.246_16.4)] via-[oklch(0.755_0.183_68.5)] to-[oklch(0.627_0.265_303.9)]',
  'from-[oklch(0.656_0.241_354.3)] via-[oklch(0.627_0.265_303.9)] to-[oklch(0.623_0.214_259.8)]',
  'from-[oklch(0.715_0.183_192.5)] via-[oklch(0.696_0.17_162.48)] to-[oklch(0.627_0.265_303.9)]',
  'from-[oklch(0.696_0.17_162.48)] via-[oklch(0.715_0.183_192.5)] to-[oklch(0.645_0.246_16.4)]',
  'from-[oklch(0.623_0.214_259.8)] via-[oklch(0.627_0.265_303.9)] to-[oklch(0.656_0.241_354.3)]',
]

interface BlogCardProps {
  post: BlogPostSummary
  variant?: 'default' | 'featured' | 'compact'
  index?: number
}

/** Compact Arabic-friendly number formatting (e.g. 1.2ك, 3.4م). */
function formatViews(views: number): string {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}م`
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}ك`
  return views.toString()
}

function CoverFallback({
  index,
  size = 'default',
}: {
  index: number
  size?: 'default' | 'featured' | 'compact'
}) {
  const pattern = coverPatterns[index % coverPatterns.length]
  const iconSize =
    size === 'featured' ? 'h-14 w-14' : size === 'compact' ? 'h-6 w-6' : 'h-10 w-10'
  return (
    <div
      className={`absolute inset-0 bg-gradient-to-br ${pattern} opacity-60 flex items-center justify-center`}
    >
      <Newspaper className={`${iconSize} text-white/40`} />
    </div>
  )
}

/** Small circular avatar with the author's initial — used on default + featured cards. */
function AuthorAvatar({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' }) {
  const dims = size === 'md' ? 'w-8 h-8 text-xs' : 'w-6 h-6 text-[10px]'
  return (
    <div
      className={`${dims} rounded-full bg-[oklch(0.627_0.265_303.9_/_0.2)] flex items-center justify-center font-semibold text-[oklch(0.827_0.165_303.9)] border border-[oklch(0.627_0.265_303.9_/_0.3)] shrink-0`}
      aria-hidden
    >
      {name.charAt(0)}
    </div>
  )
}

export default function BlogCard({ post, variant = 'default', index = 0 }: BlogCardProps) {
  const navigateToBlogPost = useAppStore((s) => s.navigateToBlogPost)
  const handleClick = () => navigateToBlogPost(post.slug)

  // --- Compact: small horizontal card for sidebars / related lists ---------
  if (variant === 'compact') {
    return (
      <motion.button
        type="button"
        onClick={handleClick}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.4) }}
        whileHover={{ scale: 1.02 }}
        className="group w-full text-right flex gap-3 p-3 glass-card rounded-2xl border border-[oklch(0.2_0.03_280)] hover:shadow-xl transition-shadow"
      >
        <div className="relative w-24 h-16 shrink-0 rounded-lg overflow-hidden bg-[oklch(0.18_0.03_280)]">
          {post.coverImage ? (
            <img
              src={post.coverImage}
              alt={post.title}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <CoverFallback index={index} size="compact" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-white line-clamp-2 group-hover:text-[oklch(0.827_0.165_303.9)] transition-colors">
            {post.title}
          </h4>
          <div className="flex items-center gap-2 mt-1 text-[10px] text-[oklch(0.55_0.04_280)]">
            <span>{formatBlogDate(post.createdAt)}</span>
            <span aria-hidden>·</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {post.readingTime} د
            </span>
          </div>
        </div>
      </motion.button>
    )
  }

  // --- Featured: large hero card ------------------------------------------
  if (variant === 'featured') {
    return (
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        whileHover={{ scale: 1.01 }}
        onClick={handleClick}
        className="group cursor-pointer glass-card rounded-2xl border border-[oklch(0.2_0.03_280)] overflow-hidden hover:shadow-xl transition-shadow"
      >
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-[oklch(0.18_0.03_280)]">
          {post.coverImage ? (
            <img
              src={post.coverImage}
              alt={post.title}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
          ) : (
            <CoverFallback index={index} size="featured" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          {post.featured && (
            <div className="absolute top-4 right-4 badge-aurora text-xs rounded-lg px-3 py-1 font-medium">
              مميّز
            </div>
          )}
        </div>
        <div className="p-6 md:p-8">
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {post.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag.id}
                  className="text-xs px-2 py-1 rounded-lg bg-[oklch(0.627_0.265_303.9_/_0.12)] text-[oklch(0.827_0.165_303.9)] border border-[oklch(0.627_0.265_303.9_/_0.2)]"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 line-clamp-2 group-hover:text-gradient-aurora transition-all">
            {post.title}
          </h2>
          {post.excerpt && (
            <p className="text-[oklch(0.7_0.04_280)] mb-4 line-clamp-3 leading-relaxed">
              {post.excerpt}
            </p>
          )}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <AuthorAvatar name={post.author.name} size="md" />
              <span className="text-sm text-[oklch(0.7_0.04_280)]">{post.author.name}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-[oklch(0.55_0.04_280)]">
              <span>{formatBlogDate(post.createdAt)}</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {post.readingTime} د
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {formatViews(post.views)}
              </span>
            </div>
          </div>
        </div>
      </motion.article>
    )
  }

  // --- Default: standard grid card ----------------------------------------
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.4) }}
      whileHover={{ scale: 1.02 }}
      onClick={handleClick}
      className="group cursor-pointer glass-card rounded-2xl border border-[oklch(0.2_0.03_280)] overflow-hidden hover:shadow-xl transition-shadow flex flex-col h-full"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-[oklch(0.18_0.03_280)]">
        {post.coverImage ? (
          <img
            src={post.coverImage}
            alt={post.title}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <CoverFallback index={index} />
        )}
        {post.featured && (
          <div className="absolute top-2 right-2 badge-aurora text-[10px] rounded-md px-2 py-0.5">
            مميّز
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {post.tags.slice(0, 2).map((tag) => (
              <span
                key={tag.id}
                className="text-[10px] px-2 py-0.5 rounded-md bg-[oklch(0.627_0.265_303.9_/_0.1)] text-[oklch(0.827_0.165_303.9)] border border-[oklch(0.627_0.265_303.9_/_0.2)]"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
        <h3 className="text-base font-semibold text-white mb-2 line-clamp-2 group-hover:text-[oklch(0.827_0.165_303.9)] transition-colors">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="text-sm text-[oklch(0.65_0.04_280)] mb-3 line-clamp-2 leading-relaxed flex-1">
            {post.excerpt}
          </p>
        )}
        <div className="flex items-center gap-2 pt-2 border-t border-[oklch(0.2_0.03_280)]">
          <AuthorAvatar name={post.author.name} size="sm" />
          <span className="text-xs text-[oklch(0.6_0.04_280)] truncate">{post.author.name}</span>
        </div>
        <div className="flex items-center gap-3 mt-2 text-[10px] text-[oklch(0.5_0.04_280)]">
          <span>{formatBlogDate(post.createdAt)}</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {post.readingTime} د
          </span>
        </div>
      </div>
    </motion.article>
  )
}
