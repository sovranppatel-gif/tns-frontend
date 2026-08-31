const THEME_KEY = 'tns_master_admin_theme'

export function readMasterTheme() {
  try {
    return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export function writeMasterTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    /* ignore */
  }
}

export const card = 'rounded-lg border border-slate-200 bg-white text-slate-800'

export const inputFocus = 'focus:border-navy-700 focus:outline-none focus:ring-2 focus:ring-brand-red/25'

export const primaryBtn =
  'inline-flex items-center gap-2 rounded-full bg-brand-red px-4 py-2 text-sm font-semibold text-white shadow-md shadow-brand-red/25 transition hover:-translate-y-0.5 hover:bg-brand-red-dark disabled:cursor-not-allowed disabled:opacity-70'

export const secondaryBtn =
  'inline-flex items-center gap-2 rounded-full border border-navy-900/20 bg-white px-4 py-2 text-sm font-medium text-navy-900 transition hover:border-brand-red/50 hover:text-brand-red disabled:cursor-not-allowed disabled:opacity-70'

export function getMasterShell(isDark) {
  if (isDark) {
    return {
      overlay: 'bg-navy-950/70',
      sidebar: 'border-white/10 bg-navy-950/95 backdrop-blur-xl',
      brandTitle: 'text-white',
      brandSub: 'text-gold',
      groupLabel: 'text-white/40',
      divider: 'bg-white/10',
      navInactive: 'text-white/70 hover:bg-white/5 hover:text-gold',
      navActive: 'bg-brand-red text-white shadow-sm',
      navChildActive: 'bg-white/10 text-gold',
      navChildInactive: 'text-white/60 hover:bg-white/5 hover:text-white',
      iconBtn: 'border-white/15 bg-white/5 text-white/80 hover:border-brand-red/50 hover:text-gold',
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
    divider: 'bg-navy-900/10',
    navInactive: 'text-navy-700 hover:bg-navy-900/5 hover:text-brand-red',
    navActive: 'bg-navy-900 text-white shadow-sm',
    navChildActive: 'bg-navy-900/10 text-navy-900',
    navChildInactive: 'text-navy-600 hover:bg-navy-900/5 hover:text-brand-red',
    iconBtn: 'border-navy-900/15 bg-white text-navy-700 hover:border-brand-red/40 hover:text-brand-red',
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

export const logoGlow = 'absolute inset-0 rounded-lg bg-brand-red/40 blur-md opacity-60'

export const logoBox =
  'relative rounded-lg border border-white/60 bg-white p-1.5 shadow-[0_10px_35px_rgba(196,30,58,0.25)]'

export const navActive = 'bg-brand-red text-white shadow-sm'
