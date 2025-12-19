/**
 * Premium Motion System
 * Centralized animation configuration for consistent, high-quality motion design
 * Inspired by Apple, Stripe, Linear, and Vercel
 */

import { Variants, Transition } from 'framer-motion';

/**
 * Premium Easing Curves
 * Custom cubic-bezier curves for smooth, natural motion
 */
export const easings = {
  easeOutPremium: [0.16, 1, 0.3, 1] as const,
  easeInOutPremium: [0.4, 0, 0.2, 1] as const,
} as const;

/**
 * Duration System
 * Consistent timing for all animations
 */
export const durations = {
  micro: 0.15,        // Micro interactions (hover, tap)
  fast: 0.2,          // Fast UI transitions
  ui: 0.3,            // Standard UI transitions
  smooth: 0.35,       // Smooth transitions
  section: 0.5,       // Section entry animations
  sectionSlow: 0.6,   // Slower section animations
  hero: 0.7,          // Hero animations
  heroSlow: 0.8,      // Slowest hero animations
} as const;

/**
 * Stagger Configuration
 */
export const stagger = {
  micro: 0.05,
  small: 0.08,
  medium: 0.12,
  large: 0.15,
} as const;

/**
 * Base Transitions
 */
export const transitions = {
  micro: {
    duration: durations.micro,
    ease: easings.easeOutPremium,
  },
  fast: {
    duration: durations.fast,
    ease: easings.easeOutPremium,
  },
  ui: {
    duration: durations.ui,
    ease: easings.easeOutPremium,
  },
  smooth: {
    duration: durations.smooth,
    ease: easings.easeInOutPremium,
  },
  section: {
    duration: durations.section,
    ease: easings.easeOutPremium,
  },
  hero: {
    duration: durations.hero,
    ease: easings.easeOutPremium,
  },
} as const;

/**
 * Hero Section Variants
 * Staggered entry animation for hero content
 */
export const heroVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 24,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.hero,
  },
};

/**
 * Hero Container Variants
 * Controls stagger timing for child elements
 */
export const heroContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: stagger.small,
      delayChildren: 0.1,
    },
  },
};

/**
 * Floating Animation
 * Subtle continuous motion for hero visuals
 */
export const floatingVariants: Variants = {
  animate: {
    y: [-8, 8, -8],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: easings.easeInOutPremium,
    },
  },
};

/**
 * Scroll Reveal Variants
 * Fade + slide animation for sections
 */
export const scrollRevealVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 32,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.section,
  },
};

/**
 * Scroll Reveal (Subtle)
 * Less dramatic for smaller elements
 */
export const scrollRevealSubtleVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.smooth,
  },
};

/**
 * Card Variants
 * Entry and hover animations for cards
 */
export const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 24,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.section,
  },
  hover: {
    y: -4,
    transition: transitions.fast,
  },
};

/**
 * Feature Card Container
 * Staggered children for feature grids
 */
export const featureContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: stagger.medium,
    },
  },
};

/**
 * Button Variants
 * Premium button interactions
 */
export const buttonVariants: Variants = {
  rest: {
    scale: 1,
  },
  hover: {
    scale: 1.02,
    transition: transitions.micro,
  },
  tap: {
    scale: 0.98,
    transition: transitions.micro,
  },
};

/**
 * CTA Button Variants
 * Enhanced primary CTA with glow effect
 */
export const ctaButtonVariants: Variants = {
  rest: {
    scale: 1,
    boxShadow: '0 4px 16px 0 rgba(59, 130, 246, 0.2)',
  },
  hover: {
    scale: 1.02,
    boxShadow: '0 8px 24px 0 rgba(59, 130, 246, 0.3)',
    transition: transitions.micro,
  },
  tap: {
    scale: 0.98,
    boxShadow: '0 2px 8px 0 rgba(59, 130, 246, 0.15)',
    transition: transitions.micro,
  },
};

/**
 * Step Animation Variants
 * For "How It Works" section
 */
export const stepVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -32,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: transitions.section,
  },
};

/**
 * Step Container Variants
 */
export const stepContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: stagger.large,
    },
  },
};

/**
 * Line Draw Variants
 * Animated connecting lines
 */
export const lineDrawVariants: Variants = {
  hidden: {
    pathLength: 0,
    opacity: 0,
  },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: {
        duration: 1,
        ease: easings.easeInOutPremium,
      },
      opacity: {
        duration: 0.3,
      },
    },
  },
};

/**
 * Scale In Variants
 * For icons and small elements
 */
export const scaleInVariants: Variants = {
  hidden: {
    scale: 0.8,
    opacity: 0,
  },
  visible: {
    scale: 1,
    opacity: 1,
    transition: transitions.smooth,
  },
};

/**
 * Fade In Variants
 * Simple fade for backgrounds
 */
export const fadeInVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: transitions.section,
  },
};

/**
 * CTA Section Variants
 * Emotional peak animation
 */
export const ctaSectionVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: durations.sectionSlow,
      ease: easings.easeOutPremium,
    },
  },
};

/**
 * Pulse Variants
 * Subtle attention-drawing pulse (once)
 */
export const pulseVariants: Variants = {
  initial: {
    scale: 1,
  },
  pulse: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 0.6,
      ease: easings.easeInOutPremium,
    },
  },
};

/**
 * Viewport Configuration
 * Consistent scroll trigger settings
 */
export const viewportConfig = {
  once: true,
  amount: 0.3,
  margin: '0px 0px -100px 0px',
} as const;

/**
 * Viewport Configuration (Subtle)
 * For elements that should trigger earlier
 */
export const viewportConfigEarly = {
  once: true,
  amount: 0.1,
  margin: '0px 0px -50px 0px',
} as const;

/**
 * Reduced Motion Check
 * Respects user's motion preferences
 */
export const shouldReduceMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Get Transition with Reduced Motion Support
 */
export const getTransition = (transition: Transition): Transition => {
  if (shouldReduceMotion()) {
    return {
      duration: 0.01,
    };
  }
  return transition;
};

/**
 * Get Variants with Reduced Motion Support
 */
export const getVariants = (variants: Variants): Variants => {
  if (shouldReduceMotion()) {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.01 } },
    };
  }
  return variants;
};
