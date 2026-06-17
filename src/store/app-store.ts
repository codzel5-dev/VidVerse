'use client'

import { create } from 'zustand'

export type ViewType = 'home' | 'video' | 'course' | 'profile' | 'admin' | 'search' | 'login' | 'register'

interface AppState {
  currentView: ViewType
  selectedVideoId: string | null
  selectedCourseId: string | null
  searchQuery: string
  sidebarOpen: boolean
  activeCategory: string | null
  videoListVersion: number
  profileTab: 'videos' | 'courses' | 'saved'

  setView: (view: ViewType) => void
  setSelectedVideoId: (id: string | null) => void
  setSelectedCourseId: (id: string | null) => void
  setSearchQuery: (query: string) => void
  setSidebarOpen: (open: boolean) => void
  setActiveCategory: (category: string | null) => void
  bumpVideoListVersion: () => void
  navigateToVideo: (id: string) => void
  navigateToCourse: (id: string) => void
  navigateToSearch: (query: string) => void
  goHome: () => void
  setProfileTab: (tab: 'videos' | 'courses' | 'saved') => void
  navigateToProfileTab: (tab: 'videos' | 'courses' | 'saved') => void
}

export const useAppStore = create<AppState>()((set) => ({
  currentView: 'home',
  selectedVideoId: null,
  selectedCourseId: null,
  searchQuery: '',
  sidebarOpen: false,
  activeCategory: null,
  videoListVersion: 0,
  profileTab: 'videos',

  setView: (view) => set({ currentView: view }),
  setSelectedVideoId: (id) => set({ selectedVideoId: id }),
  setSelectedCourseId: (id) => set({ selectedCourseId: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setActiveCategory: (category) => set({ activeCategory: category }),
  bumpVideoListVersion: () => set((s) => ({ videoListVersion: s.videoListVersion + 1 })),
  setProfileTab: (tab) => set({ profileTab: tab }),
  navigateToProfileTab: (tab) => set({ currentView: 'profile', profileTab: tab }),

  navigateToVideo: (id) => {
    set({ currentView: 'video', selectedVideoId: id })
    // Update browser URL to YouTube-style ?v=SHARECODE
    const url = new URL(window.location.href)
    url.searchParams.set('v', id)
    url.searchParams.delete('c')
    window.history.pushState({}, '', url.toString())
  },
  navigateToCourse: (id) => {
    set({ currentView: 'course', selectedCourseId: id })
    const url = new URL(window.location.href)
    url.searchParams.set('c', id)
    url.searchParams.delete('v')
    window.history.pushState({}, '', url.toString())
  },
  navigateToSearch: (query) =>
    set({ currentView: 'search', searchQuery: query }),
  goHome: () => {
    set({
      currentView: 'home',
      selectedVideoId: null,
      selectedCourseId: null,
      searchQuery: '',
      activeCategory: null,
    })
    const url = new URL(window.location.href)
    url.searchParams.delete('v')
    url.searchParams.delete('c')
    window.history.pushState({}, '', url.toString())
  },
}))
