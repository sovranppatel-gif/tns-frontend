import { GraduationCap, Users, Monitor, Briefcase, Building2, BadgeCheck } from 'lucide-react'

const stats = [
  { icon: GraduationCap, value: '20+', label: 'Years of Excellence' },
  { icon: Users, value: '2500+', label: 'Students Trained' },
  { icon: Monitor, value: '10+', label: 'Courses Offered' },
  { icon: Briefcase, value: '90%+', label: 'Placement Assistance' },
  { icon: Building2, value: '50+', label: 'Industry Tie-ups' },
  { icon: BadgeCheck, value: '1000+', label: 'Certified Students' },
]

export default function JourneyNumbers() {
  return (
    <section className="bg-[#f4f6f9] py-12 sm:py-14">
      <div className="container-page">
        <div className="mb-10 flex items-center justify-center gap-4">
          <span className="hidden h-px w-12 bg-gold sm:block" />
          <p className="section-kicker !mb-0 text-center">Our Journey in Numbers</p>
          <span className="hidden h-px w-12 bg-gold sm:block" />
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
          {stats.map((item) => {
            const Icon = item.icon
            return (
              <article key={item.label} className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-navy-900/15 bg-white text-navy-900">
                  <Icon className="h-5 w-5" strokeWidth={1.7} />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-extrabold text-navy-900 sm:text-2xl">{item.value}</p>
                  <p className="text-[12px] leading-snug text-slate-500">{item.label}</p>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
