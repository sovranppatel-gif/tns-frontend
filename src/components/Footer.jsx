import { FaPhoneAlt, FaWhatsapp, FaMapMarkerAlt, FaGlobe } from 'react-icons/fa'
import { NAV_LINKS, PHONES, SITE, telLink, waLink } from '../data/site'
import logo from '../assets/tnslogo.png'

export default function Footer() {
  const links = NAV_LINKS.filter((l) => l.href !== '#home')

  return (
    <footer className="bg-navy-950 text-white">
      <div className="container-page grid gap-10 py-10 sm:grid-cols-2 sm:py-14 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3">
            <img src={logo} alt="TNS ITI & Computer logo" className="h-14 w-14 rounded-full bg-white object-contain p-0.5" />
            <div>
              <p className="font-extrabold">{SITE.shortName}</p>
              <p className="text-xs text-white/60">Thakur Niranjan Singh · Narsinghpur</p>
            </div>
          </div>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70">
            Industrial training, computer education and practical skill development. Learn today,
            build a brighter future — {SITE.taglineHi}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-extrabold tracking-wide text-gold uppercase">Quick Links</h3>
          <ul className="mt-4 space-y-2">
            {links.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="text-sm text-white/75 transition hover:text-white">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-extrabold tracking-wide text-gold uppercase">Contact</h3>
          <ul className="mt-4 space-y-3 text-sm text-white/75">
            <li className="flex gap-2">
              <FaMapMarkerAlt className="mt-0.5 shrink-0 text-brand-red" />
              <span className="break-words">{SITE.address}</span>
            </li>
            <li className="flex items-center gap-2">
              <FaPhoneAlt className="text-brand-red" />
              <a href={telLink(PHONES.primary)} className="hover:text-white">{PHONES.primary}</a>
            </li>
            <li className="flex items-center gap-2">
              <FaWhatsapp className="text-[#25D366]" />
              <a href={waLink(PHONES.primary)} target="_blank" rel="noreferrer" className="hover:text-white">
                WhatsApp {PHONES.primary}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <FaGlobe className="text-gold" />
              <a href={SITE.website} target="_blank" rel="noreferrer" className="hover:text-white">
                www.tnsiti.com
              </a>
            </li>
          </ul>
          <div className="mt-5 flex gap-3">
            <a
              href={telLink(PHONES.primary)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-brand-red"
              aria-label="Call TNS"
            >
              <FaPhoneAlt />
            </a>
            <a
              href={waLink(PHONES.primary)}
              target="_blank"
              rel="noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-[#25D366]"
              aria-label="WhatsApp TNS"
            >
              <FaWhatsapp />
            </a>
            <a
              href={SITE.mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-royal"
              aria-label="TNS location on Google Maps"
            >
              <FaMapMarkerAlt />
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-white/50">
        © 2026 TNS ITI &amp; Computer. All Rights Reserved.
      </div>
    </footer>
  )
}
