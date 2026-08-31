import { HiArrowRight } from 'react-icons/hi'
import { SITE } from '../data/site'
import EnquiryForm from './EnquiryForm'
import itiLogo from '../assets/itilogo.png'
import mcuLogo from '../assets/mcu.svg'
import skillIndiaLogo from '../assets/Skill_India.png'
import logoIti from '../assets/logoIti.png'

const partnerLogos = [
  { src: itiLogo, alt: 'Directorate of Skill Development, Madhya Pradesh — कौशलम' },
  { src: mcuLogo, alt: 'Makhanlal Chaturvedi National University of Journalism and Communication' },
  { src: skillIndiaLogo, alt: 'Skill India' },
  { src: logoIti, alt: 'Industrial Training Institute' },
]

export default function Hero() {
  return (
    <section
      id="home"
      className="hero-orbs relative overflow-hidden bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 pt-24 pb-16 text-white sm:pt-32 sm:pb-24 lg:pt-36 lg:pb-28"
    >
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div className="absolute top-24 left-[12%] hidden h-24 w-24 rounded-full border border-white/15 sm:block" />
        <div className="absolute right-[18%] bottom-20 hidden h-16 w-16 rounded-full border border-gold/40 sm:block" />
        <div className="absolute top-1/2 left-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/5 sm:h-72 sm:w-72" />
      </div>

      <div className="container-page relative grid items-center gap-8 sm:gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="min-w-0">
          <p className="reveal mb-4 inline-flex max-w-full items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold tracking-wide text-gold-soft sm:text-xs">
            Admissions Open 2026–27 · Narsinghpur
          </p>
          <h1 className="reveal reveal-delay-1 text-[1.7rem] font-extrabold leading-tight tracking-tight break-words sm:text-5xl lg:text-[3.2rem]">
            Thakur Niranjan Singh
            <span className="mt-1 block text-xl font-bold text-gold sm:text-4xl lg:text-[2.4rem]">
              I.T.I. &amp; Computer
            </span>
          </h1>
          <p className="reveal reveal-delay-2 mt-4 max-w-xl text-base font-semibold text-white sm:mt-5 sm:text-xl">
            {SITE.taglineHi}
          </p>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">
            Job-ready industrial training and computer education — COPA, DCA, PGDCA, Tally and more.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
            <a href="#enquiry" className="btn-primary w-full sm:w-auto">
              Apply for Admission
              <HiArrowRight />
            </a>
            <a href="#courses" className="btn-secondary w-full sm:w-auto">
              Explore Courses
            </a>
          </div>

          <div className="mt-8 max-w-lg sm:mt-10">
            <p className="mb-3 text-[11px] font-bold tracking-wider text-white/60 uppercase">
              Affiliated &amp; recognised with
            </p>
            <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
              {partnerLogos.map((logo) => (
                <div
                  key={logo.alt}
                  className="flex h-14 items-center justify-center rounded-2xl bg-white px-2 py-2 shadow-sm sm:h-16"
                >
                  <img src={logo.src} alt={logo.alt} className="h-full w-auto max-w-full object-contain" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div id="enquiry" className="relative mx-auto w-full min-w-0 max-w-lg scroll-mt-24 sm:scroll-mt-28">
          <EnquiryForm compact className="relative z-10 card-surface p-4 sm:p-7 shadow-2xl" />
        </div>
      </div>
    </section>
  )
}
