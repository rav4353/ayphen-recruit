import { m } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  heroContainerVariants,
  heroVariants,
  floatingVariants,
  getVariants,
} from '../../lib/motion';
import { ParticleBackground } from './ParticleBackground';
import { MagneticButton } from './MagneticButton';
import { Card3D } from './Card3D';

/**
 * Hero Section
 * 
 * Premium animated entry with:
 * - Staggered text reveal
 * - Floating product visual
 * - Micro-interactions on CTA
 */
export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-white via-primary-50/30 to-white dark:from-neutral-950 dark:via-primary-950/10 dark:to-neutral-950">
      {/* Animated mesh gradient background */}
      <m.div
        className="absolute inset-0 opacity-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 1.5 }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary-100/50 via-transparent to-primary-100/50 dark:from-primary-900/20 dark:via-transparent dark:to-primary-900/20" />
        
        {/* Animated gradient orbs */}
        <m.div
          className="absolute top-20 left-1/4 w-96 h-96 bg-gradient-to-br from-primary-400/30 to-primary-600/30 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <m.div
          className="absolute bottom-20 right-1/4 w-96 h-96 bg-gradient-to-br from-primary-300/20 to-primary-500/20 rounded-full blur-3xl"
          animate={{
            x: [0, -50, 0],
            y: [0, -30, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
        <m.div
          className="absolute top-1/2 left-1/2 w-96 h-96 bg-gradient-to-br from-primary-200/15 to-primary-400/15 rounded-full blur-3xl"
          animate={{
            x: [-50, 50, -50],
            y: [-30, 30, -30],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />
      </m.div>

      {/* Particle effects */}
      <ParticleBackground />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text Content */}
          <m.div
            variants={heroContainerVariants}
            initial="hidden"
            animate="visible"
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <m.div variants={heroVariants} className="inline-flex mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium shadow-soft">
                <Sparkles size={16} className="animate-pulse" />
                Transform Your Hiring Process
              </span>
            </m.div>

            {/* Headline */}
            <m.h1
              variants={heroVariants}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold text-neutral-900 dark:text-white mb-6 tracking-tight leading-[1.1]"
            >
              Recruit Top Talent{' '}
              <m.span
                className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-primary-500 to-primary-400"
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "linear",
                }}
                style={{
                  backgroundSize: '200% 200%',
                }}
              >
                10x Faster
              </m.span>
            </m.h1>

            {/* Subtext */}
            <m.p
              variants={heroVariants}
              className="text-xl sm:text-2xl text-neutral-600 dark:text-neutral-400 mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0"
            >
              The modern ATS that combines AI-powered sourcing, intelligent screening, and seamless collaboration to help you hire exceptional talent.
            </m.p>

            {/* CTA Buttons */}
            <m.div
              variants={heroVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Link to="/register">
                <MagneticButton className="group relative px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white rounded-xl font-semibold text-lg shadow-soft-lg overflow-hidden w-full sm:w-auto"
                >
                  {/* Animated shine effect */}
                  <m.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{
                      x: ['-100%', '200%'],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                      repeatDelay: 1,
                    }}
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

              <MagneticButton className="px-8 py-4 bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white rounded-xl font-semibold text-lg shadow-soft hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
                Watch Demo
              </MagneticButton>
            </m.div>

            {/* Trust Indicators */}
            <m.div
              variants={heroVariants}
              className="mt-12 flex flex-col sm:flex-row items-center gap-6 justify-center lg:justify-start text-sm text-neutral-500 dark:text-neutral-400"
            >
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 border-2 border-white dark:border-neutral-950"
                    />
                  ))}
                </div>
                <span className="font-medium">10,000+ companies</span>
              </div>
              <div className="hidden sm:block w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
              <span>No credit card required</span>
              <div className="hidden sm:block w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
              <span>Free 14-day trial</span>
              <div className="hidden sm:block w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
              <Link to="/login" className="font-medium text-primary-600 dark:text-primary-400 hover:underline">
                Already have an account? Sign in
              </Link>
            </m.div>
          </m.div>

          {/* Right: Product Visual with Floating Animation */}
          <Card3D className="relative">
          <m.div
            variants={getVariants(floatingVariants)}
            animate="animate"
            className="relative"
          >
            {/* Animated glow effect */}
            <m.div
              className="absolute inset-0 bg-gradient-to-r from-primary-400/30 to-primary-600/30 blur-3xl rounded-full"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            {/* Product mockup placeholder */}
            <m.div
              className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-soft-xl border border-neutral-200/60 dark:border-neutral-800/60 p-8 backdrop-blur-sm"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <m.div
                className="aspect-[4/3] bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-950 dark:to-primary-900 rounded-xl flex items-center justify-center relative overflow-hidden"
                animate={{
                  backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: "linear",
                }}
                style={{
                  backgroundSize: '200% 200%',
                }}
              >
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-primary-600 flex items-center justify-center shadow-soft-lg">
                    <Sparkles size={48} className="text-white" />
                  </div>
                  <p className="text-neutral-600 dark:text-neutral-400 font-medium">
                    Product Screenshot
                  </p>
                </div>
              </m.div>

              {/* Floating cards */}
              <m.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="absolute -top-4 -right-4 bg-white dark:bg-neutral-900 rounded-xl shadow-soft-lg p-4 border border-neutral-200/60 dark:border-neutral-800/60"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-success-100 dark:bg-success-900/30 flex items-center justify-center">
                    <span className="text-success-600 dark:text-success-400 text-xl">✓</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                      Candidate Hired
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Just now
                    </p>
                  </div>
                </div>
              </m.div>

              <m.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.6 }}
                className="absolute -bottom-4 -left-4 bg-white dark:bg-neutral-900 rounded-xl shadow-soft-lg p-4 border border-neutral-200/60 dark:border-neutral-800/60"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <span className="text-primary-600 dark:text-primary-400 text-xl">⚡</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                      AI Match: 98%
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Perfect fit
                    </p>
                  </div>
                </div>
              </m.div>
            </m.div>
          </m.div>
          </Card3D>
        </div>
      </div>

      {/* Scroll indicator */}
      <m.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <m.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-6 h-10 rounded-full border-2 border-neutral-300 dark:border-neutral-700 flex items-start justify-center p-2"
        >
          <m.div className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-600" />
        </m.div>
      </m.div>
    </section>
  );
}
