import { useState, useEffect } from 'react'

export function useTheme() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('idrakiya_theme') || 'light'
  )

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('idrakiya_theme', theme)
  }, [theme])

  return {
    theme,
    isDark: theme === 'dark',
    toggle: () => setTheme(t => (t === 'dark' ? 'light' : 'dark')),
  }
}
