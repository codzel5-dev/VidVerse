'use client'

import { create } from 'zustand'

export type ViewType = 'home' | 'video' | 'course' | 'profile' | 'admin' | 'search' | 'login' | 'register' | 'blog' | 'blog-post'

interface AppState {
  currentView: ViewType
  selectedVideoId: string | null
  selectedCourseId: string | null
  selectedUserId: string | null
  selectedBlogSlug: string | null
  blogTagFilter: string | null
  searchQuery: string
  sidebarOpen: boolean
  activeCategory: string | null
  videoListVersion: number
  profileTab: 'videos' | 'courses' | 'saved'

  setView: (view: ViewType) => void
  setSelectedVideoId: (id: string | null) => void
  setSelectedCourseId: (id: string | null) => void
  setSelectedUserId: (id: string | null) => void
  setSelectedBlogSlug: (slug: string | null) => void
  setBlogTagFilter: (tag: string | null) => void
  setSearchQuery: (query: string) => void
  setSidebarOpen: (open: boolean) => void
  setActiveCategory: (category: string | null) => void
  bumpVideoListVersion: () => void
  navigateToVideo: (id: string) => void
  navigateToCourse: (id: string) => void
  navigateToSearch: (query: string) => void
  navigateToProfile: (userId: string) => void
  navigateToBlog: () => void
  navigateToBlogPost: (slug: string) => void
  goHome: () => void
  setProfileTab: (tab: 'videos' | 'courses' | 'saved') => void
  navigateToProfileTab: (tab: 'videos' | 'courses' | 'saved') => void
}

export const useAppStore = create<AppState>()((set) => ({
  currentView: 'home',
  selectedVideoId: null,
  selectedCourseId: null,
  selectedUserId: null,
  selectedBlogSlug: null,
  blogTagFilter: null,
  searchQuery: '',
  sidebarOpen: false,
  activeCategory: null,
  videoListVersion: 0,
  profileTab: 'videos',

  setView: (view) => set({ currentView: view }),
  setSelectedVideoId: (id) => set({ selectedVideoId: id }),
  setSelectedCourseId: (id) => set({ selectedCourseId: id }),
  setSelectedUserId: (id) => set({ selectedUserId: id }),
  setSelectedBlogSlug: (slug) => set({ selectedBlogSlug: slug }),
  setBlogTagFilter: (tag) => set({ blogTagFilter: tag }),
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
    url.searchParams.delete('u')
    window.history.pushState({}, '', url.toString())
  },
  navigateToCourse: (id) => {
    set({ currentView: 'course', selectedCourseId: id })
    const url = new URL(window.location.href)
    url.searchParams.set('c', id)
    url.searchParams.delete('v')
    url.searchParams.delete('u')
    window.history.pushState({}, '', url.toString())
  },
  navigateToProfile: (userId) => {
    set({ currentView: 'profile', selectedUserId: userId, profileTab: 'videos' })
    // Update browser URL to ?u=USER_ID
    const url = new URL(window.location.href)
    url.searchParams.set('u', userId)
    url.searchParams.delete('v')
    url.searchParams.delete('c')
    window.history.pushState({}, '', url.toString())
  },
  navigateToSearch: (query) =>
    set({ currentView: 'search', searchQuery: query }),
  navigateToBlog: () => {
    set({ currentView: 'blog', selectedBlogSlug: null })
    const url = new URL(window.location.href)
    url.searchParams.delete('v')
    url.searchParams.delete('c')
    url.searchParams.delete('u')
    url.searchParams.delete('b')
    window.history.pushState({}, '', url.toString())
  },
  navigateToBlogPost: (slug) => {
    set({ currentView: 'blog-post', selectedBlogSlug: slug })
    const url = new URL(window.location.href)
    url.searchParams.set('b', slug)
    url.searchParams.delete('v')
    url.searchParams.delete('c')
    url.searchParams.delete('u')
    window.history.pushState({}, '', url.toString())
  },
  goHome: () => {
    set({
      currentView: 'home',
      selectedVideoId: null,
      selectedCourseId: null,
      selectedUserId: null,
      selectedBlogSlug: null,
      blogTagFilter: null,
      searchQuery: '',
      activeCategory: null,
    })
    const url = new URL(window.location.href)
    url.searchParams.delete('v')
    url.searchParams.delete('c')
    url.searchParams.delete('u')
    url.searchParams.delete('b')
    url.searchParams.delete('tag')
    window.history.pushState({}, '', url.toString())
  },
}))
