'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Mail, Lock, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useAuthStore } from '@/store/auth-store'
import { useAppStore } from '@/store/app-store'
import { toast } from 'sonner'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const login = useAuthStore((s) => s.login)
  const setView = useAppStore((s) => s.setView)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('يرجى ملء جميع الحقول')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'بيانات الدخول غير صحيحة')
        return
      }
      login(data.user)
      toast.success(`مرحباً ${data.user.name}!`)
      setView('home')
    } catch {
      toast.error('حدث خطأ أثناء تسجيل الدخول')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-[60vh] flex items-center justify-center px-4"
    >
      <Card className="w-full max-w-md border-0 shadow-lg rounded-3xl">
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 rounded-2xl gradient-emerald-teal flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-stone-800">تسجيل الدخول</CardTitle>
          <CardDescription>أدخل بياناتك للوصول إلى حسابك</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="pr-10 rounded-xl"
                  dir="ltr"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pr-10 rounded-xl"
                  dir="ltr"
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl gradient-emerald-teal text-white border-0 h-11 font-semibold"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'تسجيل الدخول'}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">ليس لديك حساب؟</span>{' '}
            <button
              onClick={() => setView('register')}
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              سجل الآن
            </button>
          </div>

          {/* Demo credentials */}
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 text-xs text-emerald-700">
            <p className="font-medium mb-1">بيانات تجريبية:</p>
            <p>البريد: admin@vidverse.com</p>
            <p>كلمة المرور: password123</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
