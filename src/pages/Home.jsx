import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import AdmissionBanner from '../components/AdmissionBanner'
import About from '../components/About'
import Courses from '../components/Courses'
import Programs from '../components/Programs'
import WhyChooseUs from '../components/WhyChooseUs'
import Gallery from '../components/Gallery'
import Admission from '../components/Admission'
import Contact from '../components/Contact'
import Footer from '../components/Footer'
import FloatingButtons from '../components/FloatingButtons'

export default function Home() {
  return (
    <div className="min-h-dvh overflow-x-clip bg-[#f7f8fb]">
      <Navbar />
      <main>
        <Hero />
        <AdmissionBanner />
        <About />
        <Courses />
        <Programs />
        <WhyChooseUs />
        <Gallery />
        <Admission />
        <Contact />
      </main>
      <Footer />
      <FloatingButtons />
    </div>
  )
}
