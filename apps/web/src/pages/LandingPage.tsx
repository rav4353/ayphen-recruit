import { LazyMotion, domAnimation } from 'framer-motion';
import { HeroSection } from '../components/landing/HeroSection';
import { FeaturesSection } from '../components/landing/FeaturesSection';
import { HowItWorksSection } from '../components/landing/HowItWorksSection';
import { CTASection } from '../components/landing/CTASection';
import { StatsSection } from '../components/landing/StatsSection';
import { TestimonialsSection } from '../components/landing/TestimonialsSection';

export function LandingPage() {
  return (
    <LazyMotion features={domAnimation} strict>
      <div className="min-h-screen bg-white dark:bg-neutral-950">
        {/* Hero Section - Instant "wow" moment */}
        <HeroSection />

        {/* Stats Section - Social proof with motion */}
        <StatsSection />

        {/* Features Section - Scroll-based storytelling */}
        <FeaturesSection />

        {/* How It Works - Step-based animation flow */}
        <HowItWorksSection />

        {/* Testimonials - Trust building with motion */}
        <TestimonialsSection />

        {/* CTA Section - Emotional peak */}
        <CTASection />
      </div>
    </LazyMotion>
  );
}
