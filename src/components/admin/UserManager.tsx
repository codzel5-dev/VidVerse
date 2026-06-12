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
      <p className="text-sm text-muted-foreground">{users.length} مستخدم</p>

      <div className="space-y-3">
        {users.map((u, index) => (
          <motion.div
            key={u.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <Card className="p-4 rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <Avatar className="h-10 w-10 border-2 border-stone-200">
                  <AvatarFallback className="bg-emerald-50 text-emerald-700 font-semibold">
                    {u.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-stone-800">{u.name}</h4>
                    {u.role === 'admin' && (
                      <Badge className="bg-violet-100 text-violet-700 border-0 rounded-lg text-xs">
                        <Shield className="h-3 w-3 ml-1" />
                        مشرف
                      </Badge>
                    )}
                    {u.isBanned && (
                      <Badge className="bg-red-100 text-red-700 border-0 rounded-lg text-xs">محظور</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{u._count.videos} فيديو</span>
                  <span>{u._count.enrollments} كورس</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleBan(u.id, u.isBanned)}
                  disabled={u.role === 'admin'}
                  className={`rounded-xl text-xs ${
                    u.isBanned
                      ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                      : 'text-red-600 hover:text-red-700 hover:bg-red-50'
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
