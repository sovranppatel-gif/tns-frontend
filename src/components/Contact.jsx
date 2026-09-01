import { FaPhoneAlt, FaWhatsapp, FaMapMarkerAlt, FaEnvelope } from 'react-icons/fa'
import { PHONES, SITE, telLink, waLink } from '../data/site'
import Reveal from './Reveal'
import EnquiryForm from './EnquiryForm'

export default function Contact() {
  return (
    <section id="contact" className="scroll-mt-28 bg-[#f7f8fb] py-12 sm:py-16 lg:py-20">
      <div className="container-page grid gap-8 sm:gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <Reveal>
          <p className="section-kicker">Get in Touch</p>
          <h2 className="section-title">Visit or call us</h2>
          <p className="section-sub">
            Ram Colony, Narsinghpur. Prefer to write? Use the form — it opens a WhatsApp message with your details.
          </p>

          <ul className="mt-8 space-y-4">
            <li className="card-surface flex min-w-0 gap-3 p-4 sm:gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-red text-white">
                <FaMapMarkerAlt />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">Address</p>
                <p className="break-words font-semibold text-navy-900">{SITE.address}</p>
                <p className="mt-1 text-sm text-slate-500">{SITE.addressHint}</p>
              </div>
            </li>
            <li className="card-surface flex min-w-0 gap-3 p-4 sm:gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-gold">
                <FaPhoneAlt />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">Phone</p>
                <a className="block font-semibold text-navy-900 hover:text-brand-red" href={telLink(PHONES.primary)}>
                  {PHONES.primary}
                </a>
                <a className="block font-semibold text-navy-900 hover:text-brand-red" href={telLink(PHONES.secondary)}>
                  {PHONES.secondary}
                </a>
              </div>
            </li>
            <li className="card-surface flex min-w-0 gap-3 p-4 sm:gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#25D366] text-white">
                <FaWhatsapp />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">WhatsApp</p>
                <a
                  className="font-semibold text-navy-900 hover:text-brand-red"
                  href={waLink(PHONES.primary)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {PHONES.primary}
                </a>
              </div>
            </li>
            <li className="card-surface flex min-w-0 gap-3 p-4 sm:gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-royal text-white">
                <FaEnvelope />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">Email</p>
                <a className="font-semibold text-navy-900 hover:text-brand-red" href={`mailto:${SITE.email}`}>
                  {SITE.email}
                </a>
              </div>
            </li>
          </ul>

          <a
            href={SITE.mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-outline mt-6 w-full sm:w-auto"
          >
            <FaMapMarkerAlt /> Open in Google Maps
          </a>
        </Reveal>

        <Reveal delay={100}>
          <div id="enquiry" className="scroll-mt-32">
            <EnquiryForm />
          </div>
        </Reveal>
      </div>
    </section>
  )
}
