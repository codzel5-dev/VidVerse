'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import {
  ArrowRight,
  Calendar,
  Clock,
  Eye,
  User as UserIcon,
  Newspaper,
  Loader2,
  Home as HomeIcon,
  Hash,
} from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { formatBlogDate } from '@/lib/blog-utils'
import { toast } from 'sonner'
import BlogAdsProvider from '@/components/ads/BlogAdsProvider'
import type { BlogPostFull, BlogRelatedPost } from './types'

// --- Block parsing --------------------------------------------------------

interface BlogBlock {
  /** Heading level (1–6) or null for the lead block before any heading. */
  headingLevel: number | null
  headingText: string | null
  /** Markdown body of the block (everything between this heading and the next). */
  content: string
}

const HEADING_RE = /^(#{1,6})\s+(.+)$/

/**
 * Split a markdown document into "blocks" delimited by headings.
 * The first block (lead text before the first heading) has `headingLevel: null`.
 * Each subsequent block carries its heading level + text plus the body that
 * follows it, so we can render each as a standalone story card.
 */
function parseBlocks(markdown: string): BlogBlock[] {
  if (!markdown) return []
  const lines = markdown.split('\n')
  const blocks: BlogBlock[] = []
  let current: BlogBlock = { headingLevel: null, headingText: null, content: '' }

  for (const line of lines) {
    const m = line.match(HEADING_RE)
    if (m) {
      if (current.content.trim() || current.headingText) {
        blocks.push(current)
      }
      current = {
        headingLevel: m[1].length,
        headingText: m[2].trim(),
        content: '',
      }
    } else {
      current.content += line + '\n'
    }
  }
  if (current.content.trim() || current.headingText) {
    blocks.push(current)
  }
  return blocks
}

// Rotating accent colors for section heading markers (cyan → warm → violet).
const HEADING_COLORS = [
  'oklch(0.715 0.183 192.5)', // cyan
  'oklch(0.755 0.183 68.5)', // amber
  'oklch(0.627 0.265 303.9)', // violet
]

// Cover-image fallback gradients for related-post cards without a thumbnail.
const coverFallbackPatterns = [
  'from-[oklch(0.627_0.265_303.9)] via-[oklch(0.715_0.183_192.5)] to-[oklch(0.696_0.17_162.48)]',
  'from-[oklch(0.645_0.246_16.4)] via-[oklch(0.755_0.183_68.5)] to-[oklch(0.627_0.265_303.9)]',
  'from-[oklch(0.656_0.241_354.3)] via-[oklch(0.627_0.265_303.9)] to-[oklch(0.623_0.214_259.8)]',
  'from-[oklch(0.715_0.183_192.5)] via-[oklch(0.696_0.17_162.48)] to-[oklch(0.627_0.265_303.9)]',
]

function formatViews(views: number): string {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}م`
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}ك`
  return views.toString()
}

// --- Markdown component overrides ----------------------------------------

const markdownComponents: Components = {
  img: ({ src, alt, ...props }) => (
    <figure className="my-6">
      <div className="relative rounded-2xl overflow-hidden border border-[oklch(0.25_0.04_280)] bg-[oklch(0.13_0.028_280)]">
        <img
          src={typeof src === 'string' ? src : ''}
          alt={alt ?? ''}
          loading="lazy"
          className="w-full h-auto object-cover max-h-[520px]"
          {...props}
        />
      </div>
      {alt ? (
        <figcaption className="mt-2 text-xs text-center text-[oklch(0.55_0.04_280)] italic">
          {alt}
        </figcaption>
      ) : null}
    </figure>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-6 relative pr-5 pl-4 py-4 rounded-2xl bg-gradient-to-br from-[oklch(0.627_0.265_303.9_/_0.08)] to-[oklch(0.715_0.183_192.5_/_0.06)] border-r-4 border-[oklch(0.715_0.183_192.5)]">
      <div className="text-lg md:text-xl text-white leading-relaxed font-medium italic">
        {children}
      </div>
    </blockquote>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target={href?.startsWith('http') ? '_blank' : undefined}
      rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
      className="text-[oklch(0.827_0.165_303.9)] underline decoration-[oklch(0.627_0.265_303.9_/_0.4)] hover:decoration-[oklch(0.627_0.265_303.9)] transition-colors"
    >
      {children}
    </a>
  ),
  pre: ({ children }) => (
    <pre
      dir="ltr"
      className="my-4 p-4 rounded-2xl bg-[oklch(0.08_0.02_280)] border border-[oklch(0.25_0.04_280)] overflow-x-auto text-sm text-[oklch(0.85_0.04_280)]"
    >
      {children}
    </pre>
  ),
  code: ({ className, children, ...props }) => {
    const isBlock = !!className && /language-/.test(className)
    if (isBlock) {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      )
    }
    return (
      <code
        dir="ltr"
        className="px-1.5 py-0.5 rounded-md bg-[oklch(0.18_0.03_280)] text-[oklch(0.815_0.183_192.5)] text-[0.85em] font-mono"
        {...props}
      >
        {children}
      </code>
    )
  },
  ul: ({ children }) => (
    <ul className="my-3 space-y-1.5 pr-6 list-disc marker:text-[oklch(0.715_0.183_192.5)]">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-3 space-y-1.5 pr-6 list-decimal marker:text-[oklch(0.715_0.183_192.5)]">
      {children}
    </ol>
  ),
  p: ({ children }) => (
    <p className="my-3 leading-relaxed text-[oklch(0.82_0.03_280)]">{children}</p>
  ),
  h1: ({ children }) => (
    <h1 className="text-2xl font-bold text-white mt-6 mb-3">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-xl font-bold text-white mt-6 mb-3">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-lg font-bold text-white mt-5 mb-2">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-base font-bold text-white mt-4 mb-2">{children}</h4>
  ),
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-2xl border border-[oklch(0.25_0.04_280)]">
      <table className="w-full text-sm text-right">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="p-3 bg-[oklch(0.18_0.03_280)] text-white font-semibold border-b border-[oklch(0.25_0.04_280)]">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="p-3 text-[oklch(0.75_0.04_280)] border-b border-[oklch(0.2_0.03_280)]">
      {children}
    </td>
  ),
}

// --- Main component -------------------------------------------------------

interface BlogPostResponse {
  post: BlogPostFull
  related: BlogRelatedPost[]
}

export default function BlogPostView() {
  const slug = useAppStore((s) => s.selectedBlogSlug)
  const navigateToBlog = useAppStore((s) => s.navigateToBlog)
  const navigateToBlogPost = useAppStore((s) => s.navigateToBlogPost)
  const goHome = useAppStore((s) => s.goHome)
  const setBlogTagFilter = useAppStore((s) => s.setBlogTagFilter)

  const [post, setPost] = useState<BlogPostFull | null>(null)
  const [related, setRelated] = useState<BlogRelatedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // No slug → bounce back to the blog listing.
  useEffect(() => {
    if (!slug) {
      navigateToBlog()
    }
  }, [slug, navigateToBlog])

  // Fetch the post + related whenever the slug changes.
  useEffect(() => {
    if (!slug) return
    let cancelled = false
    const doFetch = async () => {
      setLoading(true)
      setError(null)
      try {
        const r = await fetch(`/api/blog/${encodeURIComponent(slug)}`)
        if (r.status === 404) throw new Error('not-found')
        if (!r.ok) throw new Error('bad')
        const data = (await r.json()) as BlogPostResponse
        if (cancelled) return
        setPost(data.post)
        setRelated(data.related || [])
      } catch (e: unknown) {
        if (cancelled) return
        if (e instanceof Error && e.message === 'not-found') {
          setError('المقال غير موجود أو لم يُنشر بعد.')
        } else {
          setError('حدث خطأ أثناء جلب المقال.')
          toast.error('تعذّر تحميل المقال')
        }
      } finally {
        if (cancelled) return
        setLoading(false)
      }
    }
    doFetch()
    return () => {
      cancelled = true
    }
  }, [slug])

  // Scroll back to top whenever the slug changes (e.g. clicking a related post).
  useEffect(() => {
    if (slug) window.scrollTo(0, 0)
  }, [slug])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="h-10 w-10 animate-spin text-[oklch(0.627_0.265_303.9)]" />
        <p className="mt-3 text-sm text-[oklch(0.55_0.04_280)]">جاري تحميل المقال...</p>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-4">
        <div className="w-20 h-20 rounded-3xl bg-[oklch(0.645_0.246_16.4_/_0.1)] flex items-center justify-center mb-4">
          <Newspaper className="h-10 w-10 text-[oklch(0.645_0.246_16.4_/_0.6)]" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">تعذّر عرض المقال</h3>
        <p className="text-[oklch(0.55_0.04_280)] text-center max-w-sm mb-6">
          {error || 'المقال غير متاح حالياً.'}
        </p>
        <button
          onClick={navigateToBlog}
          className="btn-aurora inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl font-medium"
        >
          <ArrowRight className="h-4 w-4" />
          <span>العودة لكل المقالات</span>
        </button>
      </div>
    )
  }

  const blocks = parseBlocks(post.content)

  /** Clicking a tag navigates to the blog listing filtered by that tag. */
  const handleTagClick = (tagSlug: string) => {
    setBlogTagFilter(tagSlug)
    navigateToBlog()
    // navigateToBlog already pushed a clean URL (?b removed).
    // Replace the current entry to add ?tag= without creating a new history step.
    const url = new URL(window.location.href)
    url.searchParams.set('tag', tagSlug)
    window.history.replaceState({}, '', url.toString())
  }

  /** "All articles" / back button — clears any active tag filter too. */
  const handleViewAll = () => {
    setBlogTagFilter(null)
    navigateToBlog()
  }

  return (
    <div className="min-h-screen pb-16">
      {/* Inject Monetag / ad scripts — article page only.
          BlogAdsProvider cleans up on unmount so ads never leak to other views. */}
      <BlogAdsProvider />

      {/* Masthead */}
      <header className="border-b border-[oklch(0.2_0.03_280)] bg-[oklch(0.08_0.02_280_/_0.7)] backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <button
            onClick={handleViewAll}
            className="flex items-center gap-2 group"
            aria-label="الذهاب للمدونة"
          >
            <div className="w-9 h-9 rounded-xl btn-aurora flex items-center justify-center">
              <Newspaper className="h-5 w-5 text-white" />
            </div>
            <span
              className="text-lg font-bold text-white group-hover:text-gradient-aurora transition-all"
              style={{ fontFamily: 'Mirza, ui-serif, Georgia, "Times New Roman", serif' }}
            >
              مَدوَّنَة فيدفرس
            </span>
          </button>
          <nav className="flex items-center gap-1">
            <button
              onClick={handleViewAll}
              className="text-sm text-[oklch(0.7_0.04_280)] hover:text-white hover:bg-[oklch(0.18_0.03_280)] px-3 py-1.5 rounded-lg transition-colors"
            >
              كل المقالات
            </button>
            <button
              onClick={goHome}
              className="text-sm text-[oklch(0.7_0.04_280)] hover:text-white hover:bg-[oklch(0.18_0.03_280)] px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5"
            >
              <HomeIcon className="h-3.5 w-3.5" />
              الرئيسية
            </button>
          </nav>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 md:pt-12">
        {/* Title card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => handleTagClick(tag.slug)}
                  className="badge-aurora text-xs rounded-lg px-2.5 py-1 hover:scale-105 transition-transform"
                >
                  {tag.name}
                </button>
              ))}
            </div>
          )}
          <h1
            className="text-3xl md:text-5xl font-bold text-white leading-tight mb-4"
            style={{ fontFamily: 'Mirza, ui-serif, Georgia, "Times New Roman", serif' }}
          >
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="text-base md:text-lg text-[oklch(0.65_0.04_280)] leading-relaxed mb-5">
              {post.excerpt}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[oklch(0.55_0.04_280)]">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formatBlogDate(post.createdAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <UserIcon className="h-4 w-4" />
              {post.author.name}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {post.readingTime} دقائق قراءة
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="h-4 w-4" />
              {formatViews(post.views)} مشاهدة
            </span>
          </div>
        </motion.div>

        {/* Cover image */}
        {post.coverImage && (
          <motion.figure
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-10 relative rounded-3xl overflow-hidden border border-[oklch(0.25_0.04_280)]"
          >
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-auto max-h-[520px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
          </motion.figure>
        )}

        {/* Article body — each heading starts a new "story card" */}
        <div className="space-y-5">
          {blocks.map((block, i) => {
            const color = HEADING_COLORS[i % HEADING_COLORS.length]
            return (
              <motion.section
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.3) }}
                className="bg-[oklch(0.13_0.028_280)] border border-[oklch(0.2_0.03_280)] rounded-2xl p-6 md:p-8"
              >
                {block.headingText && (
                  <div className="flex items-start gap-3 mb-4">
                    <span
                      className="shrink-0 mt-1.5 w-3 h-3 rounded-sm rotate-45"
                      style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}` }}
                      aria-hidden
                    />
                    <h2
                      className="text-xl md:text-2xl font-bold leading-snug"
                      style={{ color }}
                    >
                      {block.headingText}
                    </h2>
                  </div>
                )}
                <div className="text-[oklch(0.82_0.03_280)]">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw, rehypeSanitize]}
                    components={markdownComponents}
                  >
                    {block.content}
                  </ReactMarkdown>
                </div>
              </motion.section>
            )
          })}
        </div>

        {/* Tags card */}
        {post.tags.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="mt-8 p-6 rounded-2xl bg-[oklch(0.13_0.028_280)] border border-[oklch(0.2_0.03_280)]"
          >
            <div className="flex items-center gap-2 mb-3 text-sm text-[oklch(0.65_0.04_280)]">
              <Hash className="h-4 w-4" />
              <span>التصنيفات</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => handleTagClick(tag.slug)}
                  className="badge-aurora text-xs rounded-lg px-3 py-1.5 hover:scale-105 transition-transform"
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Author card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mt-6 p-6 rounded-2xl bg-gradient-to-br from-[oklch(0.13_0.028_280)] to-[oklch(0.18_0.03_280)] border border-[oklch(0.2_0.03_280)] flex items-start gap-4"
        >
          <div className="shrink-0 w-14 h-14 rounded-full bg-gradient-to-br from-[oklch(0.627_0.265_303.9)] to-[oklch(0.715_0.183_192.5)] flex items-center justify-center text-lg font-bold text-white border-2 border-[oklch(0.25_0.04_280)]">
            {post.author.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-[oklch(0.55_0.04_280)] mb-0.5">بقلم</div>
            <div className="font-bold text-white mb-1">{post.author.name}</div>
            {post.author.bio && (
              <p className="text-sm text-[oklch(0.65_0.04_280)] leading-relaxed line-clamp-3">
                {post.author.bio}
              </p>
            )}
          </div>
        </motion.div>

        {/* Back button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleViewAll}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[oklch(0.13_0.028_280)] border border-[oklch(0.25_0.04_280)] text-[oklch(0.8_0.04_280)] hover:bg-[oklch(0.18_0.03_280)] hover:text-white transition-colors"
          >
            <ArrowRight className="h-4 w-4" />
            <span>العودة لكل المقالات</span>
          </button>
        </div>
      </article>

      {/* Related posts */}
      {related.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[oklch(0.627_0.265_303.9_/_0.3)]" />
              <h2 className="text-xl font-bold text-white">مقالات ذات صلة</h2>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[oklch(0.627_0.265_303.9_/_0.3)]" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {related.map((rp, i) => {
                const pattern = coverFallbackPatterns[i % coverFallbackPatterns.length]
                return (
                  <motion.button
                    key={rp.id}
                    type="button"
                    onClick={() => navigateToBlogPost(rp.slug)}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.3) }}
                    whileHover={{ scale: 1.02 }}
                    className="group text-right flex flex-col bg-[oklch(0.13_0.028_280)] border border-[oklch(0.2_0.03_280)] rounded-2xl overflow-hidden hover:shadow-xl transition-shadow"
                  >
                    <div className="relative aspect-video overflow-hidden bg-[oklch(0.18_0.03_280)]">
                      {rp.coverImage ? (
                        <img
                          src={rp.coverImage}
                          alt={rp.title}
                          loading="lazy"
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div
                          className={`absolute inset-0 bg-gradient-to-br ${pattern} opacity-50 flex items-center justify-center`}
                        >
                          <Newspaper className="h-8 w-8 text-white/40" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h4 className="text-sm font-semibold text-white line-clamp-2 mb-1.5 group-hover:text-[oklch(0.827_0.165_303.9)] transition-colors">
                        {rp.title}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] text-[oklch(0.55_0.04_280)]">
                        <span>{formatBlogDate(rp.createdAt)}</span>
                        <span aria-hidden>·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {rp.readingTime} د
                        </span>
                      </div>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        </section>
      )}

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-8 border-t border-[oklch(0.2_0.03_280)] text-center">
        <p className="text-xs text-[oklch(0.5_0.04_280)]">
          © {new Date().getFullYear()} فيدفرس — جميع الحقوق محفوظة. مَدوَّنَة فيدفرس.
        </p>
      </footer>
    </div>
  )
}
