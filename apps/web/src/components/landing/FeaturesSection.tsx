import { m } from 'framer-motion';
import { Zap, Users, Brain, Target, Clock, Shield } from 'lucide-react';
import {
  scrollRevealVariants,
  cardVariants,
  featureContainerVariants,
  scaleInVariants,
  viewportConfig,
} from '../../lib/motion';
import { Card3D } from './Card3D';

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Matching',
    description: 'Intelligent algorithms match candidates to roles with 98% accuracy, saving hours of manual screening.',
    color: 'from-primary-500 to-primary-600',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Reduce time-to-hire by 10x with automated workflows and smart candidate pipelines.',
    color: 'from-warning-500 to-warning-600',
  },
  {
    icon: Users,
    title: 'Collaborative Hiring',
    description: 'Seamless team collaboration with shared feedback, scorecards, and real-time updates.',
    color: 'from-success-500 to-success-600',
  },
  {
    icon: Target,
    title: 'Precision Sourcing',
    description: 'Find perfect candidates across multiple channels with advanced search and filtering.',
    color: 'from-danger-500 to-danger-600',
  },
  {
    icon: Clock,
    title: 'Automated Workflows',
    description: 'Set up custom hiring pipelines that run on autopilot, freeing your team to focus on people.',
    color: 'from-purple-500 to-purple-600',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Bank-level encryption and compliance with SOC 2, GDPR, and CCPA standards.',
    color: 'from-neutral-500 to-neutral-600',
  },
];

/**
 * Features Section
 * Scroll-based storytelling with animated cards
 */
export function FeaturesSection() {
  return (
    <section className="py-32 bg-white dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <m.div
          variants={scrollRevealVariants}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          className="text-center mb-20"
        >
          <m.span
            variants={scrollRevealVariants}
            className="inline-block px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium mb-4"
          >
            Features
          </m.span>
          <m.h2
            variants={scrollRevealVariants}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-900 dark:text-white mb-6 tracking-tight"
          >
            Everything You Need to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-400">
              Hire Better
            </span>
          </m.h2>
          <m.p
            variants={scrollRevealVariants}
            className="text-xl text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto"
          >
            Powerful features designed to streamline your entire hiring process, from sourcing to onboarding.
          </m.p>
        </m.div>

        {/* Feature Grid */}
        <m.div
          variants={featureContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <Card3D key={index}>
            <m.div
              variants={cardVariants}
              className="group relative bg-white dark:bg-neutral-900 rounded-2xl p-8 border border-neutral-200/60 dark:border-neutral-800/60 shadow-soft hover:shadow-soft-lg transition-all duration-300 overflow-hidden h-full"
            >
              {/* Animated border gradient on hover */}
              <m.div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.1), transparent)',
                }}
                animate={{
                  x: ['-100%', '200%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
              {/* Icon */}
              <m.div
                variants={scaleInVariants}
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-soft group-hover:shadow-soft-lg transition-shadow`}
              >
                <feature.icon size={28} className="text-white" />
              </m.div>

              {/* Content */}
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-3 tracking-tight">
                {feature.title}
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {feature.description}
              </p>

              {/* Hover gradient */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </m.div>
            </Card3D>
          ))}
        </m.div>
      </div>
    </section>
  );
}
