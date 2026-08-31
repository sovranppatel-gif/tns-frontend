import { FaPhoneAlt, FaWhatsapp } from 'react-icons/fa'
import { HiArrowRight } from 'react-icons/hi'
import { PHONES, telLink, waLink } from '../data/site'
import Reveal from './Reveal'

export default function AdmissionBanner() {
  return (
    <section className="relative -mt-6 px-0 sm:-mt-10">
      <Reveal>
        <div className="container-page">
          <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-brand-red via-brand-red-dark to-navy-900 p-5 text-white shadow-xl sm:rounded-3xl sm:p-8 lg:p-10">
            <div className="flex flex-col items-start justify-between gap-5 lg:flex-row lg:items-center lg:gap-8">
              <div className="min-w-0">
                <span className="pulse-soft mb-3 inline-flex items-center rounded-full bg-gold px-3 py-1 text-xs font-extrabold tracking-wide text-navy-900 uppercase">
                  Admissions Open
                </span>
                <h2 className="text-xl font-extrabold tracking-tight break-words sm:text-4xl">
                  ADMISSION OPEN 2026–27
                </h2>
                <p className="mt-2 max-w-xl text-sm text-white/85 sm:text-base">
                  Start Your Journey Towards Skills, Knowledge &amp; Success
                </p>
              </div>
              <div className="flex w-full min-w-0 flex-col gap-3 md:w-auto md:flex-row md:flex-wrap">
                <a href="#enquiry" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-navy-900 transition hover:-translate-y-0.5 md:w-auto">
                  Apply Now <HiArrowRight />
                </a>
                <a
                  href={telLink(PHONES.primary)}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20 md:w-auto"
                >
                  <FaPhoneAlt /> Call Now
                </a>
                <a
                  href={waLink(PHONES.primary, 'Hello TNS ITI & Computer, I want to enquire about admission 2026–27.')}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 md:w-auto"
                >
                  <FaWhatsapp size={18} /> WhatsApp Enquiry
                </a>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
