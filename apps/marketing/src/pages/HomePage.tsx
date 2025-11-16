import { Navigation } from '@/components/Navigation';
import { FloatingCTA } from '@/components/FloatingCTA';
import { Hero } from '@/components/sections/Hero';
import { Problem } from '@/components/sections/Problem';
import { HowItWorks } from '@/components/sections/HowItWorks';
import { Features } from '@/components/sections/Features';
import { Dashboards } from '@/components/sections/Dashboards';
import { UseCases } from '@/components/sections/UseCases';
import { Hardware } from '@/components/sections/Hardware';
import { Testimonials } from '@/components/sections/Testimonials';
import { Pricing } from '@/components/sections/Pricing';
import { Developer } from '@/components/sections/Developer';
import { FinalCTA } from '@/components/sections/FinalCTA';
import { Footer } from '@/components/sections/Footer';

export function HomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navigation />
      <main className="overflow-x-hidden">
        <Hero />
        <Problem />
        <HowItWorks />
        <Features />
        <Dashboards />
        <UseCases />
        <Hardware />
        <Testimonials />
        <Pricing />
        <Developer />
        <FinalCTA />
      </main>
      <Footer />
      <FloatingCTA />
    </div>
  );
}
