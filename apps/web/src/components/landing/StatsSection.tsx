import { m } from 'framer-motion';
import {
  featureContainerVariants,
  scaleInVariants,
  viewportConfig,
} from '../../lib/motion';

const stats = [
  { value: '10,000+', label: 'Companies Trust Us' },
  { value: '500K+', label: 'Candidates Hired' },
  { value: '98%', label: 'Customer Satisfaction' },
  { value: '10x', label: 'Faster Hiring' },
];

/**
 * Stats Section
 * Social proof with scroll-triggered animations
 */
export function StatsSection() {
  return (
    <section className="py-20 bg-neutral-50 dark:bg-neutral-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <m.div
          variants={featureContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12"
        >
          {stats.map((stat, index) => (
            <m.div
              key={index}
              variants={scaleInVariants}
              className="text-center"
            >
              <m.div
                className="text-4xl sm:text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-400 mb-2"
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={viewportConfig}
                transition={{ delay: index * 0.1, duration: 0.6 }}
              >
                {stat.value}
              </m.div>
              <p className="text-neutral-600 dark:text-neutral-400 font-medium">
                {stat.label}
              </p>
            </m.div>
          ))}
        </m.div>
      </div>
    </section>
  );
}
