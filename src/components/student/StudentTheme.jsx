import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { STUDENT_THEME_KEY } from '../../utils/studentHelpers.js'

const StudentThemeContext = createContext(null)

function readStoredTheme() {
  try {
    return localStorage.getItem(STUDENT_THEME_KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

export function StudentThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readStoredTheme)

  useEffect(() => {
    try {
      localStorage.setItem(STUDENT_THEME_KEY, theme)
    } catch {
      /* ignore */
    }
  }, [theme])

  const setTheme = useCallback((next) => {
    setThemeState(typeof next === 'function' ? next : () => next)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((t) => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === 'dark',
      setTheme,
      toggleTheme,
    }),
    [theme, setTheme, toggleTheme],
  )

  return <StudentThemeContext.Provider value={value}>{children}</StudentThemeContext.Provider>
}

export function useStudentTheme() {
  const ctx = useContext(StudentThemeContext)
  if (!ctx) {
    throw new Error('useStudentTheme must be used within StudentThemeProvider')
  }
  return ctx
}

/** Shell class tokens for student portal dark / light modes */
export function getStudentShell(isDark) {
  if (isDark) {
    return {
      root: 'bg-[#06151C] text-slate-100',
      glow: 'bg-[radial-gradient(circle_at_top,_rgba(0,168,150,0.18),transparent_55%),radial-gradient(circle_at_bottom,_rgba(255,94,20,0.16),transparent_55%)]',
      grid: 'bg-[linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.06)_1px,transparent_1px)]',
      overlay: 'bg-[#06151C]/70',
      sidebar: 'border-[#00A896]/30 bg-[#06151C]/95 backdrop-blur-xl',
      brandTitle: 'text-white',
      brandSub: 'text-[#FF7A00]',
      groupLabel: 'text-slate-500',
      navInactive: 'text-slate-300 hover:bg-white/5 hover:text-[#FF5E14]',
      iconBtn:
        'border-[#00A896]/35 bg-white/5 text-slate-200 hover:border-[#FF5E14]/50 hover:text-[#FF5E14]',
      sticky: 'bg-[#06151C]/95',
      mobileBar: 'border-[#00A896]/30 bg-[#06151C]/60 text-white',
      mobileTitle: 'text-white',
      chip: 'border-[#00A896]/35 bg-white/5 text-slate-300',
      search:
        'border-[#00A896]/35 bg-[#06151C]/60 text-slate-400',
      searchInput: 'text-slate-200 placeholder:text-slate-500',
      dropdown: 'border-[#00A896]/30 bg-[#06151C] shadow-[0_18px_45px_rgba(0,0,0,0.45)]',
      dropdownMuted: 'text-slate-400',
      dropdownItem: 'border-white/5 bg-white/5',
      dropdownText: 'text-slate-200',
      dropdownMeta: 'text-slate-500',
      menuItem: 'text-slate-200 hover:bg-white/5 hover:text-[#FF5E14]',
      pageTitle: 'text-white',
      pageDesc: 'text-slate-400',
    }
  }

  return {
    root: 'bg-[#E8F0F2] text-slate-800',
    glow: 'bg-[radial-gradient(circle_at_top,_rgba(0,168,150,0.12),transparent_55%),radial-gradient(circle_at_bottom,_rgba(255,94,20,0.08),transparent_55%)]',
    grid: 'bg-[linear-gradient(to_right,rgba(0,168,150,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.04)_1px,transparent_1px)]',
    overlay: 'bg-slate-900/40',
    sidebar: 'border-[#00A896]/25 bg-white/90 backdrop-blur-xl',
    brandTitle: 'text-slate-900',
    brandSub: 'text-[#FF5E14]',
    groupLabel: 'text-slate-400',
    navInactive: 'text-slate-600 hover:bg-[#00A896]/8 hover:text-[#FF5E14]',
    iconBtn:
      'border-[#00A896]/30 bg-white text-slate-600 hover:border-[#FF5E14]/50 hover:text-[#FF5E14]',
    sticky: 'bg-[#E8F0F2]/95',
    mobileBar: 'border-[#00A896]/25 bg-white/80 text-slate-800',
    mobileTitle: 'text-slate-900',
    chip: 'border-[#00A896]/30 bg-[#00A896]/8 text-slate-600',
    search: 'border-[#00A896]/30 bg-white/80 text-slate-500',
    searchInput: 'text-slate-800 placeholder:text-slate-400',
    dropdown: 'border-[#00A896]/25 bg-white shadow-[0_18px_45px_rgba(6,21,28,0.12)]',
    dropdownMuted: 'text-slate-500',
    dropdownItem: 'border-slate-100 bg-slate-50',
    dropdownText: 'text-slate-800',
    dropdownMeta: 'text-slate-400',
    menuItem: 'text-slate-700 hover:bg-[#00A896]/8 hover:text-[#FF5E14]',
    pageTitle: 'text-slate-900',
    pageDesc: 'text-slate-500',
  }
}
