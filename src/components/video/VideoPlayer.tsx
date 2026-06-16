'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Lock, LogIn } from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { useAppStore } from '@/store/app-store'

interface VideoPlayerProps {
  embedUrl?: string | null
  title?: string
  thumbnail?: string | null
}

export default function VideoPlayer({ embedUrl, title, thumbnail }: VideoPlayerProps) {
  const [hasError, setHasError] = useState(false)
  const user = useAuthStore((s) => s.user)
  const setView = useAppStore((s) => s.setView)

  // Not logged in → show login gate
  if (!user) {
    return (
      <div className="relative aspect-video bg-[oklch(0.08_0.02_280)] rounded-2xl overflow-hidden">
        {thumbnail && (
          <img
            src={thumbnail}
            alt={title || 'Video'}
            className="absolute inset-0 w-full h-full object-cover opacity-40"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/70 to-black/80" />
        <div className="relative h-full flex flex-col items-center justify-center text-center px-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="w-20 h-20 rounded-full bg-[oklch(0.627_0.265_303.9_/_0.2)] backdrop-blur-sm flex items-center justify-center mx-auto mb-5 neon-violet border border-[oklch(0.627_0.265_303.9_/_0.3)]"
          >
            <Lock className="h-9 w-9 text-[oklch(0.827_0.165_303.9)]" />
          </motion.div>
          <h3 className="text-white text-lg font-bold mb-2">
            يجب تسجيل الدخول للمشاهدة
          </h3>
          <p className="text-[oklch(0.55_0.04_280)] text-sm mb-5 max-w-xs">
            سجّل دخولك أو أنشئ حساباً مجانياً لمشاهدة هذا الفيديو
          </p>
          <button
            onClick={() => setView('login')}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl btn-aurora text-white font-medium hover:scale-105 transition-transform"
          >
            <LogIn className="h-4 w-4" />
            <span>تسجيل الدخول</span>
          </button>
        </div>
      </div>
    )
  }

  if (!embedUrl || hasError) {
    return (
      <div className="relative aspect-video bg-[oklch(0.08_0.02_280)] rounded-2xl overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.627_0.265_303.9_/_0.15)] to-[oklch(0.715_0.183_192.5_/_0.1)]" />
        <div className="relative text-center">
          <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 neon-violet">
            <Play className="h-8 w-8 text-white/70 fill-white/70" />
          </div>
          <p className="text-[oklch(0.55_0.04_280)] text-sm">
            {hasError ? 'تعذر تحميل الفيديو' : 'لم يتوفر رابط التشغيل بعد'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative aspect-video bg-[oklch(0.08_0.02_280)] rounded-2xl overflow-hidden neon-violet"
    >
      <iframe
        src={embedUrl}
        title={title || 'Video player'}
        className="absolute inset-0 w-full h-full"
        allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        onError={() => setHasError(true)}
      />
    </motion.div>
  )
}
