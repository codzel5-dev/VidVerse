'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Play,
  Menu,
  User,
  LogOut,
  Shield,
  Bookmark,
  Video,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import SearchBar from '@/components/common/SearchBar'
import { useAuthStore } from '@/store/auth-store'
import { useAppStore } from '@/store/app-store'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, isAuthenticated, logout } = useAuthStore()
  const { setView, goHome } = useAppStore()

  const navItems = [
    { label: 'الرئيسية', view: 'home' as const, icon: Play },
    { label: 'الفيديوهات', view: 'home' as const, icon: Video },
    { label: 'المحفوظات', view: 'home' as const, icon: Bookmark },
  ]

  const handleNavClick = (view: string) => {
    if (view === 'home') goHome()
    else setView(view as 'home' | 'video' | 'course' | 'profile' | 'admin' | 'search' | 'login' | 'register')
    setMobileMenuOpen(false)
  }

  const getUserInitials = (name: string) => {
    return name.charAt(0).toUpperCase()
  }

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 glass border-b border-stone-200/50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <button
            onClick={goHome}
            className="flex items-center gap-2 shrink-0 group"
          >
            <div className="w-9 h-9 rounded-xl gradient-emerald-teal flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <Play className="h-4 w-4 text-white fill-white" />
            </div>
            <span className="text-xl font-bold text-stone-800 hidden sm:block">
              VidVerse
            </span>
          </button>

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 justify-center max-w-lg mx-4">
            <SearchBar />
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => handleNavClick(item.view)}
                className="px-3 py-2 rounded-xl text-sm font-medium text-stone-600 hover:text-stone-800 hover:bg-stone-100 transition-all"
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Auth Section */}
          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-stone-100 transition-colors">
                  <Avatar className="h-8 w-8 border-2 border-emerald-200">
                    <AvatarFallback className="bg-emerald-100 text-emerald-700 text-sm font-semibold">
                      {getUserInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block text-sm font-medium text-stone-700">
                    {user.name}
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl">
                  <DropdownMenuItem onClick={() => setView('profile')} className="rounded-xl cursor-pointer">
                    <User className="h-4 w-4 ml-2" />
                    <span>الملف الشخصي</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setView('profile')} className="rounded-xl cursor-pointer">
                    <Bookmark className="h-4 w-4 ml-2" />
                    <span>المحفوظات</span>
                  </DropdownMenuItem>
                  {user.role === 'admin' && (
                    <DropdownMenuItem onClick={() => setView('admin')} className="rounded-xl cursor-pointer">
                      <Shield className="h-4 w-4 ml-2" />
                      <span>لوحة التحكم</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="rounded-xl text-red-600 cursor-pointer">
                    <LogOut className="h-4 w-4 ml-2" />
                    <span>تسجيل الخروج</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setView('login')}
                  className="rounded-xl text-stone-600"
                >
                  دخول
                </Button>
                <Button
                  size="sm"
                  onClick={() => setView('register')}
                  className="rounded-xl gradient-emerald-teal text-white border-0 hover:opacity-90"
                >
                  تسجيل
                </Button>
              </div>
            )}

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger className="md:hidden">
                <div className="inline-flex items-center justify-center rounded-xl p-2 text-stone-600 hover:bg-stone-100 transition-colors">
                  <Menu className="h-5 w-5" />
                </div>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 rounded-l-3xl">
                <SheetTitle className="text-right">القائمة</SheetTitle>
                <div className="flex flex-col gap-2 mt-6">
                  <div className="md:hidden mb-4">
                    <SearchBar />
                  </div>
                  {navItems.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => handleNavClick(item.view)}
                      className="flex items-center gap-3 px-4 py-3 rounded-2xl text-stone-600 hover:bg-stone-100 hover:text-stone-800 transition-all"
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  ))}
                  {isAuthenticated && user && (
                    <>
                      <button
                        onClick={() => { setView('profile'); setMobileMenuOpen(false) }}
                        className="flex items-center gap-3 px-4 py-3 rounded-2xl text-stone-600 hover:bg-stone-100 hover:text-stone-800 transition-all"
                      >
                        <User className="h-5 w-5" />
                        <span className="font-medium">الملف الشخصي</span>
                      </button>
                      {user.role === 'admin' && (
                        <button
                          onClick={() => { setView('admin'); setMobileMenuOpen(false) }}
                          className="flex items-center gap-3 px-4 py-3 rounded-2xl text-stone-600 hover:bg-stone-100 hover:text-stone-800 transition-all"
                        >
                          <Shield className="h-5 w-5" />
                          <span className="font-medium">لوحة التحكم</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </motion.header>
  )
}
