'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Video,
  Users,
  BookOpen,
  Eye,
  DollarSign,
  AlertTriangle,
  Activity,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { useAuthStore } from '@/store/auth-store'

interface AdminStats {
  videos: { total: number; published: number; unpublished: number; featured: number; free: number; recent: number }
  users: { total: number; banned: number; recent: number }
  courses: { total: number; published: number; enrollments: number }
  orders: { total: number; completed: number; pending: number; revenue: number; recent: number }
  engagement: { totalViews: number; totalComments: number; reportedComments: number }
}

export default function StatsPanel() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    const headers: HeadersInit = {}
    if (user?.id) headers['x-user-id'] = user.id
    fetch('/api/admin/stats', { headers })
      .then((res) => res.json())
      .then((data) => setStats(data.stats))
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [user?.id])

  if (loading) return <LoadingSpinner />
  if (!stats) return <div className="text-center py-8 text-muted-foreground">لا يمكن تحميل الإحصائيات</div>

  const statCards = [
    { icon: Video, label: 'إجمالي الفيديوهات', value: stats.videos.total, sub: `${stats.videos.published} منشور`, color: 'text-emerald-600 bg-emerald-50' },
    { icon: Users, label: 'إجمالي المستخدمين', value: stats.users.total, sub: `${stats.users.recent} هذا الأسبوع`, color: 'text-amber-600 bg-amber-50' },
    { icon: BookOpen, label: 'إجمالي الكورسات', value: stats.courses.total, sub: `${stats.courses.enrollments} تسجيل`, color: 'text-violet-600 bg-violet-50' },
    { icon: Eye, label: 'إجمالي المشاهدات', value: stats.engagement.totalViews, sub: 'مشاهدة', color: 'text-sky-600 bg-sky-50' },
    { icon: DollarSign, label: 'إجمالي الإيرادات', value: stats.orders.revenue, sub: `$${stats.orders.revenue}`, color: 'text-green-600 bg-green-50' },
    { icon: AlertTriangle, label: 'تعليقات مبلغ عنها', value: stats.engagement.reportedComments, sub: 'تعليق', color: 'text-rose-600 bg-rose-50' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
          >
            <Card className="p-5 rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-stone-800">
                    {typeof stat.value === 'number' ? stat.value.toLocaleString('ar-EG') : stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
                </div>
                <div className={`w-11 h-11 rounded-xl ${stat.color} flex items-center justify-center shrink-0`}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick overview */}
      <Card className="p-5 rounded-2xl border-0 shadow-sm">
        <h3 className="font-semibold text-stone-800 mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-emerald-600" />
          نظرة سريعة
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-xl bg-stone-50">
            <div className="text-2xl font-bold text-emerald-600">{stats.videos.free}</div>
            <div className="text-xs text-muted-foreground">فيديو مجاني</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-stone-50">
            <div className="text-2xl font-bold text-amber-600">{stats.videos.featured}</div>
            <div className="text-xs text-muted-foreground">فيديو مميز</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-stone-50">
            <div className="text-2xl font-bold text-violet-600">{stats.orders.pending}</div>
            <div className="text-xs text-muted-foreground">طلب معلق</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-stone-50">
            <div className="text-2xl font-bold text-rose-600">{stats.users.banned}</div>
            <div className="text-xs text-muted-foreground">مستخدم محظور</div>
          </div>
        </div>
      </Card>
    </div>
  )
}
