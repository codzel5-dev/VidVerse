'use client'

import { motion } from 'framer-motion'
import {
  Video,
  Users,
  BookOpen,
  MessageCircle,
  BarChart3,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuthStore } from '@/store/auth-store'
import { useAppStore } from '@/store/app-store'
import StatsPanel from './StatsPanel'
import VideoManager from './VideoManager'
import UserManager from './UserManager'
import CourseManager from './CourseManager'
import CommentManager from './CommentManager'

export default function AdminDashboard() {
  const user = useAuthStore((s) => s.user)
  const setView = useAppStore((s) => s.setView)

  if (!user || user.role !== 'admin') {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground mb-4">ليس لديك صلاحية الوصول</p>
        <button
          onClick={() => setView('home')}
          className="px-6 py-2.5 rounded-2xl gradient-emerald-teal text-white font-medium"
        >
          العودة للرئيسية
        </button>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-800">لوحة التحكم</h1>
        <p className="text-muted-foreground mt-1">إدارة وتحليل المنصة</p>
      </div>

      <Tabs defaultValue="stats" className="w-full">
        <TabsList className="w-full justify-start rounded-2xl bg-white border border-stone-200 p-1 h-auto flex-wrap gap-1">
          <TabsTrigger value="stats" className="rounded-xl data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
            <BarChart3 className="h-4 w-4 ml-1.5" />
            الإحصائيات
          </TabsTrigger>
          <TabsTrigger value="videos" className="rounded-xl data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
            <Video className="h-4 w-4 ml-1.5" />
            الفيديوهات
          </TabsTrigger>
          <TabsTrigger value="users" className="rounded-xl data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
            <Users className="h-4 w-4 ml-1.5" />
            المستخدمون
          </TabsTrigger>
          <TabsTrigger value="courses" className="rounded-xl data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
            <BookOpen className="h-4 w-4 ml-1.5" />
            الكورسات
          </TabsTrigger>
          <TabsTrigger value="comments" className="rounded-xl data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
            <MessageCircle className="h-4 w-4 ml-1.5" />
            التعليقات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="mt-4">
          <StatsPanel />
        </TabsContent>
        <TabsContent value="videos" className="mt-4">
          <VideoManager />
        </TabsContent>
        <TabsContent value="users" className="mt-4">
          <UserManager />
        </TabsContent>
        <TabsContent value="courses" className="mt-4">
          <CourseManager />
        </TabsContent>
        <TabsContent value="comments" className="mt-4">
          <CommentManager />
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
