import { Briefcase, FileCheck, MessageSquare, Building2 } from 'lucide-react'
import { HiChevronRight } from 'react-icons/hi'
import Reveal from './Reveal'

const points = [
  {
    icon: FileCheck,
    title: 'Interview Preparation',
    text: 'Practice sessions to help students face interviews with confidence.',
  },
  {
    icon: MessageSquare,
    title: 'Career Guidance',
    text: 'Support to choose a path after COPA, DCA, PGDCA and skill courses.',
  },
  {
    icon: Building2,
    title: 'Local Opportunities',
    text: 'Guidance for computer, office and accounts roles in and around Narsinghpur.',
  },
  {
    icon: Briefcase,
    title: 'Job-Ready Skills',
    text: 'Lab practice, Tally, MS Office and workplace basics used in real jobs.',
  },
]

export default function Placement() {
  return (
    <section id="placement" className="scroll-mt-28 bg-[#f7f8fb] py-12 sm:py-16 lg:py-20">
      <div className="container-page">
        <Reveal className="text-center">
          <p className="section-kicker">Placement</p>
          <h2 className="section-title">100% Placement Assistance</h2>
          <p className="section-sub mx-auto">
            Job-oriented training with interview support and career guidance — so students can move from
            classroom practice to workplace confidence.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {points.map((item, i) => {
            const Icon = item.icon
            return (
              <Reveal key={item.title} delay={i * 70}>
                <article className="h-full rounded-2xl bg-white p-6 text-center shadow-[0_12px_30px_-16px_rgba(11,29,58,0.18)] ring-1 ring-slate-100">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-navy-900 text-gold">
                    <Icon className="h-6 w-6" strokeWidth={1.7} />
                  </div>
                  <h3 className="text-[15px] font-extrabold text-navy-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">{item.text}</p>
                </article>
              </Reveal>
            )
          })}
        </div>

        <Reveal delay={80} className="mt-10 text-center">
          <a href="#enquiry" className="btn-gold">
            Enquire About Placement <HiChevronRight className="text-lg" />
          </a>
        </Reveal>
      </div>
    </section>
  )
}
