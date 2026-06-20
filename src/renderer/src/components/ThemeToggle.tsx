// src/renderer/src/components/ThemeToggle.tsx

import React from 'react'
import { Sun, Moon } from 'lucide-react'
import { useUIStore } from '../store/useUIStore'
import { isDarkTheme } from '../lib/themes'
import { Button } from './ui/Button'

export const ThemeToggle: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { theme, customTheme, toggleTheme } = useUIStore()
  const dark = isDarkTheme(theme, customTheme)
  const Icon = dark ? Sun : Moon

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className={compact ? 'w-full justify-center px-2' : 'w-full justify-start'}
      title={`Switch to ${dark ? 'light' : 'dark'} mode`}
    >
      <Icon className={`h-5 w-5 ${compact ? '' : 'mr-3'}`} />
      {!compact && (dark ? 'Light Mode' : 'Dark Mode')}
    </Button>
  )
}
