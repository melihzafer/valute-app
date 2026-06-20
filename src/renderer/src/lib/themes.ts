// src/renderer/src/lib/themes.ts
// Theme engine: preset themes + custom theme support.
// Her tema, index.css'teki CSS degiskenlerinin uzerine yazilir.

export type ThemeId =
  | 'light'
  | 'dark'
  | 'ocean'
  | 'forest'
  | 'sunset'
  | 'midnight'
  | 'nord'
  | 'rose'
  | 'dracula'
  | 'sakura'
  | 'void'
  | 'custom'

export interface CustomTheme {
  base: 'light' | 'dark'
  /** Accent color as hex, e.g. "#7c6cf0" */
  accent: string
}

interface ThemeVars {
  [cssVar: string]: string
}

export interface ThemePreset {
  id: ThemeId
  name: string
  /** True if the theme is dark-based (adds .dark class for component variants) */
  isDark: boolean
  /** Swatch colors for the settings preview card */
  preview: { bg: string; card: string; accent: string }
  vars: ThemeVars
}

// Light ve Dark, index.css'teki varsayilanlardir — vars bos birakilir.
export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'light',
    name: 'Light',
    isDark: false,
    preview: { bg: '#f7f9fb', card: '#ffffff', accent: '#6a5cd0' },
    vars: {}
  },
  {
    id: 'dark',
    name: 'Dark',
    isDark: true,
    preview: { bg: '#191e2a', card: '#1f2533', accent: '#8b5cf6' },
    vars: {}
  },
  {
    id: 'ocean',
    name: 'Ocean',
    isDark: true,
    preview: { bg: '#0b1929', card: '#102338', accent: '#38bdf8' },
    vars: {
      '--background': '210 55% 10%',
      '--foreground': '200 30% 95%',
      '--card': '210 50% 14%',
      '--card-foreground': '200 30% 95%',
      '--popover': '210 50% 14%',
      '--popover-foreground': '200 30% 95%',
      '--primary': '199 89% 60%',
      '--primary-foreground': '210 55% 10%',
      '--secondary': '210 40% 18%',
      '--secondary-foreground': '200 30% 95%',
      '--muted': '210 40% 18%',
      '--muted-foreground': '205 25% 65%',
      '--accent': '210 40% 22%',
      '--accent-foreground': '200 30% 95%',
      '--border': '210 40% 20%',
      '--input': '210 40% 20%',
      '--ring': '199 89% 60%'
    }
  },
  {
    id: 'forest',
    name: 'Forest',
    isDark: true,
    preview: { bg: '#0f1d15', card: '#15281d', accent: '#4ade80' },
    vars: {
      '--background': '150 32% 9%',
      '--foreground': '140 25% 95%',
      '--card': '150 30% 12%',
      '--card-foreground': '140 25% 95%',
      '--popover': '150 30% 12%',
      '--popover-foreground': '140 25% 95%',
      '--primary': '142 70% 58%',
      '--primary-foreground': '150 32% 9%',
      '--secondary': '150 25% 16%',
      '--secondary-foreground': '140 25% 95%',
      '--muted': '150 25% 16%',
      '--muted-foreground': '145 18% 62%',
      '--accent': '150 25% 20%',
      '--accent-foreground': '140 25% 95%',
      '--border': '150 25% 18%',
      '--input': '150 25% 18%',
      '--ring': '142 70% 58%'
    }
  },
  {
    id: 'sunset',
    name: 'Sunset',
    isDark: false,
    preview: { bg: '#fdf6ef', card: '#ffffff', accent: '#f97316' },
    vars: {
      '--background': '30 60% 97%',
      '--foreground': '20 40% 15%',
      '--card': '0 0% 100%',
      '--card-foreground': '20 40% 15%',
      '--popover': '0 0% 100%',
      '--popover-foreground': '20 40% 15%',
      '--primary': '24 95% 53%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '30 40% 92%',
      '--secondary-foreground': '20 40% 15%',
      '--muted': '30 40% 94%',
      '--muted-foreground': '25 20% 45%',
      '--accent': '30 40% 90%',
      '--accent-foreground': '20 40% 15%',
      '--border': '30 30% 87%',
      '--input': '30 30% 87%',
      '--ring': '24 95% 53%'
    }
  },
  {
    id: 'midnight',
    name: 'Midnight',
    isDark: true,
    preview: { bg: '#15101f', card: '#1d1530', accent: '#c084fc' },
    vars: {
      '--background': '260 32% 9%',
      '--foreground': '270 25% 96%',
      '--card': '260 30% 13%',
      '--card-foreground': '270 25% 96%',
      '--popover': '260 30% 13%',
      '--popover-foreground': '270 25% 96%',
      '--primary': '270 95% 75%',
      '--primary-foreground': '260 32% 9%',
      '--secondary': '260 25% 18%',
      '--secondary-foreground': '270 25% 96%',
      '--muted': '260 25% 18%',
      '--muted-foreground': '265 18% 65%',
      '--accent': '260 25% 22%',
      '--accent-foreground': '270 25% 96%',
      '--border': '260 25% 20%',
      '--input': '260 25% 20%',
      '--ring': '270 95% 75%'
    }
  },
  {
    id: 'nord',
    name: 'Nord',
    isDark: true,
    preview: { bg: '#2e3440', card: '#3b4252', accent: '#88c0d0' },
    vars: {
      '--background': '220 16% 22%',
      '--foreground': '218 27% 92%',
      '--card': '220 17% 28%',
      '--card-foreground': '218 27% 92%',
      '--popover': '220 17% 28%',
      '--popover-foreground': '218 27% 92%',
      '--primary': '193 43% 64%',
      '--primary-foreground': '220 16% 22%',
      '--secondary': '220 16% 32%',
      '--secondary-foreground': '218 27% 92%',
      '--muted': '220 16% 32%',
      '--muted-foreground': '218 15% 75%',
      '--accent': '220 16% 36%',
      '--accent-foreground': '218 27% 92%',
      '--border': '220 16% 34%',
      '--input': '220 16% 34%',
      '--ring': '193 43% 64%'
    }
  },
  {
    id: 'rose',
    name: 'Rose Pine',
    isDark: true,
    preview: { bg: '#191724', card: '#212030', accent: '#ebbcba' },
    vars: {
      '--background': '248 23% 12%',
      '--foreground': '245 40% 96%',
      '--card': '245 20% 16%',
      '--card-foreground': '245 40% 96%',
      '--popover': '245 20% 16%',
      '--popover-foreground': '245 40% 96%',
      '--primary': '2 40% 83%',
      '--primary-foreground': '248 23% 12%',
      '--secondary': '245 15% 22%',
      '--secondary-foreground': '245 40% 96%',
      '--muted': '245 15% 22%',
      '--muted-foreground': '245 15% 72%',
      '--accent': '245 15% 26%',
      '--accent-foreground': '245 40% 96%',
      '--border': '245 15% 24%',
      '--input': '245 15% 24%',
      '--ring': '2 40% 83%'
    }
  },
  {
    id: 'dracula',
    name: 'Dracula',
    isDark: true,
    preview: { bg: '#282a36', card: '#21222c', accent: '#bd93f9' },
    vars: {
      '--background': '231 15% 18%',
      '--foreground': '60 30% 96%',
      '--card': '230 14% 15%',
      '--card-foreground': '60 30% 96%',
      '--popover': '230 14% 15%',
      '--popover-foreground': '60 30% 96%',
      '--primary': '265 89% 78%',
      '--primary-foreground': '231 15% 18%',
      '--secondary': '230 12% 21%',
      '--secondary-foreground': '60 30% 96%',
      '--muted': '230 12% 21%',
      '--muted-foreground': '230 10% 70%',
      '--accent': '230 12% 25%',
      '--accent-foreground': '60 30% 96%',
      '--border': '230 12% 23%',
      '--input': '230 12% 23%',
      '--ring': '265 89% 78%'
    }
  },
  {
    id: 'sakura',
    name: 'Sakura',
    isDark: false,
    preview: { bg: '#fff0f2', card: '#ffffff', accent: '#ff8da1' },
    vars: {
      '--background': '350 100% 97%',
      '--foreground': '340 50% 20%',
      '--card': '0 0% 100%',
      '--card-foreground': '340 50% 20%',
      '--popover': '0 0% 100%',
      '--popover-foreground': '340 50% 20%',
      '--primary': '349 100% 77%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '350 60% 93%',
      '--secondary-foreground': '340 50% 20%',
      '--muted': '350 60% 95%',
      '--muted-foreground': '340 30% 50%',
      '--accent': '350 60% 91%',
      '--accent-foreground': '340 50% 20%',
      '--border': '350 40% 88%',
      '--input': '350 40% 88%',
      '--ring': '349 100% 77%'
    }
  },
  {
    id: 'void',
    name: 'Void (Black)',
    isDark: true,
    preview: { bg: '#000000', card: '#0a0a0d', accent: '#8b5cf6' },
    vars: {
      '--background': '0 0% 0%',
      '--foreground': '210 20% 96%',
      '--card': '240 5% 4%',
      '--card-foreground': '210 20% 96%',
      '--popover': '240 5% 4%',
      '--popover-foreground': '210 20% 96%',
      '--primary': '258 92% 68%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '240 5% 9%',
      '--secondary-foreground': '210 20% 96%',
      '--muted': '240 5% 9%',
      '--muted-foreground': '215 15% 62%',
      '--accent': '240 5% 11%',
      '--accent-foreground': '210 20% 96%',
      '--border': '240 5% 12%',
      '--input': '240 5% 12%',
      '--ring': '258 92% 68%'
    }
  }
]

const PRESET_VAR_KEYS = [
  '--background',
  '--foreground',
  '--card',
  '--card-foreground',
  '--popover',
  '--popover-foreground',
  '--primary',
  '--primary-foreground',
  '--secondary',
  '--secondary-foreground',
  '--muted',
  '--muted-foreground',
  '--accent',
  '--accent-foreground',
  '--border',
  '--input',
  '--ring'
]

/** Hex (#rrggbb) → "H S% L%" HSL string for CSS vars */
export function hexToHslVar(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return '247 50% 58%'
  const num = parseInt(m[1], 16)
  const r = ((num >> 16) & 255) / 255
  const g = ((num >> 8) & 255) / 255
  const b = (num & 255) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0
  let s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

/** Apply a theme to the document root. */
export function applyTheme(themeId: ThemeId, custom?: CustomTheme): void {
  const root = document.documentElement

  // Onceki tema degiskenlerini temizle (index.css varsayilanlarina don)
  for (const key of PRESET_VAR_KEYS) root.style.removeProperty(key)

  if (themeId === 'custom' && custom) {
    root.classList.toggle('dark', custom.base === 'dark')
    const accent = hexToHslVar(custom.accent)
    root.style.setProperty('--primary', accent)
    root.style.setProperty('--ring', accent)
    root.style.setProperty(
      '--primary-foreground',
      custom.base === 'dark' ? '222 20% 12%' : '0 0% 100%'
    )
    return
  }

  const preset = THEME_PRESETS.find((t) => t.id === themeId) ?? THEME_PRESETS[1]
  root.classList.toggle('dark', preset.isDark)
  for (const [key, value] of Object.entries(preset.vars)) {
    root.style.setProperty(key, value)
  }
}

export function isDarkTheme(themeId: ThemeId, custom?: CustomTheme): boolean {
  if (themeId === 'custom') return (custom?.base ?? 'dark') === 'dark'
  return THEME_PRESETS.find((t) => t.id === themeId)?.isDark ?? true
}
