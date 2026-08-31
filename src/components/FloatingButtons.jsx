import { FaPhoneAlt, FaWhatsapp } from 'react-icons/fa'
import { PHONES, telLink, waLink } from '../data/site'

export default function FloatingButtons() {
  return (
    <div className="fixed right-[max(0.75rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 flex flex-col gap-3 sm:right-6 sm:bottom-5">
      <a
        href={telLink(PHONES.primary)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-navy-900 text-white shadow-lg shadow-navy-950/30 transition hover:-translate-y-0.5 hover:bg-brand-red"
        aria-label={`Call ${PHONES.primary}`}
      >
        <FaPhoneAlt />
      </a>
      <a
        href={waLink(PHONES.primary, 'Hello TNS ITI & Computer, I want admission information.')}
        target="_blank"
        rel="noreferrer"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:-translate-y-0.5"
        aria-label={`WhatsApp ${PHONES.primary}`}
      >
        <FaWhatsapp size={22} />
      </a>
    </div>
  )
}
