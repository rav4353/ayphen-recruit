import { m } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import {
  scrollRevealVariants,
  cardVariants,
  featureContainerVariants,
  viewportConfig,
} from '../../lib/motion';

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Head of Talent',
    company: 'TechCorp',
    image: '1',
    content: 'TalentX reduced our time-to-hire by 70%. The AI matching is incredibly accurate, and our team loves the collaborative features.',
    rating: 5,
  },
  {
    name: 'Michael Chen',
    role: 'VP of Engineering',
    company: 'StartupXYZ',
    image: '2',
    content: 'Best ATS we\'ve used. The automation saves us countless hours, and the candidate experience is top-notch.',
    rating: 5,
  },
  {
    name: 'Emily Rodriguez',
    role: 'Recruiting Manager',
    company: 'GlobalCo',
    image: '3',
    content: 'Game-changer for our hiring process. We\'ve hired 50+ people in 3 months with TalentX. Highly recommend!',
    rating: 5,
  },
];

/**
 * Testimonials Section
 * Social proof with scroll-triggered animations
 */
export function TestimonialsSection() {
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
            Testimonials
          </m.span>
          <m.h2
            variants={scrollRevealVariants}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-900 dark:text-white mb-6 tracking-tight"
          >
            Loved by{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-400">
              Hiring Teams
            </span>
          </m.h2>
          <m.p
            variants={scrollRevealVariants}
            className="text-xl text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto"
          >
            See what our customers have to say about transforming their hiring process.
          </m.p>
        </m.div>

        {/* Testimonials Grid */}
        <m.div
          variants={featureContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {testimonials.map((testimonial, index) => (
            <m.div
              key={index}
              variants={cardVariants}
              whileHover="hover"
              className="bg-white dark:bg-neutral-900 rounded-2xl p-8 border border-neutral-200/60 dark:border-neutral-800/60 shadow-soft hover:shadow-soft-lg transition-shadow relative"
            >
              {/* Quote icon */}
              <Quote
                size={40}
                className="absolute top-6 right-6 text-primary-200 dark:text-primary-900/50"
              />

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className="fill-warning-500 text-warning-500"
                  />
                ))}
              </div>

              {/* Content */}
              <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed mb-6 relative z-10">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold shadow-soft">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-neutral-900 dark:text-white">
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {testimonial.role} at {testimonial.company}
                  </p>
                </div>
              </div>
            </m.div>
          ))}
        </m.div>
      </div>
    </section>
  );
}
