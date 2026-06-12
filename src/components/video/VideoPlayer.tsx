'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Play } from 'lucide-react'

interface VideoPlayerProps {
  embedUrl?: string | null
  title?: string
}

export default function VideoPlayer({ embedUrl, title }: VideoPlayerProps) {
  const [hasError, setHasError] = useState(false)

  if (!embedUrl || hasError) {
    return (
      <div className="relative aspect-video bg-stone-900 rounded-2xl overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/30 to-teal-900/30" />
        <div className="relative text-center">
          <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
            <Play className="h-8 w-8 text-white/70 fill-white/70" />
          </div>
          <p className="text-white/60 text-sm">
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
      className="relative aspect-video bg-stone-900 rounded-2xl overflow-hidden"
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
