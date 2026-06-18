import { useEffect } from 'react'

export function useTheme() {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark')
    localStorage.setItem('idrakiya_theme', 'dark')
  }, [])

  return { theme: 'dark', isDark: true, toggle: () => {} }
}
