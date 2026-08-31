import { SITE } from '../data/site'
import logo from '../assets/tnslogo.png'
import Reveal from './Reveal'

const points = [
  'Industrial Training',
  'Computer Education',
  'Practical Labs',
  'Career Guidance',
  'Hindi & English Medium',
  'Batches for Female Students',
]

export default function About() {
  return (
    <section id="about" className="py-12 sm:py-16 lg:py-20">
      <div className="container-page grid items-center gap-8 sm:gap-12 lg:grid-cols-[0.85fr_1.15fr]">
        <Reveal>
          <div className="relative mx-auto w-full max-w-sm">
            <div className="absolute -inset-2 rounded-[2rem] bg-gradient-to-br from-navy-900/10 via-royal/10 to-brand-red/10 sm:-inset-3" />
            <div className="card-surface relative p-6 sm:p-8">
              <img src={logo} alt="TNS institute logo" className="mx-auto w-40 sm:w-52" />
              <p className="mt-4 text-center text-sm font-semibold text-navy-800">
                Serving students since {SITE.since}
              </p>
              <p className="mt-1 text-center text-xs text-slate-500">{SITE.motto}</p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <p className="section-kicker">About the Institute</p>
          <h2 className="section-title">A skill institute in Narsinghpur</h2>
          <p className="section-sub">
            TNS ITI &amp; Computer offers industrial training and computer education in a disciplined,
            student-friendly environment. Programmes include NCVT COPA, DCA, PGDCA, Tally, Data Entry
            and CPCT — with practical lab work at the centre.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
            Computer diploma programmes are promoted in association with Makhanlal Chaturvedi National
            University of Journalism and Communication, Bhopal, as shown in the institute’s admission
            material.
          </p>
          <ul className="mt-6 flex flex-wrap gap-2">
            {points.map((item) => (
              <li
                key={item}
                className="rounded-full border border-navy-900/10 bg-white px-3 py-1.5 text-xs font-semibold text-navy-800 shadow-sm"
              >
                {item}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}
