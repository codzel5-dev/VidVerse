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
  Sparkles,
  Newspaper,
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
  const { setView, goHome, navigateToProfileTab, navigateToProfile, navigateToBlog } = useAppStore()

  const navItems = [
    { label: 'الرئيسية', view: 'home' as const, icon: Play },
    { label: 'الفيديوهات', view: 'home' as const, icon: Video },
    { label: 'المدونة', view: 'blog' as const, icon: Newspaper },
    { label: 'المحفوظات', view: 'saved' as const, icon: Bookmark },
  ]

  const handleNavClick = (view: string) => {
    if (view === 'home') {
      goHome()
    } else if (view === 'saved') {
      navigateToProfileTab('saved')
    } else if (view === 'blog') {
      navigateToBlog()
    } else {
      setView(view as 'home' | 'video' | 'course' | 'profile' | 'admin' | 'search' | 'login' | 'register')
    }
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
      className="sticky top-0 z-50 glass-aurora"
    >
      {/* Top gradient accent line */}
      <div className="h-[2px] gradient-aurora" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <button
            onClick={goHome}
            className="flex items-center gap-2.5 shrink-0 group"
          >
            <div className="w-10 h-10 rounded-2xl gradient-aurora flex items-center justify-center shadow-lg group-hover:shadow-xl neon-violet transition-all duration-300">
              <Play className="h-4.5 w-4.5 text-white fill-white" />
            </div>
            <div className="hidden sm:block">
              <span className="text-xl font-bold text-gradient-aurora">
                VidVerse
              </span>
            </div>
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
                className="px-4 py-2 rounded-xl text-sm font-medium text-[oklch(0.7_0.04_280)] hover:text-white hover:bg-[oklch(0.627_0.265_303.9_/_0.1)] transition-all duration-300"
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Auth Section */}
          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-[oklch(0.627_0.265_303.9_/_0.1)] transition-colors">
                  <Avatar className="h-9 w-9 border-2 border-[oklch(0.627_0.265_303.9_/_0.4)]">
                    <AvatarFallback className="bg-[oklch(0.627_0.265_303.9_/_0.2)] text-[oklch(0.827_0.165_303.9)] text-sm font-semibold">
                      {getUserInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block text-sm font-medium text-[oklch(0.85_0.02_280)]">
                    {user.name}
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl bg-[oklch(0.13_0.028_280)] border-[oklch(0.25_0.04_280)]">
                  <DropdownMenuItem onClick={() => user && navigateToProfile(user.id)} className="rounded-xl cursor-pointer text-[oklch(0.85_0.02_280)] focus:bg-[oklch(0.627_0.265_303.9_/_0.1)] focus:text-white">
                    <User className="h-4 w-4 ml-2" />
                    <span>الملف الشخصي</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigateToProfileTab('saved')} className="rounded-xl cursor-pointer text-[oklch(0.85_0.02_280)] focus:bg-[oklch(0.627_0.265_303.9_/_0.1)] focus:text-white">
                    <Bookmark className="h-4 w-4 ml-2" />
                    <span>المحفوظات</span>
                  </DropdownMenuItem>
                  {user.role === 'admin' && (
                    <DropdownMenuItem onClick={() => setView('admin')} className="rounded-xl cursor-pointer text-[oklch(0.85_0.02_280)] focus:bg-[oklch(0.627_0.265_303.9_/_0.1)] focus:text-white">
                      <Shield className="h-4 w-4 ml-2" />
                      <span>لوحة التحكم</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-[oklch(0.25_0.04_280)]" />
                  <DropdownMenuItem onClick={logout} className="rounded-xl text-[oklch(0.645_0.246_16.4)] cursor-pointer focus:bg-[oklch(0.645_0.246_16.4_/_0.1)]">
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
                  className="rounded-xl text-[oklch(0.7_0.04_280)] hover:text-white hover:bg-[oklch(0.627_0.265_303.9_/_0.1)]"
                >
                  دخول
                </Button>
                <Button
                  size="sm"
                  onClick={() => setView('register')}
                  className="btn-aurora rounded-xl border-0"
                >
                  <Sparkles className="h-4 w-4 ml-1" />
                  <span>تسجيل</span>
                </Button>
              </div>
            )}

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger className="md:hidden">
                <div className="inline-flex items-center justify-center rounded-xl p-2 text-[oklch(0.7_0.04_280)] hover:bg-[oklch(0.627_0.265_303.9_/_0.1)] transition-colors">
                  <Menu className="h-5 w-5" />
                </div>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 rounded-l-3xl bg-[oklch(0.10_0.025_280)] border-l-[oklch(0.25_0.04_280)]">
                <SheetTitle className="text-right text-gradient-aurora">القائمة</SheetTitle>
                <div className="flex flex-col gap-2 mt-6">
                  <div className="md:hidden mb-4">
                    <SearchBar />
                  </div>
                  {navItems.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => handleNavClick(item.view)}
                      className="flex items-center gap-3 px-4 py-3 rounded-2xl text-[oklch(0.7_0.04_280)] hover:bg-[oklch(0.627_0.265_303.9_/_0.1)] hover:text-white transition-all"
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  ))}
                  {isAuthenticated && user && (
                    <>
                      <button
                        onClick={() => { if (user) navigateToProfile(user.id); setMobileMenuOpen(false) }}
                        className="flex items-center gap-3 px-4 py-3 rounded-2xl text-[oklch(0.7_0.04_280)] hover:bg-[oklch(0.627_0.265_303.9_/_0.1)] hover:text-white transition-all"
                      >
                        <User className="h-5 w-5" />
                        <span className="font-medium">الملف الشخصي</span>
                      </button>
                      {user.role === 'admin' && (
                        <button
                          onClick={() => { setView('admin'); setMobileMenuOpen(false) }}
                          className="flex items-center gap-3 px-4 py-3 rounded-2xl text-[oklch(0.7_0.04_280)] hover:bg-[oklch(0.627_0.265_303.9_/_0.1)] hover:text-white transition-all"
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
