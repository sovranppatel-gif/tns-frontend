import { HiChevronRight } from 'react-icons/hi'
import Reveal from '../Reveal'
import campus from '../../assets/bg-2.png'
import lab from '../../assets/bg-1.png'
import practice from '../../assets/bg-3.png'

const milestones = [
  {
    year: '2003',
    title: 'The Beginning',
    text: 'TNS started computer education in Narsinghpur with a focus on practical skills.',
    image: campus,
    alt: 'TNS ITI & Computer campus building',
  },
  {
    year: '2010',
    title: 'Growing Stronger',
    text: 'Labs, batches and computer diploma pathways expanded for more learners.',
    image: lab,
    alt: 'Students training in the TNS computer laboratory',
  },
  {
    year: '2017',
    title: 'Expanding Opportunities',
    text: 'ITI COPA and job-oriented courses strengthened career-ready training.',
    image: practice,
    alt: 'Student during practical computer training at TNS',
  },
  {
    year: '2024+',
    title: 'Shaping Futures',
    text: 'Continuing to train students with modern labs, guidance and placement support.',
    image: lab,
    alt: 'TNS students in a modern computer lab',
    position: 'object-[80%_center]',
  },
]

export default function OurHistory() {
  return (
    <section className="bg-white py-12 sm:py-16 lg:py-20">
      <div className="container-page grid items-start gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
        <Reveal>
          <p className="section-kicker">Our History</p>
          <h2 className="section-title">From Vision to Impact</h2>
          <p className="section-sub">
            What began as a commitment to skill education in Narsinghpur has grown into an institute
            known for COPA, computer diplomas and hands-on training. Year after year, students have
            walked in to learn — and walked out more confident for work and higher study.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
            We stay focused on the same idea that started this journey: knowledge becomes skill, and
            skill builds a brighter future. That is why labs, experienced trainers and student support
            remain at the centre of TNS ITI &amp; Computer.
          </p>
        </Reveal>

        <div className="grid grid-cols-2 gap-5 sm:gap-6 lg:grid-cols-4 lg:gap-5">
          {milestones.map((item, index) => (
            <Reveal key={item.year} delay={index * 80} className="relative">
              {index < milestones.length - 1 && (
                <HiChevronRight className="pointer-events-none absolute top-[3.35rem] -right-3 z-10 hidden text-xl text-navy-900 lg:block" />
              )}
              <article>
                <figure className="relative overflow-hidden rounded-xl shadow-md">
                  <img
                    src={item.image}
                    alt={item.alt}
                    className={`h-28 w-full object-cover sm:h-32 ${item.position || 'object-center'}`}
                  />
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rounded bg-navy-900 px-2.5 py-0.5 text-[11px] font-bold text-white">
                    {item.year}
                  </span>
                </figure>
                <h3 className="mt-5 text-sm font-extrabold text-navy-900">{item.title}</h3>
                <p className="mt-1 text-[12px] leading-relaxed text-slate-500">{item.text}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
