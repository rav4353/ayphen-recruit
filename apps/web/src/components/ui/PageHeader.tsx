import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    icon?: LucideIcon;
    iconColor?: 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'cyan';
    actions?: React.ReactNode;
    badge?: {
        text: string;
        icon?: LucideIcon;
    };
    children?: React.ReactNode;
}

const iconColorClasses = {
    blue: 'from-blue-500 to-blue-600 shadow-blue-500/25',
    green: 'from-emerald-500 to-emerald-600 shadow-emerald-500/25',
    purple: 'from-purple-500 to-purple-600 shadow-purple-500/25',
    orange: 'from-amber-500 to-amber-600 shadow-amber-500/25',
    pink: 'from-pink-500 to-pink-600 shadow-pink-500/25',
    cyan: 'from-cyan-500 to-cyan-600 shadow-cyan-500/25',
};

const gradientClasses = {
    blue: 'from-blue-600/5 via-blue-600/5 to-transparent dark:from-blue-600/10 dark:via-blue-600/10',
    green: 'from-emerald-600/5 via-emerald-600/5 to-transparent dark:from-emerald-600/10 dark:via-emerald-600/10',
    purple: 'from-purple-600/5 via-purple-600/5 to-transparent dark:from-purple-600/10 dark:via-purple-600/10',
    orange: 'from-amber-600/5 via-amber-600/5 to-transparent dark:from-amber-600/10 dark:via-amber-600/10',
    pink: 'from-pink-600/5 via-pink-600/5 to-transparent dark:from-pink-600/10 dark:via-pink-600/10',
    cyan: 'from-cyan-600/5 via-cyan-600/5 to-transparent dark:from-cyan-600/10 dark:via-cyan-600/10',
};

export function PageHeader({ 
    title, 
    subtitle, 
    icon: Icon, 
    iconColor = 'blue', 
    actions, 
    badge,
    children 
}: PageHeaderProps) {
    const BadgeIcon = badge?.icon;
    
    return (
        <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden mb-6 sm:mb-8"
        >
            {/* Background gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${gradientClasses[iconColor]} rounded-2xl`} />
            <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            
            <div className="relative py-6 sm:py-8 px-4 sm:px-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
                    <div className="flex items-start gap-4">
                        {Icon && (
                            <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', bounce: 0.4 }}
                                className={`p-3 bg-gradient-to-br ${iconColorClasses[iconColor]} rounded-xl text-white shadow-lg hidden sm:flex`}
                            >
                                <Icon size={24} />
                            </motion.div>
                        )}
                        <div>
                            <div className="flex items-center gap-3 flex-wrap">
                                <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">
                                    {title}
                                </h1>
                                {badge && (
                                    <motion.span 
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.2 }}
                                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 rounded-full text-xs font-semibold text-neutral-700 dark:text-neutral-300"
                                    >
                                        {BadgeIcon && <BadgeIcon size={12} />}
                                        {badge.text}
                                    </motion.span>
                                )}
                            </div>
                            {subtitle && (
                                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 max-w-2xl">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>
                    
                    {actions && (
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="flex items-center gap-2 sm:gap-3 flex-wrap"
                        >
                            {actions}
                        </motion.div>
                    )}
                </div>
                
                {children && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="mt-6"
                    >
                        {children}
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}
