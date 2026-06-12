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

  setView: (view: ViewType) => void
  setSelectedVideoId: (id: string | null) => void
  setSelectedCourseId: (id: string | null) => void
  setSearchQuery: (query: string) => void
  setSidebarOpen: (open: boolean) => void
  setActiveCategory: (category: string | null) => void
  navigateToVideo: (id: string) => void
  navigateToCourse: (id: string) => void
  navigateToSearch: (query: string) => void
  goHome: () => void
}

export const useAppStore = create<AppState>()((set) => ({
  currentView: 'home',
  selectedVideoId: null,
  selectedCourseId: null,
  searchQuery: '',
  sidebarOpen: false,
  activeCategory: null,

  setView: (view) => set({ currentView: view }),
  setSelectedVideoId: (id) => set({ selectedVideoId: id }),
  setSelectedCourseId: (id) => set({ selectedCourseId: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setActiveCategory: (category) => set({ activeCategory: category }),

  navigateToVideo: (id) =>
    set({ currentView: 'video', selectedVideoId: id }),
  navigateToCourse: (id) =>
    set({ currentView: 'course', selectedCourseId: id }),
  navigateToSearch: (query) =>
    set({ currentView: 'search', searchQuery: query }),
  goHome: () =>
    set({
      currentView: 'home',
      selectedVideoId: null,
      selectedCourseId: null,
      searchQuery: '',
      activeCategory: null,
    }),
}))
