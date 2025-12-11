import { useState, useEffect } from 'react';
import { Briefcase, Users, Calendar, Clock } from 'lucide-react';
import { Card } from '../ui';
import { analyticsApi } from '../../lib/api';

interface StatCardProps {
    title: string;
    value: string | number;
    change?: string;
    icon: React.ElementType;
    trend?: 'up' | 'down' | 'neutral';
    isLoading?: boolean;
}

function StatCard({ title, value, change, icon: Icon, trend, isLoading }: StatCardProps) {
    return (
        <Card className="p-6">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{title}</p>
                    {isLoading ? (
                        <div className="h-8 w-16 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse mt-2" />
                    ) : (
                        <p className="text-3xl font-bold text-neutral-900 dark:text-white mt-2">{value}</p>
                    )}
                    {change && !isLoading && (
                        <p className={`text-sm mt-2 font-medium ${trend === 'up' ? 'text-green-600 dark:text-green-400' :
                            trend === 'down' ? 'text-red-600 dark:text-red-400' :
                                'text-neutral-500'
                            }`}>
                            {change}
                        </p>
                    )}
                </div>
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                    <Icon size={24} />
                </div>
            </div>
        </Card>
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
            trend: 'neutral' as const
        },
        {
            title: t('dashboard.stats.totalCandidates'),
            value: summary?.totalCandidates || 0,
            change: t('dashboard.stats.allTime'),
            icon: Users,
            trend: 'up' as const
        },
        {
            title: t('dashboard.stats.upcomingInterviews'),
            value: summary?.upcomingInterviews || 0,
            change: t('dashboard.stats.scheduled'),
            icon: Calendar,
            trend: 'neutral' as const
        },
        {
            title: t('dashboard.stats.timeToHire'),
            value: timeToHire ? `${timeToHire.averageDays} ${t('dashboard.stats.days')}` : 'N/A',
            change: t('dashboard.stats.basedOnHires', { count: timeToHire?.totalHired || 0 }),
            icon: Clock,
            trend: 'down' as const // Lower is better for time to hire
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
                <StatCard key={index} {...stat} isLoading={isLoading} />
            ))}
        </div>
    );
}
