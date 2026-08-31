import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FiMenu, FiX } from 'react-icons/fi'
import { NAV_LINKS } from '../data/site'
import logo from '../assets/tnslogo.png'

export default function Navbar() {
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const onHome = location.pathname === '/'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1280) setOpen(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const sectionHref = (href) => (onHome ? href : `/${href}`)

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-white/10 bg-navy-900/95 py-2 shadow-lg shadow-navy-950/20 backdrop-blur-md'
          : 'bg-navy-900/80 py-3.5 backdrop-blur-sm'
      }`}
    >
      <div className="container-page flex min-w-0 items-center justify-between gap-2 sm:gap-4">
        <Link to="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
          <img
            src={logo}
            alt="TNS ITI & Computer logo"
            className={`rounded-full bg-white object-contain p-0.5 shadow-sm transition-all duration-300 ${
              scrolled ? 'h-11 w-11' : 'h-12 w-12 sm:h-14 sm:w-14'
            }`}
          />
          <span className="min-w-0">
            <span className="block truncate text-sm font-extrabold tracking-wide text-white sm:text-base">
              TNS ITI &amp; Computer
            </span>
            <span className="hidden truncate text-[11px] text-white/70 sm:block">
              Thakur Niranjan Singh · Narsinghpur
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-0.5 xl:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={sectionHref(link.href)}
              className="rounded-full px-2.5 py-2 text-[13px] font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/signin" className="btn-primary hidden !px-5 !py-2.5 xl:inline-flex">
            Sign In / Sign Up
          </Link>
          <button
            type="button"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 text-white xl:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="xl:hidden">
          <button
            type="button"
            className="fixed inset-0 top-[4.25rem] bg-navy-950/50"
            aria-label="Close menu overlay"
            onClick={() => setOpen(false)}
          />
          <nav
            className="thin-scroll relative mx-4 mt-3 mb-4 max-h-[calc(100dvh-5.75rem)] overflow-y-auto overscroll-contain rounded-2xl border border-white/10 bg-navy-800 p-4 shadow-2xl"
            aria-label="Mobile"
          >
            <div className="mb-4 flex items-center gap-3 border-b border-white/10 pb-4">
              <img src={logo} alt="" className="h-12 w-12 rounded-full bg-white object-contain p-0.5" />
              <div>
                <p className="font-bold text-white">TNS ITI &amp; Computer</p>
                <p className="text-xs text-white/70">Narsinghpur, Madhya Pradesh</p>
              </div>
            </div>
            <div className="grid gap-1">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={sectionHref(link.href)}
                  className="rounded-xl px-3 py-3 text-sm font-semibold text-white/90 hover:bg-white/10"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </a>
              ))}
            </div>
            <Link to="/signin" className="btn-primary mt-4 w-full" onClick={() => setOpen(false)}>
              Sign In / Sign Up
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
