import { FaIdCard, FaFileAlt, FaImage, FaListAlt, FaCertificate } from 'react-icons/fa'
import Reveal from './Reveal'

const steps = [
  { n: '01', title: 'Enquiry', text: 'Call, WhatsApp or submit the form with your details.' },
  { n: '02', title: 'Course Selection', text: 'Pick COPA, DCA, PGDCA or a computer skill course.' },
  { n: '03', title: 'Documents', text: 'Bring the required documents to the institute.' },
  { n: '04', title: 'Confirmation', text: 'Complete admission and start your training.' },
]

const docs = [
  { icon: FaFileAlt, title: '10th Marksheet', note: 'Required for ITI COPA' },
  { icon: FaIdCard, title: 'Aadhaar Card', note: 'Identity document' },
  { icon: FaImage, title: 'Photograph', note: 'Recent passport size' },
  { icon: FaListAlt, title: 'Samagra ID', note: 'As applicable' },
  { icon: FaCertificate, title: 'Caste Certificate', note: 'Where applicable' },
]

export default function Admission() {
  return (
    <section id="admission" className="scroll-mt-28 bg-[#f7f8fb] py-12 sm:py-16 lg:py-20">
      <div className="container-page">
        <Reveal>
          <p className="section-kicker">How to Join</p>
          <h2 className="section-title">Admission Process</h2>
          <p className="section-sub">Four simple steps from enquiry to confirmed admission for 2026–27.</p>
        </Reveal>

        <div className="relative mt-8 grid gap-8 sm:mt-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="pointer-events-none absolute top-8 right-10 left-10 hidden h-0.5 bg-gradient-to-r from-navy-900 via-royal to-brand-red lg:block" />
          {steps.map((step, i) => (
            <Reveal key={step.n} delay={i * 80}>
              <div className="relative text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-navy-900 text-lg font-extrabold text-gold shadow-lg ring-4 ring-white">
                  {step.n}
                </div>
                <h3 className="text-lg font-bold text-navy-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.text}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={80}>
          <div className="mt-10 rounded-2xl border border-slate-100 bg-white p-5 sm:mt-14 sm:rounded-3xl sm:p-8">
            <h3 className="text-lg font-extrabold text-navy-900">Documents to bring</h3>
            <p className="mt-1 text-sm text-slate-500">
              Listed in the institute’s ITI admission material. Caste certificate is needed only where applicable.
            </p>
            <div className="mt-6 grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
              {docs.map((doc) => {
                const Icon = doc.icon
                return (
                  <article key={doc.title} className="rounded-2xl bg-slate-50 p-4 text-center">
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-navy-900 text-gold">
                      <Icon />
                    </div>
                    <h4 className="text-sm font-bold text-navy-900">{doc.title}</h4>
                    <p className="mt-1 text-xs text-slate-500">{doc.note}</p>
                  </article>
                )
              })}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
