import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: 'dark',
      
      setTheme: (theme) => {
        set({ theme })
        
        // Apply theme to document
        if (theme === 'dark') {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
        
        // Store in localStorage
        localStorage.setItem('theme', theme)
      },
      
      toggleTheme: () => {
        const currentTheme = get().theme
        const newTheme = currentTheme === 'light' ? 'dark' : 'light'
        get().setTheme(newTheme)
      },
      
      initializeTheme: () => {
        // Check for saved theme preference or default to 'dark'
        const savedTheme = localStorage.getItem('theme')
        const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        const theme = savedTheme || 'dark' // Default to dark mode
        
        get().setTheme(theme)
      },
    }),
    {
      name: 'theme-storage',
      storage: {
        getItem: (name) => localStorage.getItem(name),
        setItem: (name, value) => localStorage.setItem(name, value),
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
)
