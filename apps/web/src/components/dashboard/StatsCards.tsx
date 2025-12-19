import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Users, Calendar, Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card } from '../ui';
import { analyticsApi } from '../../lib/api';

interface StatCardProps {
    title: string;
    value: string | number;
    change?: string;
    icon: React.ElementType;
    trend?: 'up' | 'down' | 'neutral';
    isLoading?: boolean;
    color?: 'blue' | 'green' | 'purple' | 'orange';
    index?: number;
}

const colorConfig = {
    blue: {
        gradient: 'from-blue-500 to-blue-600',
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        text: 'text-blue-600 dark:text-blue-400',
        shadow: 'shadow-blue-500/20',
        border: 'border-l-blue-500',
    },
    green: {
        gradient: 'from-emerald-500 to-emerald-600',
        bg: 'bg-emerald-50 dark:bg-emerald-900/20',
        text: 'text-emerald-600 dark:text-emerald-400',
        shadow: 'shadow-emerald-500/20',
        border: 'border-l-emerald-500',
    },
    purple: {
        gradient: 'from-purple-500 to-purple-600',
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        text: 'text-purple-600 dark:text-purple-400',
        shadow: 'shadow-purple-500/20',
        border: 'border-l-purple-500',
    },
    orange: {
        gradient: 'from-amber-500 to-amber-600',
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        text: 'text-amber-600 dark:text-amber-400',
        shadow: 'shadow-amber-500/20',
        border: 'border-l-amber-500',
    },
};

function StatCard({ title, value, change, icon: Icon, trend, isLoading, color = 'blue', index = 0 }: StatCardProps) {
    const config = colorConfig[color];
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="group"
        >
            <Card className={`relative overflow-hidden border-0 border-l-4 ${config.border} shadow-lg shadow-neutral-200/50 dark:shadow-neutral-900/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5`}>
                {/* Background decoration */}
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${config.gradient} opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-500`} />
                
                <div className="relative p-6">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                                {title}
                            </p>
                            {isLoading ? (
                                <div className="h-9 w-20 bg-neutral-200 dark:bg-neutral-700 rounded-lg animate-pulse mt-1" />
                            ) : (
                                <motion.p 
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ duration: 0.3, delay: index * 0.1 + 0.2 }}
                                    className="text-3xl font-bold text-neutral-900 dark:text-white tracking-tight"
                                >
                                    {value}
                                </motion.p>
                            )}
                            {change && !isLoading && (
                                <div className="flex items-center gap-1.5 mt-2">
                                    {trend === 'up' && <TrendingUp size={14} className="text-emerald-500" />}
                                    {trend === 'down' && <TrendingDown size={14} className="text-emerald-500" />}
                                    {trend === 'neutral' && <Minus size={14} className="text-neutral-400" />}
                                    <p className={`text-xs font-medium ${
                                        trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' :
                                        trend === 'down' ? 'text-emerald-600 dark:text-emerald-400' :
                                        'text-neutral-500'
                                    }`}>
                                        {change}
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className={`p-3 rounded-xl ${config.bg}`}>
                            <div className={`p-2 rounded-lg bg-gradient-to-br ${config.gradient} text-white shadow-lg ${config.shadow}`}>
                                <Icon size={20} />
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}

import { useTranslation } from 'react-i18next';

export function StatsCards() {
    const { t } = useTranslation();
    const [summary, setSummary] = useState<any>(null);
    const [timeToHire, setTimeToHire] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [summaryRes, timeToHireRes] = await Promise.all([
                    analyticsApi.getSummary(),
                    analyticsApi.getTimeToHire(),
                ]);
                setSummary(summaryRes.data.data || summaryRes.data);
                setTimeToHire(timeToHireRes.data.data || timeToHireRes.data);
            } catch (error) {
                console.error('Failed to fetch dashboard stats', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const stats = [
        {
            title: t('dashboard.stats.activeJobs'),
            value: summary?.activeJobs || 0,
            change: t('dashboard.stats.openPositions'),
            icon: Briefcase,
            trend: 'neutral' as const,
            color: 'blue' as const
        },
        {
            title: t('dashboard.stats.totalCandidates'),
            value: summary?.totalCandidates || 0,
            change: t('dashboard.stats.allTime'),
            icon: Users,
            trend: 'up' as const,
            color: 'green' as const
        },
        {
            title: t('dashboard.stats.upcomingInterviews'),
            value: summary?.upcomingInterviews || 0,
            change: t('dashboard.stats.scheduled'),
            icon: Calendar,
            trend: 'neutral' as const,
            color: 'purple' as const
        },
        {
            title: t('dashboard.stats.timeToHire'),
            value: timeToHire ? `${timeToHire.averageDays} ${t('dashboard.stats.days')}` : 'N/A',
            change: t('dashboard.stats.basedOnHires', { count: timeToHire?.totalHired || 0 }),
            icon: Clock,
            trend: 'down' as const,
            color: 'orange' as const
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {stats.map((stat, index) => (
                <StatCard key={index} {...stat} isLoading={isLoading} index={index} />
            ))}
        </div>
    );
}
