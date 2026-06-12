'use client'

import { Search, X } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { useAppStore } from '@/store/app-store'

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigateToSearch = useAppStore((s) => s.navigateToSearch)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !isFocused) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFocused])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      navigateToSearch(query.trim())
      inputRef.current?.blur()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-md">
      <div className={`relative flex items-center transition-all duration-300 ${isFocused ? 'scale-[1.02]' : ''}`}>
        <Search className="absolute right-3 h-4 w-4 text-[oklch(0.55_0.04_280)]" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="ابحث عن فيديو أو كورس..."
          className="h-10 pr-10 pl-10 rounded-xl input-aurora text-white placeholder:text-[oklch(0.45_0.03_280)] focus:border-[oklch(0.627_0.265_303.9_/_0.5)] focus:shadow-[0_0_20px_oklch(0.627_0.265_303.9_/_0.1)]"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute left-3 p-0.5 rounded-full hover:bg-[oklch(0.627_0.265_303.9_/_0.1)] transition-colors"
          >
            <X className="h-3.5 w-3.5 text-[oklch(0.55_0.04_280)]" />
          </button>
        )}
      </div>
    </form>
  )
}
