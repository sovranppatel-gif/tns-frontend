import { Monitor, Laptop, FileText, Briefcase } from 'lucide-react'

const items = [
  {
    href: '#courses',
    icon: Monitor,
    title: 'COPA',
    text: 'Computer Operator & Programming Assistant',
  },
  {
    href: '#courses',
    icon: Laptop,
    title: 'DCA',
    text: 'Diploma in Computer Application',
  },
  {
    href: '#courses',
    icon: FileText,
    title: 'PGDCA',
    text: 'Post Graduate Diploma in Computer Application',
  },
  {
    href: '#courses',
    title: 'Tally',
    text: 'TallyPrime with GST & Accounting',
    tally: true,
  },
  {
    href: '#placement',
    icon: Briefcase,
    title: 'Placement',
    text: '100% Placement Assistance',
  },
]

export default function CourseFeatureBar() {
  return (
    <section className="relative z-20 -mt-16 px-4 sm:-mt-20 lg:-mt-24" aria-label="Featured courses">
      <div className="container-page">
        <div className="grid gap-6 rounded-3xl bg-white px-5 py-7 shadow-[0_18px_50px_-18px_rgba(11,29,58,0.28)] sm:grid-cols-2 sm:px-7 lg:grid-cols-5 lg:gap-5 lg:px-8 lg:py-8">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <a key={item.title} href={item.href} className="group flex flex-col items-start text-left">
                {item.tally ? (
                  <span className="flex h-8 w-8 items-center justify-center rounded bg-[#c41e3a] text-[11px] font-black text-white">
                    T
                  </span>
                ) : (
                  <Icon className="h-8 w-8 text-navy-900" strokeWidth={1.6} />
                )}
                <h3 className="mt-3 text-base font-extrabold tracking-wide text-navy-900">{item.title}</h3>
                <span className="mt-2 h-[3px] w-11 rounded-full bg-gold transition-all group-hover:w-16" />
                <p className="mt-2 text-[13px] leading-snug text-slate-500">{item.text}</p>
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}
