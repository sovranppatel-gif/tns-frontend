import { useEffect } from 'react'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import CourseFeatureBar from '../components/CourseFeatureBar'
import About from '../components/About'
import Courses from '../components/Courses'
import Programs from '../components/Programs'
import Admission from '../components/Admission'
import WhyChooseUs from '../components/WhyChooseUs'
import Placement from '../components/Placement'
import Gallery from '../components/Gallery'
import Contact from '../components/Contact'
import Footer from '../components/Footer'
import FloatingButtons from '../components/FloatingButtons'

export default function Home() {
  useEffect(() => {
    const hash = window.location.hash
    if (!hash) return undefined
    const timer = window.setTimeout(() => {
      document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' })
    }, 80)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-dvh overflow-x-clip bg-white">
      <Navbar />
      <main>
        <Hero />
        <CourseFeatureBar />
        <WhyChooseUs />
        <About />
        <Courses />
        <Programs />
        <Admission />
        <Placement />
        <Gallery />
        <Contact />
      </main>
      <Footer />
      <FloatingButtons />
    </div>
  )
}
