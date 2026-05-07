import React from 'react'
import { Navbar, Hero, FeatureSection, HowItWorks, SavingsPreview, CTASection, FAQ, Footer} from '../components/export'

function Home() {
  return (
    <main className="bg-black min-h-screen">
      <Navbar />
      <Hero />
      <FeatureSection />
      <HowItWorks />
      <SavingsPreview />
      <CTASection />
      <FAQ />
      <Footer />
    </main>
  )
}

export default Home