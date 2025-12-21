import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'card' | 'minimal' | 'gradient';
  className?: string;
}

const sizeClasses = {
  sm: { container: 'py-8 px-4', icon: 'w-12 h-12', iconSize: 24, title: 'text-base', desc: 'text-xs' },
  md: { container: 'py-12 px-6', icon: 'w-16 h-16', iconSize: 32, title: 'text-lg', desc: 'text-sm' },
  lg: { container: 'py-16 px-8', icon: 'w-20 h-20', iconSize: 40, title: 'text-xl', desc: 'text-base' },
};

const variantClasses = {
  default: 'bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-950 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800',
  card: 'bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 shadow-card',
  minimal: '',
  gradient: 'bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-pink-50/50 dark:from-blue-950/30 dark:via-purple-950/20 dark:to-pink-950/30 rounded-2xl border border-neutral-200/40 dark:border-neutral-800/40',
};

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action,
  size = 'md',
  variant = 'default',
  className,
}: EmptyStateProps) {
  const sizeConfig = sizeClasses[size];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn('text-center relative overflow-hidden', sizeConfig.container, variantClasses[variant], className)}
    >
      {/* Decorative background elements */}
      {variant === 'gradient' && (
        <>
          <div className="absolute top-0 left-1/4 w-32 h-32 bg-blue-400/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-purple-400/10 rounded-full blur-3xl" />
        </>
      )}
      
      <div className="relative">
        <motion.div 
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.1, type: 'spring', bounce: 0.5 }}
          className={cn(
            sizeConfig.icon,
            'mx-auto mb-5 rounded-2xl flex items-center justify-center',
            'bg-gradient-to-br from-neutral-100 to-neutral-200/80 dark:from-neutral-800 dark:to-neutral-700',
            'shadow-soft ring-1 ring-neutral-200/50 dark:ring-neutral-700/50'
          )}
        >
          <Icon className="text-neutral-400 dark:text-neutral-500" size={sizeConfig.iconSize} strokeWidth={1.5} />
        </motion.div>
        
        <motion.h3 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className={cn(sizeConfig.title, 'font-semibold text-neutral-900 dark:text-white tracking-tight')}
        >
          {title}
        </motion.h3>
        
        {description && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className={cn(sizeConfig.desc, 'text-neutral-500 dark:text-neutral-400 mt-2 max-w-md mx-auto leading-relaxed')}
          >
            {description}
          </motion.p>
        )}
        
        {action && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, type: 'spring' }}
            className="mt-6"
          >
            {action}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
