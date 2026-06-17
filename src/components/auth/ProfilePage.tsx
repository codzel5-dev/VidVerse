'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Mail,
  Calendar,
  Video,
  BookOpen,
  Bookmark,
  Settings,
  LogOut,
  Edit,
  BookmarkX,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuthStore } from '@/store/auth-store'
import { useAppStore } from '@/store/app-store'
import { useVideos, type VideoData } from '@/hooks/useVideos'
import VideoCard from '@/components/video/VideoCard'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { toast } from 'sonner'

export default function ProfilePage() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const setView = useAppStore((s) => s.setView)
  const profileTab = useAppStore((s) => s.profileTab)
  const [profileData, setProfileData] = useState<{
    _count: { videos: number; enrollments: number; savedVideos: number }
  } | null>(null)

  useEffect(() => {
    if (user?.id) {
      fetch('/api/auth/me', { headers: { 'x-user-id': user.id } })
        .then((res) => res.json())
        .then((data) => setProfileData(data.user || null))
        .catch(() => {})
    }
  }, [user?.id])

  if (!isAuthenticated || !user) {
    return (
      <div className="text-center py-16">
        <p className="text-[oklch(0.55_0.04_280)] mb-4">يرجى تسجيل الدخول لعرض الملف الشخصي</p>
        <Button onClick={() => setView('login')} className="rounded-2xl btn-aurora border-0">
          <span>تسجيل الدخول</span>
        </Button>
      </div>
    )
  }

  const stats = profileData?._count || { videos: 0, enrollments: 0, savedVideos: 0 }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto"
    >
      {/* Profile Header */}
      <Card className="glass-card rounded-3xl overflow-hidden mb-6">
        <div className="h-32 gradient-aurora relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9zdmc+')] opacity-50" />
        </div>
        <div className="px-6 pb-6 -mt-12 relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
            <Avatar className="h-24 w-24 border-4 border-[oklch(0.13_0.028_280)] shadow-lg shadow-[oklch(0.627_0.265_303.9_/_0.2)]">
              <AvatarFallback className="bg-[oklch(0.627_0.265_303.9_/_0.15)] text-[oklch(0.827_0.165_303.9)] text-2xl font-bold">
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-right flex-1">
              <h1 className="text-2xl font-bold text-white">{user.name}</h1>
              <p className="text-sm text-[oklch(0.55_0.04_280)] flex items-center gap-1 justify-center sm:justify-start">
                <Mail className="h-3.5 w-3.5" />
                {user.email}
              </p>
              <div className="flex items-center gap-2 justify-center sm:justify-start mt-1">
                <Badge className="badge-aurora border-0 rounded-lg capitalize">
                  {user.role}
                </Badge>
                <span className="text-xs text-[oklch(0.55_0.04_280)] flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  انضم في {new Date(user.createdAt).toLocaleDateString('ar-EG')}
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-[oklch(0.25_0.04_280)] bg-transparent text-white hover:bg-[oklch(0.18_0.03_280)] hover:border-[oklch(0.627_0.265_303.9_/_0.3)]"
              onClick={() => toast.info('ميزة قادمة قريباً')}
            >
              <Edit className="h-4 w-4 ml-1" />
              تعديل
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { icon: Video, label: 'الفيديوهات', value: stats.videos, color: 'text-[oklch(0.796_0.13_162.48)] bg-[oklch(0.696_0.17_162.48_/_0.1)]' },
          { icon: BookOpen, label: 'الكورسات', value: stats.enrollments, color: 'text-[oklch(0.855_0.183_68.5)] bg-[oklch(0.755_0.183_68.5_/_0.1)]' },
          { icon: Bookmark, label: 'المحفوظات', value: stats.savedVideos, color: 'text-[oklch(0.827_0.165_303.9)] bg-[oklch(0.627_0.265_303.9_/_0.1)]' },
        ].map((stat) => (
          <Card key={stat.label} className="glass-card p-4 rounded-2xl text-center hover:border-[oklch(0.627_0.265_303.9_/_0.3)] transition-all duration-300">
            <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mx-auto mb-2`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-xs text-[oklch(0.55_0.04_280)]">{stat.label}</div>
          </Card>
        ))}
      </div>

      {/* Content tabs */}
      <Tabs value={profileTab} onValueChange={(v) => useAppStore.getState().setProfileTab(v as 'videos' | 'courses' | 'saved')} className="w-full">
        <TabsList className="w-full justify-start rounded-2xl bg-[oklch(0.13_0.028_280)] border border-[oklch(0.25_0.04_280)] p-1 h-auto">
          <TabsTrigger value="videos" className="rounded-xl data-[state=active]:bg-[oklch(0.627_0.265_303.9_/_0.15)] data-[state=active]:text-[oklch(0.827_0.165_303.9)]">
            <Video className="h-4 w-4 ml-1.5" />
            فيديوهاتي
          </TabsTrigger>
          <TabsTrigger value="courses" className="rounded-xl data-[state=active]:bg-[oklch(0.627_0.265_303.9_/_0.15)] data-[state=active]:text-[oklch(0.827_0.165_303.9)]">
            <BookOpen className="h-4 w-4 ml-1.5" />
            كورساتي
          </TabsTrigger>
          <TabsTrigger value="saved" className="rounded-xl data-[state=active]:bg-[oklch(0.627_0.265_303.9_/_0.15)] data-[state=active]:text-[oklch(0.827_0.165_303.9)]">
            <Bookmark className="h-4 w-4 ml-1.5" />
            المحفوظات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="videos" className="mt-4">
          <ProfileVideos userId={user.id} />
        </TabsContent>
        <TabsContent value="courses" className="mt-4">
          <ProfileCourses userId={user.id} />
        </TabsContent>
        <TabsContent value="saved" className="mt-4">
          <ProfileSavedVideos userId={user.id} />
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="mt-8 flex justify-center gap-4">
        <Button
          variant="outline"
          onClick={() => {
            if (user.role === 'admin') setView('admin')
          }}
          className="rounded-xl border-[oklch(0.25_0.04_280)] bg-transparent text-white hover:bg-[oklch(0.18_0.03_280)] hover:border-[oklch(0.627_0.265_303.9_/_0.3)]"
        >
          <Settings className="h-4 w-4 ml-1.5" />
          لوحة التحكم
        </Button>
        <Button
          variant="outline"
          onClick={() => { logout(); setView('home') }}
          className="rounded-xl text-[oklch(0.745_0.166_16.4)] hover:text-[oklch(0.845_0.166_16.4)] hover:bg-[oklch(0.645_0.246_16.4_/_0.1)] border-[oklch(0.25_0.04_280)] bg-transparent hover:border-[oklch(0.645_0.246_16.4_/_0.3)]"
        >
          <LogOut className="h-4 w-4 ml-1.5" />
          تسجيل الخروج
        </Button>
      </div>
    </motion.div>
  )
}

function ProfileVideos({ userId }: { userId: string }) {
  const { videos, loading, error } = useVideos({ limit: 24, userId })

  if (loading) return <LoadingSpinner />

  if (error) {
    return (
      <div className="text-center py-12 text-[oklch(0.745_0.166_16.4)]">
        حدث خطأ أثناء جلب فيديوهاتك
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-2xl bg-[oklch(0.627_0.265_303.9_/_0.1)] flex items-center justify-center mx-auto mb-4">
          <Video className="h-8 w-8 text-[oklch(0.827_0.165_303.9)]" />
        </div>
        <p className="text-[oklch(0.55_0.04_280)] mb-1">لم تقم برفع أي فيديو بعد</p>
        <p className="text-xs text-[oklch(0.45_0.03_280)]">
          ابدأ بمشاركة معرفتك مع المجتمع
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {videos.map((video, index) => (
        <VideoCard key={video.id} video={video} index={index} />
      ))}
    </div>
  )
}

function ProfileCourses({ userId }: { userId: string }) {
  const [courses, setCourses] = useState<unknown[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/user/${userId}/courses`, { headers: { 'x-user-id': userId } })
      .then((res) => res.json())
      .then((data) => setCourses(data.courses || []))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false))
  }, [userId])

  if (loading) return <LoadingSpinner />

  if (courses.length === 0) {
    return (
      <div className="text-center py-8 text-[oklch(0.55_0.04_280)]">
        لم يتم التسجيل في كورسات بعد
      </div>
    )
  }

  return (
    <div className="text-center py-8 text-[oklch(0.55_0.04_280)]">
     عرض الكورسات المسجل بها
    </div>
  )
}

interface SavedVideoItem {
  id: string
  userId: string
  videoId: string
  createdAt: string
  video: VideoData
}

function ProfileSavedVideos({ userId }: { userId: string }) {
  const [savedVideos, setSavedVideos] = useState<SavedVideoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const doFetch = async () => {
      try {
        const res = await fetch(`/api/user/${userId}/saved?limit=24`, {
          headers: { 'x-user-id': userId },
        })
        if (!res.ok) throw new Error('فشل في جلب الفيديوهات المحفوظة')
        const data = await res.json()
        if (!cancelled) {
          setSavedVideos(data.savedVideos || [])
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'حدث خطأ أثناء جلب المحفوظات')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    doFetch()
    return () => { cancelled = true }
  }, [userId])

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/user/${userId}/saved?limit=24`, {
        headers: { 'x-user-id': userId },
      })
      if (!res.ok) throw new Error('فشل في جلب الفيديوهات المحفوظة')
      const data = await res.json()
      setSavedVideos(data.savedVideos || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء جلب المحفوظات')
    } finally {
      setLoading(false)
    }
  }, [userId])

  const handleRemove = async (videoId: string, identifier: string) => {
    try {
      const res = await fetch(`/api/video/${identifier}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
      })
      if (!res.ok) throw new Error('فشل إزالة الفيديو من المحفوظات')
      const data = await res.json()
      if (data.action === 'unsaved') {
        setSavedVideos((prev) => prev.filter((s) => s.videoId !== videoId))
        toast.success('تمت إزالة الفيديو من المحفوظات')
      }
    } catch {
      toast.error('تعذرت إزالة الفيديو من المحفوظات')
    }
  }

  if (loading) return <LoadingSpinner />

  if (error) {
    return (
      <div className="text-center py-8 text-[oklch(0.745_0.166_16.4)]">
        {error}
        <div className="mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            className="rounded-xl border-[oklch(0.25_0.04_280)] bg-transparent text-white hover:bg-[oklch(0.18_0.03_280)]"
          >
            إعادة المحاولة
          </Button>
        </div>
      </div>
    )
  }

  if (savedVideos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-2xl bg-[oklch(0.627_0.265_303.9_/_0.1)] flex items-center justify-center mx-auto mb-4">
          <Bookmark className="h-8 w-8 text-[oklch(0.827_0.165_303.9)]" />
        </div>
        <p className="text-[oklch(0.55_0.04_280)] mb-1">لا توجد فيديوهات محفوظة بعد</p>
        <p className="text-xs text-[oklch(0.45_0.03_280)]">
          احفظ الفيديوهات التي تعجبك لتجدها هنا لاحقاً
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {savedVideos.map((item, index) => {
        const identifier = item.video.shareCode || item.video.id
        return (
          <div key={item.id} className="relative group">
            <VideoCard video={item.video} index={index} />
            <button
              onClick={() => handleRemove(item.videoId, identifier)}
              title="إزالة من المحفوظات"
              className="absolute top-2 left-2 z-10 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[oklch(0.645_0.246_16.4_/_0.8)]"
              aria-label="إزالة من المحفوظات"
            >
              <BookmarkX className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
