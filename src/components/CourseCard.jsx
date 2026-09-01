import { HiArrowRight } from 'react-icons/hi'

export default function CourseCard({ icon: Icon, title, subtitle, description, topics, meta, ctaHref = '#enquiry' }) {
  return (
    <article className="card-surface flex h-full min-w-0 flex-col p-5 sm:p-6 transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-navy-900 to-royal text-white">
        <Icon size={22} />
      </div>
      <h3 className="text-lg font-extrabold text-navy-900">{title}</h3>
      {subtitle && <p className="mt-1 text-sm font-semibold text-navy-700">{subtitle}</p>}
      <p className="mt-3 text-sm leading-relaxed text-slate-600">{description}</p>
      {meta && (
        <p className="mt-3 text-xs font-bold tracking-wide text-navy-700 uppercase">{meta}</p>
      )}
      <ul className="mt-4 flex flex-wrap gap-1.5">
        {topics.map((topic) => (
          <li
            key={topic}
            className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-navy-800"
          >
            {topic}
          </li>
        ))}
      </ul>
      <a href={ctaHref} className="btn-gold mt-6 w-full !py-2.5 sm:w-auto sm:self-start">
        Enquire Now <HiArrowRight />
      </a>
    </article>
  )
}
