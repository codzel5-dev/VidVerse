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
  if (!stats) return <div className="text-center py-8 text-[oklch(0.55_0.04_280)]">لا يمكن تحميل الإحصائيات</div>

  const statCards = [
    { icon: Video, label: 'إجمالي الفيديوهات', value: stats.videos.total, sub: `${stats.videos.published} منشور`, color: 'text-[oklch(0.796_0.13_162.48)] bg-[oklch(0.696_0.17_162.48_/_0.1)]' },
    { icon: Users, label: 'إجمالي المستخدمين', value: stats.users.total, sub: `${stats.users.recent} هذا الأسبوع`, color: 'text-[oklch(0.855_0.183_68.5)] bg-[oklch(0.755_0.183_68.5_/_0.1)]' },
    { icon: BookOpen, label: 'إجمالي الكورسات', value: stats.courses.total, sub: `${stats.courses.enrollments} تسجيل`, color: 'text-[oklch(0.827_0.165_303.9)] bg-[oklch(0.627_0.265_303.9_/_0.1)]' },
    { icon: Eye, label: 'إجمالي المشاهدات', value: stats.engagement.totalViews, sub: 'مشاهدة', color: 'text-[oklch(0.815_0.183_192.5)] bg-[oklch(0.715_0.183_192.5_/_0.1)]' },
    { icon: DollarSign, label: 'إجمالي الإيرادات', value: stats.orders.revenue, sub: `$${stats.orders.revenue}`, color: 'text-[oklch(0.796_0.13_162.48)] bg-[oklch(0.696_0.17_162.48_/_0.1)]' },
    { icon: AlertTriangle, label: 'تعليقات مبلغ عنها', value: stats.engagement.reportedComments, sub: 'تعليق', color: 'text-[oklch(0.745_0.166_16.4)] bg-[oklch(0.645_0.246_16.4_/_0.1)]' },
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
            <Card className="glass-card p-5 rounded-2xl hover:border-[oklch(0.627_0.265_303.9_/_0.3)] transition-all duration-300">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[oklch(0.55_0.04_280)] mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-white">
                    {typeof stat.value === 'number' ? stat.value.toLocaleString('ar-EG') : stat.value}
                  </p>
                  <p className="text-xs text-[oklch(0.55_0.04_280)] mt-1">{stat.sub}</p>
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
      <Card className="glass-card p-5 rounded-2xl">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-[oklch(0.796_0.13_162.48)]" />
          نظرة سريعة
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-xl bg-[oklch(0.18_0.03_280)]">
            <div className="text-2xl font-bold text-[oklch(0.796_0.13_162.48)]">{stats.videos.free}</div>
            <div className="text-xs text-[oklch(0.55_0.04_280)]">فيديو مجاني</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-[oklch(0.18_0.03_280)]">
            <div className="text-2xl font-bold text-[oklch(0.855_0.183_68.5)]">{stats.videos.featured}</div>
            <div className="text-xs text-[oklch(0.55_0.04_280)]">فيديو مميز</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-[oklch(0.18_0.03_280)]">
            <div className="text-2xl font-bold text-[oklch(0.827_0.165_303.9)]">{stats.orders.pending}</div>
            <div className="text-xs text-[oklch(0.55_0.04_280)]">طلب معلق</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-[oklch(0.18_0.03_280)]">
            <div className="text-2xl font-bold text-[oklch(0.745_0.166_16.4)]">{stats.users.banned}</div>
            <div className="text-xs text-[oklch(0.55_0.04_280)]">مستخدم محظور</div>
          </div>
        </div>
      </Card>
    </div>
  )
}
