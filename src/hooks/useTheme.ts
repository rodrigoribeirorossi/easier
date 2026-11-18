import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark' | 'custom'

const DEFAULT_CUSTOM_COLOR = '#0b1220'

function hexToHsl(hex: string): string {
  const normalized = hex.replace('#', '')
  const safeHex = normalized.length === 3
    ? normalized.split('').map(ch => ch + ch).join('')
    : normalized

  const value = Number.parseInt(safeHex, 16)
  const r = (value >> 16) & 255
  const g = (value >> 8) & 255
  const b = value & 255

  const rNorm = r / 255
  const gNorm = g / 255
  const bNorm = b / 255

  const max = Math.max(rNorm, gNorm, bNorm)
  const min = Math.min(rNorm, gNorm, bNorm)
  const lightness = (max + min) / 2

  let hue = 0
  let saturation = 0

  if (max !== min) {
    const delta = max - min
    saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min)

    switch (max) {
      case rNorm:
        hue = (gNorm - bNorm) / delta + (gNorm < bNorm ? 6 : 0)
        break
      case gNorm:
        hue = (bNorm - rNorm) / delta + 2
        break
      default:
        hue = (rNorm - gNorm) / delta + 4
        break
    }

    hue *= 60
  }

  return `${Math.round(hue)} ${Math.round(saturation * 100)}% ${Math.round(lightness * 100)}%`
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme')
    if (stored === 'light' || stored === 'dark' || stored === 'custom') return stored
    return 'light'
  })

  const [customBackground, setCustomBackground] = useState<string>(() => {
    const stored = localStorage.getItem('theme_custom_background')
    return stored || DEFAULT_CUSTOM_COLOR
  })

  useEffect(() => {
    const root = document.documentElement
    const body = document.body
    const appRoot = document.getElementById('root')

    root.classList.remove('light', 'dark')
    const activeTheme = theme === 'custom' ? 'dark' : theme
    root.classList.add(activeTheme)

    const customHsl = hexToHsl(customBackground)
    const resolvedBackground = theme === 'custom' ? customHsl : theme === 'dark' ? '222.2 84% 4.9%' : '0 0% 100%'
    const resolvedCard = theme === 'custom' ? customHsl : theme === 'dark' ? '222.2 84% 4.9%' : '0 0% 100%'

    root.style.setProperty('--app-custom-background', customBackground)
    root.style.setProperty('--background', resolvedBackground)
    root.style.setProperty('--card', resolvedCard)
    root.style.setProperty('--popover', resolvedCard)

    const backgroundCss = theme === 'custom' ? customBackground : theme === 'dark' ? '#020817' : '#f8fafc'
    root.style.backgroundColor = backgroundCss
    body.style.background = backgroundCss
    body.style.backgroundColor = backgroundCss
    body.style.transition = 'background 180ms ease'

    if (appRoot) {
      appRoot.style.backgroundColor = backgroundCss
      appRoot.style.transition = 'background 180ms ease'
    }

    localStorage.setItem('theme', theme)
    localStorage.setItem('theme_custom_background', customBackground)
  }, [theme, customBackground])

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : prev === 'dark' ? 'light' : 'dark'))
  }

  return {
    theme,
    customBackground,
    setTheme,
    setCustomBackground,
    toggleTheme,
  }
}
