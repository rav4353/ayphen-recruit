import { m, LazyMotion, domAnimation } from 'framer-motion';
import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import logo from '../../assets/branding/logo_light_theme.png';

interface PremiumAuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

/**
 * Premium Auth Layout
 * Matches landing page aesthetic with animations
 */
export function PremiumAuthLayout({ children, title, subtitle }: PremiumAuthLayoutProps) {
  return (
    <LazyMotion features={domAnimation}>
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-neutral-50 dark:bg-neutral-950 py-8">

        {/* Content */}
        <div className="relative z-10 w-full max-w-md mx-auto px-4">
          {/* Logo/Brand */}
          <m.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-6"
          >
            <Link to="/" className="inline-block group">
              <m.img
                src={logo}
                alt="TalentX"
                className="h-32 w-auto"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              />
            </Link>
          </m.div>

          {/* Auth Card */}
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative"
          >
            <div className="relative bg-white dark:bg-neutral-900 rounded-3xl shadow-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
              {/* Gradient accent bar */}
              <div className="h-1.5 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-500" />
              
              {/* Header */}
              <div className="text-center px-8 pt-8 pb-6">
                <m.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2 tracking-tight">
                    {title}
                  </h1>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {subtitle}
                  </p>
                </m.div>
              </div>

              {/* Form Content */}
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="px-8 pb-8"
              >
                {children}
              </m.div>
            </div>
          </m.div>

          {/* Back to home link */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center mt-4"
          >
            <Link
              to="/"
              className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              ← Back to home
            </Link>
          </m.div>
        </div>
      </div>
    </LazyMotion>
  );
}
