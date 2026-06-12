'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Shield, Ban, CheckCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { useAuthStore } from '@/store/auth-store'
import { toast } from 'sonner'

interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  isBanned: boolean
  createdAt: string
  _count: { videos: number; enrollments: number }
}

export default function UserManager() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const authUser = useAuthStore((s) => s.user)

  useEffect(() => {
    const headers: HeadersInit = {}
    if (authUser?.id) headers['x-user-id'] = authUser.id
    fetch('/api/admin/users', { headers })
      .then((res) => res.json())
      .then((data) => setUsers(data.users || []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }, [authUser?.id])

  const handleToggleBan = async (userId: string, isBanned: boolean) => {
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' }
      if (authUser?.id) headers['x-user-id'] = authUser.id
      const res = await fetch(`/api/user/${userId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ isBanned: !isBanned }),
      })
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isBanned: !isBanned } : u))
        )
        toast.success(isBanned ? 'تم فك الحظر' : 'تم حظر المستخدم')
      }
    } catch {
      toast.error('حدث خطأ')
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-4">
      <p className="text-sm text-[oklch(0.55_0.04_280)]">{users.length} مستخدم</p>

      <div className="space-y-3">
        {users.map((u, index) => (
          <motion.div
            key={u.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <Card className="glass-card p-4 rounded-2xl hover:border-[oklch(0.627_0.265_303.9_/_0.3)] transition-all duration-300">
              <div className="flex items-center gap-4">
                <Avatar className="h-10 w-10 border-2 border-[oklch(0.25_0.04_280)]">
                  <AvatarFallback className="bg-[oklch(0.627_0.265_303.9_/_0.1)] text-[oklch(0.827_0.165_303.9)] font-semibold">
                    {u.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-white">{u.name}</h4>
                    {u.role === 'admin' && (
                      <Badge className="badge-aurora border-0 rounded-lg text-xs">
                        <Shield className="h-3 w-3 ml-1" />
                        مشرف
                      </Badge>
                    )}
                    {u.isBanned && (
                      <Badge className="bg-[oklch(0.645_0.246_16.4_/_0.15)] text-[oklch(0.745_0.166_16.4)] border border-[oklch(0.645_0.246_16.4_/_0.3)] rounded-lg text-xs">محظور</Badge>
                    )}
                  </div>
                  <p className="text-xs text-[oklch(0.55_0.04_280)]">{u.email}</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-[oklch(0.55_0.04_280)]">
                  <span>{u._count.videos} فيديو</span>
                  <span>{u._count.enrollments} كورس</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleBan(u.id, u.isBanned)}
                  disabled={u.role === 'admin'}
                  className={`rounded-xl text-xs border-[oklch(0.25_0.04_280)] bg-transparent ${
                    u.isBanned
                      ? 'text-[oklch(0.796_0.13_162.48)] hover:text-[oklch(0.896_0.13_162.48)] hover:bg-[oklch(0.696_0.17_162.48_/_0.1)] hover:border-[oklch(0.696_0.17_162.48_/_0.3)]'
                      : 'text-[oklch(0.745_0.166_16.4)] hover:text-[oklch(0.845_0.166_16.4)] hover:bg-[oklch(0.645_0.246_16.4_/_0.1)] hover:border-[oklch(0.645_0.246_16.4_/_0.3)]'
                  }`}
                >
                  {u.isBanned ? (
                    <><CheckCircle className="h-3.5 w-3.5 ml-1" /> فك الحظر</>
                  ) : (
                    <><Ban className="h-3.5 w-3.5 ml-1" /> حظر</>
                  )}
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
