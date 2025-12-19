import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'card' | 'minimal';
}

const sizeClasses = {
  sm: { container: 'py-8', icon: 'w-12 h-12', iconSize: 24, title: 'text-base', desc: 'text-xs' },
  md: { container: 'py-12', icon: 'w-16 h-16', iconSize: 32, title: 'text-lg', desc: 'text-sm' },
  lg: { container: 'py-16', icon: 'w-20 h-20', iconSize: 40, title: 'text-xl', desc: 'text-base' },
};

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action,
  size = 'md',
  variant = 'default'
}: EmptyStateProps) {
  const sizeConfig = sizeClasses[size];
  
  const containerClasses = variant === 'card' 
    ? 'bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm'
    : variant === 'minimal'
    ? ''
    : 'bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-950 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`text-center ${sizeConfig.container} ${containerClasses}`}
    >
      <motion.div 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', bounce: 0.4 }}
        className={`${sizeConfig.icon} mx-auto mb-4 rounded-2xl bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-700 flex items-center justify-center shadow-inner`}
      >
        <Icon className="text-neutral-400 dark:text-neutral-500" size={sizeConfig.iconSize} />
      </motion.div>
      <motion.h3 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className={`${sizeConfig.title} font-semibold text-neutral-900 dark:text-white`}
      >
        {title}
      </motion.h3>
      {description && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`${sizeConfig.desc} text-neutral-500 dark:text-neutral-400 mt-2 max-w-sm mx-auto`}
        >
          {description}
        </motion.p>
      )}
      {action && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-6"
        >
          {action}
        </motion.div>
      )}
    </motion.div>
  );
}
