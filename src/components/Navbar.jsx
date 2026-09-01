import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FiMenu, FiX } from 'react-icons/fi'
import { FaFacebookF, FaInstagram, FaYoutube, FaPhoneAlt, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa'
import { HiChevronRight } from 'react-icons/hi'
import { NAV_LINKS, PHONES, SITE, displayPhone, telLink } from '../data/site'
import logo from '../assets/tnslogo.png'

function sectionHref(href, onHome) {
  return onHome ? href : `/${href}`
}

export default function Navbar() {
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('#home')
  const onHome = location.pathname === '/'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!onHome) return undefined

    const updateActive = () => {
      const marker = window.scrollY + 160
      let current = '#home'
      let bestTop = -Infinity
      NAV_LINKS.forEach((link) => {
        const el = document.getElementById(link.href.slice(1))
        if (!el) return
        const top = el.getBoundingClientRect().top + window.scrollY
        if (top <= marker && top >= bestTop) {
          bestTop = top
          current = link.href
        }
      })
      setActive(current)
    }

    updateActive()
    window.addEventListener('scroll', updateActive, { passive: true })
    window.addEventListener('hashchange', updateActive)
    return () => {
      window.removeEventListener('scroll', updateActive)
      window.removeEventListener('hashchange', updateActive)
    }
  }, [onHome])

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1180) setOpen(false)
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

  const closeMenu = () => setOpen(false)

  return (
    <header className="sticky top-0 z-50">
      <div className="bg-navy-900 text-[11px] text-white sm:text-xs">
        <div className="container-page relative flex h-9 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3 sm:gap-5">
            <a href={telLink(PHONES.primary)} className="inline-flex shrink-0 items-center gap-1.5 hover:text-gold">
              <FaPhoneAlt className="text-[10px] text-gold" />
              <span>{displayPhone(PHONES.primary)}</span>
            </a>
            <a
              href={`mailto:${SITE.email}`}
              className="hidden min-w-0 items-center gap-1.5 hover:text-gold lg:inline-flex"
            >
              <FaEnvelope className="text-[10px] text-gold" />
              <span className="truncate">{SITE.email}</span>
            </a>
          </div>

          <p className="pointer-events-none absolute inset-0 hidden items-center justify-center gap-1.5 lg:flex">
            <FaMapMarkerAlt className="text-[10px] text-gold" />
            <span>
              {SITE.city}, Madhya Pradesh
            </span>
          </p>

          <div className="relative z-10 flex shrink-0 items-center gap-3">
            <Link to="/signin" className="hidden font-semibold text-white/85 hover:text-gold sm:inline">
              Student Login
            </Link>
            <a href={SITE.social.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="hover:text-gold">
              <FaFacebookF />
            </a>
            <a href={SITE.social.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="hover:text-gold">
              <FaInstagram />
            </a>
            <a href={SITE.social.youtube} target="_blank" rel="noreferrer" aria-label="YouTube" className="hover:text-gold">
              <FaYoutube />
            </a>
          </div>
        </div>
      </div>

      <div
        className={`border-b border-slate-100 bg-white transition-shadow duration-300 ${
          scrolled ? 'shadow-md shadow-navy-950/10' : 'shadow-sm'
        }`}
      >
        <div className="container-page flex min-h-[4.25rem] items-center justify-between gap-3 sm:min-h-[4.75rem]">
          <a href={sectionHref('#home', onHome)} className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <img
              src={logo}
              alt="TNS ITI & Computer logo"
              className="h-12 w-12 rounded-full bg-white object-contain p-0.5 shadow-sm ring-1 ring-slate-200 sm:h-14 sm:w-14"
            />
            <span className="min-w-0">
              <span className="block text-[13px] leading-tight font-extrabold tracking-tight text-navy-900 sm:text-[15px]">
                Thakur Niranjan Singh
              </span>
              <span className="block text-[11px] leading-tight font-semibold text-navy-800 sm:text-sm">
                I.T.I. &amp; Computer
              </span>
            </span>
          </a>

          <nav className="hidden items-center gap-0.5 min-[1180px]:flex" aria-label="Primary">
            {NAV_LINKS.map((link) => {
              const isActive = onHome && active === link.href
              return (
                <a
                  key={link.href}
                  href={sectionHref(link.href, onHome)}
                  className={`relative px-2.5 py-2 text-[13px] font-semibold transition ${
                    isActive ? 'text-navy-900' : 'text-navy-800/80 hover:text-navy-900'
                  }`}
                  onClick={() => setActive(link.href)}
                >
                  {link.label}
                  <span
                    className={`absolute inset-x-2.5 -bottom-0.5 h-[3px] rounded-full bg-gold transition ${
                      isActive ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                </a>
              )
            })}
          </nav>

          <div className="flex items-center gap-2">
            <a href={sectionHref('#enquiry', onHome)} className="btn-gold !min-h-10 hidden !px-4 !py-2 min-[1180px]:inline-flex">
              Enquiry Now <HiChevronRight className="text-lg" />
            </a>
            <button
              type="button"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-navy-900 min-[1180px]:hidden"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <FiX size={22} /> : <FiMenu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="min-[1180px]:hidden">
          <button
            type="button"
            className="fixed inset-0 top-[6.4rem] bg-navy-950/40"
            aria-label="Close menu overlay"
            onClick={closeMenu}
          />
          <nav
            className="thin-scroll relative mx-4 mt-3 mb-4 max-h-[calc(100dvh-7.5rem)] overflow-y-auto overscroll-contain rounded-2xl border border-slate-100 bg-white p-4 shadow-2xl"
            aria-label="Mobile"
          >
            <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-4">
              <img src={logo} alt="" className="h-12 w-12 rounded-full bg-white object-contain ring-1 ring-slate-200" />
              <div>
                <p className="font-bold text-navy-900">TNS ITI &amp; Computer</p>
                <p className="text-xs text-slate-500">Narsinghpur, Madhya Pradesh</p>
              </div>
            </div>
            <div className="grid gap-1">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={sectionHref(link.href, onHome)}
                  className={`rounded-xl px-3 py-3 text-sm font-semibold ${
                    onHome && active === link.href ? 'bg-gold-soft text-navy-900' : 'text-navy-800 hover:bg-slate-50'
                  }`}
                  onClick={() => {
                    setActive(link.href)
                    closeMenu()
                  }}
                >
                  {link.label}
                </a>
              ))}
            </div>
            <a href={sectionHref('#enquiry', onHome)} className="btn-gold mt-4 w-full" onClick={closeMenu}>
              Enquiry Now <HiChevronRight className="text-lg" />
            </a>
            <Link to="/signin" className="btn-navy mt-2 w-full" onClick={closeMenu}>
              Student Login
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
