import { Award, Cog, BadgeCheck, Users, Building2 } from 'lucide-react'
import Reveal from './Reveal'

const items = [
  {
    icon: Award,
    title: 'Experienced Faculty',
    text: 'Industry experienced trainers & mentors',
  },
  {
    icon: Cog,
    title: 'Practical Training',
    text: 'Hands-on training with real-world exposure',
  },
  {
    icon: BadgeCheck,
    title: 'Industry Recognized',
    text: 'Government recognized certifications',
  },
  {
    icon: Users,
    title: 'Placement Support',
    text: 'Interview preparation & placement assistance',
  },
  {
    icon: Building2,
    title: 'Modern Facilities',
    text: 'Well-equipped labs & smart classrooms',
  },
]

export default function WhyChooseUs() {
  return (
    <section id="facilities" className="scroll-mt-28 bg-white pt-8 pb-12 sm:pt-12 sm:pb-16 lg:pt-14 lg:pb-20">
      <div className="container-page">
        <div className="text-center">
          <p className="section-kicker">Why Choose TNS ITI & Computer?</p>
          <h2 className="section-title">Building Skills, Building Future</h2>
        </div>

        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-5 lg:gap-6">
          {items.map((item, i) => {
            const Icon = item.icon
            return (
              <Reveal key={item.title} delay={i * 70}>
                <article className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-navy-900">
                    <Icon className="h-7 w-7" strokeWidth={1.6} />
                  </div>
                  <h3 className="text-[15px] font-extrabold text-navy-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">{item.text}</p>
                </article>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
