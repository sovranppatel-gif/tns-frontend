import { Users, GraduationCap, Target, Award } from 'lucide-react'
import Reveal from '../Reveal'

const features = [
  {
    icon: Users,
    title: 'Experienced Faculty',
    text: 'Industry-experienced trainers focused on practical, job-ready learning.',
    tone: 'navy',
  },
  {
    icon: GraduationCap,
    title: 'Quality Education',
    text: 'NCVT COPA, DCA, PGDCA and computer skills with structured lab work.',
    tone: 'gold',
  },
  {
    icon: Target,
    title: 'Our Mission',
    text: 'To empower students with skills, discipline and confidence for careers.',
    tone: 'navy',
  },
  {
    icon: Award,
    title: 'Our Vision',
    text: 'Skilled youth and brighter futures from Narsinghpur and beyond.',
    tone: 'gold',
  },
]

export default function WhoWeAre() {
  return (
    <section className="bg-white py-12 sm:py-16 lg:py-20">
      <div className="container-page grid items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
        <Reveal>
          <p className="section-kicker">Who We Are</p>
          <h2 className="section-title">Building Skills. Building Bright Futures.</h2>
          <p className="section-sub">
            Thakur Niranjan Singh I.T.I. &amp; Computer, Narsinghpur, has been helping students learn
            practical computer and industrial skills since 2003. We combine classroom teaching with
            hands-on lab practice in a disciplined, student-friendly environment.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
            Programmes include NCVT COPA, DCA, PGDCA, Tally, Data Entry and CPCT. Computer diploma
            pathways are promoted in association with Makhanlal Chaturvedi National University of
            Journalism and Communication, Bhopal. Hindi and English medium batches are available,
            including batches for female students.
          </p>
        </Reveal>

        <Reveal delay={100}>
          <div className="grid grid-cols-2 gap-6 rounded-2xl bg-white p-6 shadow-[0_16px_40px_-18px_rgba(11,29,58,0.22)] ring-1 ring-slate-100 sm:p-8 lg:gap-5 lg:p-7">
            {features.map((item) => {
              const Icon = item.icon
              const iconWrap =
                item.tone === 'gold' ? 'bg-gold text-navy-900' : 'bg-navy-900 text-white'
              return (
                <article key={item.title} className="flex flex-col items-center text-center">
                  <div className={`mb-3 flex h-14 w-14 items-center justify-center rounded-full ${iconWrap}`}>
                    <Icon className="h-6 w-6" strokeWidth={1.8} />
                  </div>
                  <h3 className="text-sm font-extrabold text-navy-900">{item.title}</h3>
                  <p className="mt-2 text-[12px] leading-relaxed text-slate-500">{item.text}</p>
                </article>
              )
            })}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
