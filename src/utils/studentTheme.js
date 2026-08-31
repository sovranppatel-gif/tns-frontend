const THEME_KEY = 'tns_student_theme'

export function readStudentTheme() {
  try {
    return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export function writeStudentTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    /* ignore */
  }
}

export function getStudentShell(isDark) {
  if (isDark) {
    return {
      overlay: 'bg-navy-950/70',
      sidebar: 'border-white/10 bg-navy-950/95 backdrop-blur-xl',
      brandTitle: 'text-white',
      brandSub: 'text-gold',
      groupLabel: 'text-white/40',
      navInactive: 'text-white/70 hover:bg-white/5 hover:text-gold',
      navActive: 'bg-brand-red text-white shadow-sm',
      iconBtn:
        'border-white/15 bg-white/5 text-white/80 hover:border-brand-red/50 hover:text-gold',
      mobileBar: 'border-white/10 bg-navy-950/80 text-white',
      search: 'border-white/15 bg-white/5 text-white/50',
      searchInput: 'text-white placeholder:text-white/40',
      dropdown: 'border-white/10 bg-navy-900 shadow-[0_18px_45px_rgba(0,0,0,0.45)]',
      dropdownMuted: 'text-white/50',
      dropdownItem: 'border-white/5 bg-white/5',
      dropdownText: 'text-white',
      dropdownMeta: 'text-white/40',
      menuItem: 'text-white/80 hover:bg-white/5 hover:text-gold',
      pageTitle: 'text-white',
      pageDesc: 'text-white/55',
      main: 'bg-navy-950',
    }
  }

  return {
    overlay: 'bg-navy-950/40',
    sidebar: 'border-navy-900/10 bg-white/95 backdrop-blur-xl',
    brandTitle: 'text-navy-900',
    brandSub: 'text-brand-red',
    groupLabel: 'text-slate-400',
    navInactive: 'text-navy-700 hover:bg-navy-900/5 hover:text-brand-red',
    navActive: 'bg-navy-900 text-white shadow-sm',
    iconBtn:
      'border-navy-900/15 bg-white text-navy-700 hover:border-brand-red/40 hover:text-brand-red',
    mobileBar: 'border-navy-900/10 bg-white/85 text-navy-900',
    search: 'border-navy-900/15 bg-slate-50 text-slate-500',
    searchInput: 'text-navy-900 placeholder:text-slate-400',
    dropdown: 'border-navy-900/10 bg-white shadow-[0_18px_45px_rgba(11,29,58,0.12)]',
    dropdownMuted: 'text-slate-500',
    dropdownItem: 'border-slate-100 bg-slate-50',
    dropdownText: 'text-navy-900',
    dropdownMeta: 'text-slate-400',
    menuItem: 'text-navy-800 hover:bg-navy-900/5 hover:text-brand-red',
    pageTitle: 'text-navy-900',
    pageDesc: 'text-slate-500',
    main: 'bg-[#eef1f6]',
  }
}
