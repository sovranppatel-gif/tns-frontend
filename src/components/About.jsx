import AboutHero from './about/AboutHero'
import WhoWeAre from './about/WhoWeAre'
import JourneyNumbers from './about/JourneyNumbers'
import OurHistory from './about/OurHistory'

export default function About() {
  return (
    <div id="about" className="scroll-mt-28">
      <AboutHero />
      <WhoWeAre />
      <JourneyNumbers />
      <OurHistory />
    </div>
  )
}
