'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Play, X } from 'lucide-react'
import { useAppStore } from '@/store/app-store'

interface Banner {
  id: string
  title: string
  subtitle: string | null
  description: string | null
  imageUrl: string | null
  videoUrl: string | null
  linkUrl: string | null
  buttonText: string | null
  isActive: boolean
  order: number
}

interface AdBannerSliderProps {
  banners: Banner[]
}

export default function AdBannerSlider({ banners }: AdBannerSliderProps) {
  const [current, setCurrent] = useState(0)
  const [dismissed, setDismissed] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const navigateToSearch = useAppStore((s) => s.navigateToSearch)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const activeBanners = banners.filter((b) => b.isActive)

  // Auto-advance
  useEffect(() => {
    if (isPaused || activeBanners.length <= 1 || dismissed) return
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % activeBanners.length)
    }, 7000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isPaused, activeBanners.length, dismissed])

  // Reset current when banners count changes
  useEffect(() => {
    let cancelled = false
    if (current >= activeBanners.length) {
      // Defer to avoid synchronous setState in effect
      const t = setTimeout(() => {
        if (!cancelled) setCurrent(0)
      }, 0)
      return () => clearTimeout(t)
    }
    return () => {
      cancelled = true
    }
  }, [activeBanners.length, current])

  if (dismissed || activeBanners.length === 0) return null

  const banner = activeBanners[current]
  if (!banner) return null

  const handlePrev = () => {
    setCurrent((prev) => (prev - 1 + activeBanners.length) % activeBanners.length)
  }
  const handleNext = () => {
    setCurrent((prev) => (prev + 1) % activeBanners.length)
  }

  const handleBannerClick = () => {
    if (banner.linkUrl) {
      if (banner.linkUrl.startsWith('http')) {
        window.open(banner.linkUrl, '_blank', 'noopener,noreferrer')
      } else {
        navigateToSearch(banner.linkUrl)
      }
    }
  }

  const isInteractive = Boolean(banner.linkUrl || banner.buttonText)

  return (
    <section
      className="relative w-full"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label="الإعلانات"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-3xl overflow-hidden glass-card border border-[oklch(0.25_0.04_280)] shadow-2xl shadow-[oklch(0.627_0.265_303.9_/_0.12)]"
        >
          {/* Progress bar */}
          {activeBanners.length > 1 && (
            <div className="absolute top-0 left-0 right-0 z-30 h-1 bg-[oklch(0.18_0.03_280)]">
              <motion.div
                key={`${current}-${isPaused}`}
                initial={{ width: '0%' }}
                animate={{ width: isPaused ? '0%' : '100%' }}
                transition={{
                  duration: isPaused ? 0 : 7,
                  ease: 'linear',
                }}
                className="h-full gradient-aurora"
              />
            </div>
          )}

          {/* Close button */}
          <button
            onClick={() => setDismissed(true)}
            aria-label="إغلاق الإعلان"
            className="absolute top-4 left-4 z-30 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md text-white/80 hover:text-white hover:bg-black/60 flex items-center justify-center transition-all duration-300"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Slides */}
          <AnimatePresence mode="wait">
            <motion.div
              key={banner.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="relative grid grid-cols-1 md:grid-cols-2 min-h-[280px] sm:min-h-[340px] lg:min-h-[420px]"
            >
              {/* LEFT half - Image */}
              <div className="relative overflow-hidden bg-[oklch(0.10_0.025_280)] order-2 md:order-1">
                <BannerImage url={banner.imageUrl} title={banner.title} />

                {/* Gradient overlay towards content */}
                <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-[oklch(0.08_0.02_280_/_0.7)]" />

                {/* Content overlay */}
                <div className="absolute inset-0 flex flex-col justify-center p-6 sm:p-8 lg:p-12 text-right">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="max-w-md ml-auto"
                  >
                    {banner.subtitle && (
                      <span className="inline-block text-xs font-semibold tracking-wide uppercase mb-3 px-3 py-1 rounded-full bg-[oklch(0.627_0.265_303.9_/_0.15)] text-[oklch(0.827_0.165_303.9)] border border-[oklch(0.627_0.265_303.9_/_0.25)]">
                        {banner.subtitle}
                      </span>
                    )}
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-3 drop-shadow-lg">
                      {banner.title}
                    </h2>
                    {banner.description && (
                      <p className="text-sm sm:text-base text-[oklch(0.78_0.03_280)] mb-5 leading-relaxed line-clamp-3">
                        {banner.description}
                      </p>
                    )}
                    {(banner.buttonText || isInteractive) && (
                      <button
                        onClick={handleBannerClick}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl btn-aurora font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <span>{banner.buttonText || 'اكتشف المزيد'}</span>
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                    )}
                  </motion.div>
                </div>
              </div>

              {/* RIGHT half - Video */}
              <div className="relative overflow-hidden bg-black order-1 md:order-2 min-h-[180px] md:min-h-0">
                <BannerVideo url={banner.videoUrl} imageUrl={banner.imageUrl} title={banner.title} />

                {/* Subtle vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation arrows */}
          {activeBanners.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                aria-label="السابق"
                className="absolute top-1/2 right-3 -translate-y-1/2 z-30 w-10 h-10 rounded-full glass-aurora border border-[oklch(0.25_0.04_280)] text-white hover:bg-[oklch(0.627_0.265_303.9_/_0.2)] flex items-center justify-center transition-all duration-300 hover:scale-110"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <button
                onClick={handleNext}
                aria-label="التالي"
                className="absolute top-1/2 left-3 -translate-y-1/2 z-30 w-10 h-10 rounded-full glass-aurora border border-[oklch(0.25_0.04_280)] text-white hover:bg-[oklch(0.627_0.265_303.9_/_0.2)] flex items-center justify-center transition-all duration-300 hover:scale-110"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              {/* Dots indicator */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
                {activeBanners.map((b, i) => (
                  <button
                    key={b.id}
                    onClick={() => setCurrent(i)}
                    aria-label={`الانتقال للإعلان ${i + 1}`}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === current
                        ? 'w-8 gradient-aurora'
                        : 'w-2 bg-white/30 hover:bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Ad label */}
          <div className="absolute top-4 right-4 z-30 px-2.5 py-1 rounded-md bg-black/40 backdrop-blur-md text-[10px] font-medium text-white/70 tracking-wide">
            إعلان
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function BannerImage({ url, title }: { url: string | null; title: string }) {
  if (!url) {
    // Gradient fallback with pattern
    return (
      <div className="absolute inset-0 gradient-aurora opacity-90">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>
    )
  }
  return (
    <img
      src={url}
      alt={title}
      className="absolute inset-0 w-full h-full object-cover"
      loading="eager"
    />
  )
}

function BannerVideo({
  url,
  imageUrl,
  title,
}: {
  url: string | null
  imageUrl: string | null
  title: string
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    const v = videoRef.current
    if (!v || !url) return
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    v.addEventListener('play', onPlay)
    v.addEventListener('pause', onPause)
    // Try to autoplay
    v.play().catch(() => {
      // Autoplay blocked - will show poster
    })
    return () => {
      v.removeEventListener('play', onPlay)
      v.removeEventListener('pause', onPause)
    }
  }, [url])

  if (!url) {
    // Fallback to image or gradient
    if (imageUrl) {
      return (
        <img
          src={imageUrl}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
        />
      )
    }
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.627_0.265_303.9_/_0.4)] via-[oklch(0.715_0.183_192.5_/_0.3)] to-[oklch(0.645_0.246_16.4_/_0.3)]">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
            <Play className="h-6 w-6 text-white fill-white ml-1" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0">
      <video
        ref={videoRef}
        src={url}
        poster={imageUrl || undefined}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className="absolute inset-0 w-full h-full object-cover"
        aria-label={title}
      />
      {/* Play indicator when paused (autoplay blocked) */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
            <Play className="h-5 w-5 text-white fill-white ml-0.5" />
          </div>
        </div>
      )}
    </div>
  )
}
