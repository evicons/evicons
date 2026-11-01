import { useEffect } from 'react'

type Theme = 'light' | 'dark'

function storedTheme(): Theme | null {
  try {
    const value = localStorage.getItem('theme')
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    return null
  }
}

// The label does not depend on the theme and the glyphs switch via CSS (`dark:` variant on
// data-theme), so the server-rendered button is already correct before hydration.
export default function ThemeToggle() {
  useEffect(() => {
    // Follow the system setting as long as no explicit choice is stored.
    const media = matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      if (!storedTheme()) document.documentElement.dataset.theme = media.matches ? 'dark' : 'light'
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  function toggle() {
    const next: Theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem('theme', next)
    } catch {}
  }

  const glyph = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  } as const

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle colour theme"
      title="Toggle colour theme"
      className="inline-flex size-8 items-center justify-center rounded-md text-muted hover:bg-surface hover:text-fg"
    >
      {/* Sun: light theme */}
      <svg {...glyph} className="theme-glyph-light block dark:hidden">
        <circle cx="12" cy="12" r="3.5" />
        <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
      </svg>
      {/* Moon: dark theme */}
      <svg {...glyph} className="theme-glyph-dark hidden dark:block">
        <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
      </svg>
    </button>
  )
}
