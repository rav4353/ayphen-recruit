import { m } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  ctaSectionVariants,
  scrollRevealVariants,
  viewportConfig,
} from '../../lib/motion';
import { MagneticButton } from './MagneticButton';

/**
 * CTA Section
 * Emotional peak with premium motion
 */
export function CTASection() {
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Animated background gradient */}
      <m.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={viewportConfig}
        transition={{ duration: 1 }}
        className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700 dark:from-primary-900 dark:via-primary-800 dark:to-primary-950"
      >
        {/* Animated orbs - more dramatic */}
        <m.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary-400/40 rounded-full blur-3xl"
        />
        <m.div
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.2, 0.5, 0.2],
            x: [0, -50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-primary-300/30 rounded-full blur-3xl"
        />
        <m.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.35, 0.15],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-200/20 rounded-full blur-3xl"
        />
      </m.div>

      {/* Animated divider */}
      <m.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={viewportConfig}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent origin-center"
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <m.div
          variants={ctaSectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          className="text-center"
        >
          {/* Badge */}
          <m.div
            variants={scrollRevealVariants}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-medium mb-8 border border-white/20"
          >
            <Sparkles size={16} />
            Start Your Free Trial Today
          </m.div>

          {/* Headline */}
          <m.h2
            variants={scrollRevealVariants}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight leading-[1.1]"
          >
            Ready to Transform
            <br />
            Your Hiring Process?
          </m.h2>

          {/* Subtext */}
          <m.p
            variants={scrollRevealVariants}
            className="text-xl text-white/90 mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            Join 10,000+ companies using TalentX to hire faster, smarter, and better. No credit card required.
          </m.p>

          {/* CTA Buttons */}
          <m.div
            variants={scrollRevealVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/register">
              <MagneticButton className="group relative px-8 py-4 bg-white text-primary-600 rounded-xl font-semibold text-lg shadow-soft-xl overflow-hidden w-full sm:w-auto"
              >
                {/* Animated shimmer effect */}
                <m.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-100/50 to-transparent"
                  animate={{
                    x: ['-100%', '200%'],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    repeatDelay: 0.5,
                  }}
                />
                {/* Glow effect on hover */}
                <m.div
                  className="absolute inset-0 bg-gradient-to-r from-primary-400/0 via-primary-400/20 to-primary-400/0 opacity-0 group-hover:opacity-100 transition-opacity"
                />
                <span className="relative flex items-center gap-2 justify-center">
                  Start Free Trial
                  <ArrowRight
                    size={20}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </span>
              </MagneticButton>
            </Link>

            <MagneticButton className="px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white rounded-xl font-semibold text-lg hover:bg-white/20 transition-colors">
              Schedule Demo
            </MagneticButton>
          </m.div>

          {/* Trust indicators */}
          <m.div
            variants={scrollRevealVariants}
            className="mt-12 flex flex-col sm:flex-row items-center gap-6 justify-center text-sm text-white/80"
          >
            <span>✓ Free 14-day trial</span>
            <div className="hidden sm:block w-1 h-1 rounded-full bg-white/40" />
            <span>✓ No credit card required</span>
            <div className="hidden sm:block w-1 h-1 rounded-full bg-white/40" />
            <span>✓ Cancel anytime</span>
            <div className="hidden sm:block w-1 h-1 rounded-full bg-white/40" />
            <Link to="/login" className="font-medium text-white hover:underline">
              Already have an account? Sign in
            </Link>
          </m.div>
        </m.div>
      </div>

      {/* Bottom divider */}
      <m.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={viewportConfig}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent origin-center"
      />
    </section>
  );
}
