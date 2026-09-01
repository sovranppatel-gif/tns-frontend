import { SITE } from '../../data/site'
import campus from '../../assets/bg-2.png'

export default function AboutHero() {
  return (
    <section className="relative isolate overflow-hidden bg-navy-900">
      <img
        src={campus}
        alt="Thakur Niranjan Singh I.T.I. & Computer campus, Narsinghpur"
        className="absolute inset-0 h-full w-full object-cover object-[68%_center]"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-navy-900 via-navy-900/90 to-navy-900/25 lg:hidden" />
      <div className="about-hero-gold" aria-hidden="true" />
      <div className="about-hero-navy" aria-hidden="true" />

      <div className="container-page relative z-10 flex min-h-[16.5rem] items-center py-10 sm:min-h-[20rem] sm:py-14 lg:min-h-[22rem] lg:py-16">
        <div className="max-w-lg">
          <h2 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            About <span className="text-gold">Us</span>
          </h2>
          <p className="mt-5 text-base font-semibold text-gold sm:text-lg">{SITE.taglineHi}</p>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-white/85 sm:text-[15px]">
            Empowering students with industry-oriented skills, quality education and strong values for a
            better tomorrow.
          </p>
        </div>
      </div>
    </section>
  )
}
