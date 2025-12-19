import { m } from 'framer-motion';
import { Search, Filter, MessageSquare, CheckCircle } from 'lucide-react';
import {
  scrollRevealVariants,
  stepVariants,
  stepContainerVariants,
  lineDrawVariants,
  scaleInVariants,
  viewportConfig,
} from '../../lib/motion';

const steps = [
  {
    icon: Search,
    title: 'Source Candidates',
    description: 'AI-powered search finds the perfect candidates across multiple channels and platforms.',
    color: 'from-primary-500 to-primary-600',
  },
  {
    icon: Filter,
    title: 'Smart Screening',
    description: 'Automated screening filters and ranks candidates based on your custom criteria.',
    color: 'from-warning-500 to-warning-600',
  },
  {
    icon: MessageSquare,
    title: 'Collaborate & Interview',
    description: 'Team members review, share feedback, and schedule interviews seamlessly.',
    color: 'from-success-500 to-success-600',
  },
  {
    icon: CheckCircle,
    title: 'Hire & Onboard',
    description: 'Send offers, collect documents, and onboard new hires all in one place.',
    color: 'from-danger-500 to-danger-600',
  },
];

/**
 * How It Works Section
 * Step-based animation with connecting lines
 */
export function HowItWorksSection() {
  return (
    <section className="py-32 bg-neutral-50 dark:bg-neutral-900/50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
            How It Works
          </m.span>
          <m.h2
            variants={scrollRevealVariants}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-900 dark:text-white mb-6 tracking-tight"
          >
            Hire in{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-400">
              Four Simple Steps
            </span>
          </m.h2>
          <m.p
            variants={scrollRevealVariants}
            className="text-xl text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto"
          >
            Our streamlined process takes you from job posting to hired candidate in record time.
          </m.p>
        </m.div>

        {/* Steps */}
        <m.div
          variants={stepContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          className="relative"
        >
          {/* Connecting line (desktop) */}
          <div className="hidden lg:block absolute top-24 left-0 right-0 h-0.5">
            <svg className="w-full h-full" viewBox="0 0 100 1" preserveAspectRatio="none">
              <m.line
                x1="0"
                y1="0.5"
                x2="100"
                y2="0.5"
                stroke="currentColor"
                strokeWidth="1"
                className="text-primary-300 dark:text-primary-700"
                variants={lineDrawVariants}
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            {steps.map((step, index) => (
              <m.div
                key={index}
                variants={stepVariants}
                className="relative"
              >
                {/* Step number */}
                <m.div
                  variants={scaleInVariants}
                  className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-gradient-to-br from-primary-600 to-primary-400 flex items-center justify-center text-white font-bold text-lg shadow-soft-lg z-10"
                >
                  {index + 1}
                </m.div>

                {/* Card */}
                <m.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white dark:bg-neutral-900 rounded-2xl p-8 pt-12 border border-neutral-200/60 dark:border-neutral-800/60 shadow-soft hover:shadow-soft-lg transition-all h-full"
                >
                  {/* Icon */}
                  <m.div
                    variants={scaleInVariants}
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-6 shadow-soft`}
                  >
                    <step.icon size={28} className="text-white" />
                  </m.div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-3 tracking-tight">
                    {step.title}
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {step.description}
                  </p>
                </m.div>
              </m.div>
            ))}
          </div>
        </m.div>
      </div>
    </section>
  );
}
