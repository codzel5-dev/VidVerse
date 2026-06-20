'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Newspaper, Tag as TagIcon, Loader2, ArrowDown, LayoutGrid } from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { toast } from 'sonner'
import BlogCard from './BlogCard'
import type { BlogPostSummary, BlogTag } from './types'

const LIMIT = 9

interface BlogListResponse {
  posts: BlogPostSummary[]
  total: number
  tags: BlogTag[]
}

export default function BlogHome() {
  const blogTagFilter = useAppStore((s) => s.blogTagFilter)
  const setBlogTagFilter = useAppStore((s) => s.setBlogTagFilter)

  const [posts, setPosts] = useState<BlogPostSummary[]>([])
  const [total, setTotal] = useState(0)
  const [tags, setTags] = useState<BlogTag[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const didInitRef = useRef(false)

  // Sync ?tag from URL on mount — only run once.
  useEffect(() => {
    if (didInitRef.current) return
    didInitRef.current = true
    const params = new URLSearchParams(window.location.search)
    const urlTag = params.get('tag')
    if (urlTag && urlTag !== blogTagFilter) {
      setBlogTagFilter(urlTag)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Debounce the search input → searchQuery (400ms).
  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput.trim()), 400)
    return () => clearTimeout(t)
  }, [searchInput])

  // Fetch posts whenever the active tag filter or the debounced search query
  // changes. Resets pagination back to offset 0.
  useEffect(() => {
    let cancelled = false
    const doFetch = async () => {
      setLoading(true)
      setOffset(0)
      const params = new URLSearchParams({ limit: String(LIMIT), offset: '0' })
      if (blogTagFilter) params.set('tag', blogTagFilter)
      if (searchQuery) params.set('q', searchQuery)
      try {
        const r = await fetch(`/api/blog?${params.toString()}`)
        if (!r.ok) throw new Error('bad response')
        const data = (await r.json()) as BlogListResponse
        if (cancelled) return
        setPosts(data.posts || [])
        setTotal(data.total || 0)
        setTags(data.tags || [])
      } catch {
        if (cancelled) return
        toast.error('تعذّر جلب المقالات')
      } finally {
        if (cancelled) return
        setLoading(false)
      }
    }
    doFetch()
    return () => {
      cancelled = true
    }
  }, [blogTagFilter, searchQuery])

  const handleTagClick = (slug: string | null) => {
    setBlogTagFilter(slug)
    const url = new URL(window.location.href)
    if (slug) url.searchParams.set('tag', slug)
    else url.searchParams.delete('tag')
    window.history.pushState({}, '', url.toString())
  }

  const handleLoadMore = async () => {
    const nextOffset = offset + LIMIT
    setLoadingMore(true)
    try {
      const params = new URLSearchParams({
        limit: String(LIMIT),
        offset: String(nextOffset),
      })
      if (blogTagFilter) params.set('tag', blogTagFilter)
      if (searchQuery) params.set('q', searchQuery)
      const res = await fetch(`/api/blog?${params.toString()}`)
      if (!res.ok) throw new Error('bad response')
      const data = (await res.json()) as BlogListResponse
      setPosts((prev) => [...prev, ...(data.posts || [])])
      setTotal(data.total || 0)
      setOffset(nextOffset)
    } catch {
      toast.error('تعذّر تحميل المزيد')
    } finally {
      setLoadingMore(false)
    }
  }

  const handleClearFilters = () => {
    setSearchInput('')
    handleTagClick(null)
  }

  // The featured hero card is only shown when no tag/search filter is applied.
  const showFeatured = !blogTagFilter && !searchQuery
  const featuredPost = showFeatured ? posts.find((p) => p.featured) : undefined
  const gridPosts =
    showFeatured && featuredPost ? posts.filter((p) => p.id !== featuredPost.id) : posts

  return (
    <div className="min-h-screen">
      {/* Hero header */}
      <div className="relative overflow-hidden border-b border-[oklch(0.2_0.03_280)] aurora-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 badge-aurora text-xs rounded-lg px-3 py-1 mb-4">
              <Newspaper className="h-3.5 w-3.5" />
              <span>مدونة المنصة</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 leading-tight">
              <span className="text-gradient-aurora">آخر تحديثات</span> وأخبار المنصة
            </h1>
            <p className="text-[oklch(0.65_0.04_280)] text-base md:text-lg mb-6 leading-relaxed">
              مقالات ودروس ومحتوى حصري من فريق فيدفرس — تعرّف على كل جديد في عالم الفيديو
              والإبداع الرقمي.
            </p>

            {/* Search input (debounced) */}
            <div className="relative max-w-xl">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[oklch(0.5_0.04_280)] pointer-events-none" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="ابحث في المقالات..."
                aria-label="ابحث في المقالات"
                className="input-aurora w-full bg-[oklch(0.13_0.028_280_/_0.7)] border border-[oklch(0.25_0.04_280)] rounded-2xl py-3 pr-10 pl-4 text-white placeholder:text-[oklch(0.5_0.04_280)] focus:outline-none focus:border-[oklch(0.627_0.265_303.9_/_0.5)] focus:ring-2 focus:ring-[oklch(0.627_0.265_303.9_/_0.15)] transition-all"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Tag filter pills — sticky */}
      <div className="sticky top-0 z-20 bg-[oklch(0.08_0.02_280_/_0.9)] backdrop-blur-md border-b border-[oklch(0.2_0.03_280)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => handleTagClick(null)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all ${
                !blogTagFilter
                  ? 'btn-aurora text-white'
                  : 'bg-[oklch(0.13_0.028_280)] text-[oklch(0.7_0.04_280)] border border-[oklch(0.25_0.04_280)] hover:bg-[oklch(0.18_0.03_280)]'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              الكل
            </button>
            {tags.map((tag) => {
              const active = blogTagFilter === tag.slug
              return (
                <button
                  key={tag.id}
                  onClick={() => handleTagClick(active ? null : tag.slug)}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'btn-aurora text-white'
                      : 'bg-[oklch(0.13_0.028_280)] text-[oklch(0.7_0.04_280)] border border-[oklch(0.25_0.04_280)] hover:bg-[oklch(0.18_0.03_280)]'
                  }`}
                >
                  <TagIcon className="h-3.5 w-3.5" />
                  {tag.name}
                  {typeof tag.count === 'number' && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                        active ? 'bg-white/20' : 'bg-[oklch(0.25_0.04_280)]'
                      }`}
                    >
                      {tag.count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-[oklch(0.627_0.265_303.9)]" />
            <p className="mt-3 text-sm text-[oklch(0.55_0.04_280)]">جاري تحميل المقالات...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-3xl bg-[oklch(0.627_0.265_303.9_/_0.1)] flex items-center justify-center mb-4">
              <Newspaper className="h-10 w-10 text-[oklch(0.627_0.265_303.9_/_0.5)]" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {searchQuery ? 'لا توجد نتائج مطابقة' : 'لا توجد مقالات'}
            </h3>
            <p className="text-[oklch(0.55_0.04_280)] text-center max-w-sm mb-4">
              {searchQuery
                ? `لم نعثر على مقالات لـ "${searchQuery}". جرّب تعديل البحث أو تصفّح كل المقالات.`
                : blogTagFilter
                  ? 'لا توجد مقالات ضمن هذا التصنيف بعد.'
                  : 'لم تُنشر أي مقالات بعد.'}
            </p>
            {(blogTagFilter || searchQuery) && (
              <button
                onClick={handleClearFilters}
                className="btn-aurora px-6 py-2.5 rounded-2xl font-medium"
              >
                <span>عرض كل المقالات</span>
              </button>
            )}
          </div>
        ) : (
          <>
            {featuredPost && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-8"
              >
                <BlogCard post={featuredPost} variant="featured" index={0} />
              </motion.div>
            )}

            {gridPosts.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                  {gridPosts.map((post, i) => (
                    <BlogCard key={post.id} post={post} variant="default" index={i} />
                  ))}
                </div>

                {posts.length < total && (
                  <div className="flex justify-center mt-10">
                    <button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="btn-aurora inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>جاري التحميل...</span>
                        </>
                      ) : (
                        <>
                          <ArrowDown className="h-4 w-4" />
                          <span>تحميل المزيد</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
