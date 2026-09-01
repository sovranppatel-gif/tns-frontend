import { GraduationCap } from 'lucide-react'
import { HiChevronRight } from 'react-icons/hi'
import { SITE } from '../data/site'
import heroBg from '../assets/bg-1.png'

export default function Hero() {
  return (
    <section id="home" className="relative overflow-hidden bg-white">
      <img
        src={heroBg}
        alt="Students training in the TNS computer laboratory"
        className="absolute inset-0 h-full w-full object-cover object-[78%_center] sm:object-[72%_center] lg:object-right"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/95 via-white/80 to-white/40 sm:hidden" />
      <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-[46%] bg-gradient-to-r from-white/80 via-white/35 to-transparent sm:block lg:w-[40%]" />

      <div className="container-page relative z-10 flex min-h-[26rem] items-center py-12 pb-24 sm:min-h-[30rem] sm:py-16 sm:pb-28 lg:min-h-[32rem] lg:py-16 lg:pb-32">
        <div className="max-w-xl lg:max-w-[34rem]">
          <h1 className="reveal text-[1.85rem] leading-[1.15] font-extrabold tracking-tight text-navy-900 sm:text-4xl lg:text-[2.65rem]">
            Thakur Niranjan Singh I.T.I. &amp; Computer
          </h1>
          <p className="reveal reveal-delay-1 mt-4 text-base font-semibold text-navy-800 sm:text-xl">
            {SITE.taglineHi}
          </p>
          <p className="reveal reveal-delay-2 mt-3 max-w-lg text-sm leading-relaxed text-slate-600 sm:text-[15px]">
            Job-ready industrial training and computer education — COPA, DCA, PGDCA, Tally and more.
          </p>

          <div className="reveal reveal-delay-3 mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a href="#courses" className="btn-navy w-full sm:w-auto">
              Explore Courses <HiChevronRight className="text-lg" />
            </a>
            <a href="#enquiry" className="btn-gold w-full sm:w-auto">
              Enquiry Now <HiChevronRight className="text-lg" />
            </a>
          </div>
        </div>
      </div>

      <div className="absolute top-[42%] right-6 z-10 hidden -translate-y-1/2 lg:block xl:right-16">
        <div className="w-[11.5rem] rounded-2xl bg-navy-900/80 px-5 py-5 text-white shadow-xl backdrop-blur-sm">
          <GraduationCap className="mb-2 h-7 w-7 text-gold" strokeWidth={1.8} />
          <p className="text-3xl leading-none font-extrabold text-gold">100%</p>
          <p className="mt-1.5 text-sm leading-snug font-medium">Job Oriented Training</p>
        </div>
      </div>
    </section>
  )
}
