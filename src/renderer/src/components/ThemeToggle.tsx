// src/renderer/src/components/ThemeToggle.tsx

import React from 'react'
import { Sun, Moon } from 'lucide-react'
import { useUIStore } from '../store/useUIStore'
import { Button } from './ui/Button'

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useUIStore()

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="w-full justify-start"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <>
          <Sun className="h-5 w-5 mr-3" />
          Light Mode
        </>
      ) : (
        <>
          <Moon className="h-5 w-5 mr-3" />
          Dark Mode
        </>
      )}
    </Button>
  )
}
