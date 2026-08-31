import { FaCheckCircle } from 'react-icons/fa'
import { HiArrowRight } from 'react-icons/hi'
import computerPoster from '../assets/tns-image-1.png'
import itiPoster from '../assets/tns-image-2.jpeg'
import Reveal from './Reveal'

const tracks = [
  {
    id: 'iti',
    kicker: 'Industrial Training',
    title: 'ITI — COPA',
    text: 'NCVT approved Computer Operator & Programming Assistant trade with one-year practical, lab-based training after 10th.',
    points: ['NCVT approved COPA trade', 'Duration: 1 year · After 10th', 'MS Office, typing and programming basics', 'Career-oriented computer lab work'],
    image: itiPoster,
    alt: 'Thakur Niranjan Singh ITI Narsinghpur COPA admission poster',
    href: '#courses',
    cta: 'View COPA course',
    accent: 'text-brand-red',
  },
  {
    id: 'computer',
    kicker: 'Computer Education',
    title: 'Computer Diplomas & Skills',
    text: 'DCA, PGDCA and short computer courses after 12th or graduation — office tools, Tally, data entry and CPCT, with Hindi and English medium.',
    points: ['DCA after 12th · PGDCA after graduation', 'Tally Prime, Data Entry and CPCT', 'MS Office and computer fundamentals', 'Practical lab training'],
    image: computerPoster,
    alt: 'TNS Computer DCA and PGDCA admission promotional image',
    href: '#courses',
    cta: 'View computer courses',
    accent: 'text-royal',
  },
]

export default function Programs() {
  return (
    <section id="programs" className="bg-white py-12 sm:py-16 lg:py-20">
      <div className="container-page">
        <Reveal>
          <p className="section-kicker">Two Learning Paths</p>
          <h2 className="section-title">ITI and Computer Education</h2>
          <p className="section-sub">
            Choose industrial training through COPA, or computer diplomas and skill courses — both with hands-on practice at TNS, Narsinghpur.
          </p>
        </Reveal>

        <div className="mt-8 grid gap-5 sm:mt-10 sm:gap-6 lg:grid-cols-2">
          {tracks.map((track, i) => (
            <Reveal key={track.id} delay={i * 90}>
              <article id={track.id} className="card-surface flex h-full min-w-0 flex-col overflow-hidden scroll-mt-24">
                <figure className="h-44 overflow-hidden sm:h-60">
                  <img src={track.image} alt={track.alt} className="h-full w-full object-cover object-top" />
                </figure>
                <div className="flex flex-1 flex-col p-5 sm:p-7">
                  <p className="text-xs font-bold tracking-wider text-slate-500 uppercase">{track.kicker}</p>
                  <h3 className="mt-1 text-lg font-extrabold text-navy-900 sm:text-xl">{track.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{track.text}</p>
                  <ul className="mt-5 space-y-2.5">
                    {track.points.map((point) => (
                      <li key={point} className="flex items-start gap-2.5 text-sm text-navy-800">
                        <FaCheckCircle className={`mt-0.5 shrink-0 ${track.accent}`} />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                  <a href={track.href} className="btn-outline mt-6 w-full !py-2.5 sm:w-auto sm:self-start">
                    {track.cta} <HiArrowRight />
                  </a>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
