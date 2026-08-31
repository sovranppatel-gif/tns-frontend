import { FaChalkboardTeacher, FaDesktop, FaHandsHelping, FaBriefcase, FaWifi, FaUsers } from 'react-icons/fa'
import Reveal from './Reveal'

const items = [
  {
    icon: FaChalkboardTeacher,
    title: 'Experienced trainers',
    text: 'Qualified faculty focused on practical, job-oriented learning.',
  },
  {
    icon: FaDesktop,
    title: 'Computer lab practice',
    text: 'Hands-on training with individual computer practice.',
  },
  {
    icon: FaHandsHelping,
    title: 'Learn by doing',
    text: 'Course work built around lab exercises, not theory alone.',
  },
  {
    icon: FaWifi,
    title: 'Internet & office skills',
    text: 'Email, internet and office applications as part of training.',
  },
  {
    icon: FaBriefcase,
    title: 'Career guidance',
    text: 'Support to choose a path after COPA, DCA, PGDCA and skill courses.',
  },
  {
    icon: FaUsers,
    title: 'Student-friendly batches',
    text: 'Hindi & English medium, with separate batches for housewives and female students.',
  },
]

export default function WhyChooseUs() {
  return (
    <section className="bg-gradient-to-b from-navy-950 to-navy-800 py-12 text-white sm:py-16 lg:py-20">
      <div className="container-page">
        <Reveal>
          <p className="section-kicker !bg-white/10 !text-gold-soft">Why TNS</p>
          <h2 className="section-title text-white">Why students choose TNS</h2>
          <p className="section-sub text-white/70">
            Lab practice, experienced trainers and a supportive campus — all in one place in Narsinghpur.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => {
            const Icon = item.icon
            return (
              <Reveal key={item.title} delay={i * 70}>
                <article className="h-full rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition hover:bg-white/10 sm:p-6">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-red text-white">
                    <Icon />
                  </div>
                  <h3 className="text-lg font-bold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/75">{item.text}</p>
                </article>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
