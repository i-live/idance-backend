'use client'

import { useEffect, useState } from 'react'

export function SimpleThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Get initial theme
    const savedTheme = localStorage.getItem('theme')
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    const initialTheme = savedTheme === 'system' || !savedTheme ? systemTheme : savedTheme as 'light' | 'dark'
    setTheme(initialTheme)
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }

  // Always render the same initial state to avoid hydration mismatch
  return (
    <button
      onClick={mounted ? toggleTheme : undefined}
      className="h-10 w-10 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex items-center justify-center transition-colors"
      aria-label="Toggle theme"
      disabled={!mounted}
      suppressHydrationWarning
    >
      {mounted ? (theme === 'light' ? '☀️' : '🌙') : '☀️'}
    </button>
  )
}