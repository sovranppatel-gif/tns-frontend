import { useEffect, useState } from 'react'
import { FiX } from 'react-icons/fi'
import img1 from '../assets/tns-image-1.png'
import img2 from '../assets/tns-image-2.jpeg'
import img3 from '../assets/tns-image-3.png'
import Reveal from './Reveal'

const images = [
  {
    src: img1,
    alt: 'TNS Computer admission promotion — DCA, PGDCA and COPA courses',
    caption: 'Computer & Diploma Admissions',
  },
  {
    src: img2,
    alt: 'Thakur Niranjan Singh ITI Narsinghpur COPA admission 2026–27',
    caption: 'ITI COPA Admission 2026–27',
  },
  {
    src: img3,
    alt: 'TNS Computer and ITI course highlights — PGDCA, DCA and ITI-COPA',
    caption: 'TNS Computer & ITI Highlights',
  },
]

export default function Gallery() {
  const [active, setActive] = useState(null)

  useEffect(() => {
    if (active === null) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') setActive(null)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [active])

  return (
    <section id="gallery" className="bg-white py-12 sm:py-16 lg:py-20">
      <div className="container-page">
        <Reveal>
          <p className="section-kicker">Highlights</p>
          <h2 className="section-title">Gallery</h2>
          <p className="section-sub">Admission and course highlights from TNS ITI &amp; Computer.</p>
        </Reveal>

        <div className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image, index) => (
            <Reveal key={image.alt} delay={index * 80}>
              <button
                type="button"
                onClick={() => setActive(index)}
                className="group relative block w-full overflow-hidden rounded-2xl shadow-lg"
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy-950/80 to-transparent p-3 text-left text-sm font-semibold text-white sm:p-4">
                  {image.caption}
                </span>
              </button>
            </Reveal>
          ))}
        </div>
      </div>

      {active !== null && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-navy-950/85 p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
          onClick={() => setActive(null)}
        >
          <button
            type="button"
            className="absolute top-[max(0.75rem,env(safe-area-inset-top))] right-[max(0.75rem,env(safe-area-inset-right))] rounded-full bg-white p-2 text-navy-900"
            aria-label="Close preview"
            onClick={() => setActive(null)}
          >
            <FiX size={22} />
          </button>
          <img
            src={images[active].src}
            alt={images[active].alt}
            className="max-h-[min(88vh,100dvh)] max-w-full rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </section>
  )
}
