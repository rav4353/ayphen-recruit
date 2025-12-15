import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../../lib/api';
import { ArrowRight, TrendingUp, TrendingDown, Users } from 'lucide-react';

interface FunnelStage {
    stage: string;
    count: number;
    percentage: number;
}

interface ConversionRate {
    from: string;
    to: string;
    rate: number;
}

interface FunnelData {
    funnel: FunnelStage[];
    conversionRates: ConversionRate[];
    totalApplications: number;
    summary: {
        applicationToScreening: number;
        screeningToInterview: number;
        interviewToOffer: number;
        offerToHire: number;
    };
}

interface HiringFunnelProps {
    jobId?: string;
}

const stageColors: Record<string, string> = {
    Applied: 'bg-blue-500',
    Screening: 'bg-indigo-500',
    Interview: 'bg-purple-500',
    Assessment: 'bg-pink-500',
    Final: 'bg-orange-500',
    Offer: 'bg-yellow-500',
    Hired: 'bg-green-500',
};

export function HiringFunnel({ jobId }: HiringFunnelProps) {
    const { data, isLoading, error } = useQuery<FunnelData>({
        queryKey: ['hiring-funnel', jobId],
        queryFn: async () => {
            const response = await analyticsApi.getHiringFunnel(jobId);
            return response.data;
        },
    });

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3"></div>
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-10 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
                <p className="text-neutral-500 dark:text-neutral-400">Failed to load funnel data</p>
            </div>
        );
    }

    const maxCount = Math.max(...data.funnel.map((s) => s.count), 1);

    return (
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                        Hiring Funnel
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        {data.totalApplications} total applications
                    </p>
                </div>
                <Users className="h-5 w-5 text-neutral-400" />
            </div>

            {/* Funnel Visualization */}
            <div className="space-y-3 mb-6">
                {data.funnel.map((stage, index) => {
                    const widthPercent = Math.max((stage.count / maxCount) * 100, 10);
                    const color = stageColors[stage.stage] || 'bg-neutral-500';

                    return (
                        <div key={stage.stage} className="relative">
                            <div className="flex items-center gap-3">
                                <div className="w-24 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                    {stage.stage}
                                </div>
                                <div className="flex-1 relative">
                                    <div
                                        className={`h-8 ${color} rounded-r-lg transition-all duration-500 flex items-center justify-end pr-3`}
                                        style={{ width: `${widthPercent}%` }}
                                    >
                                        <span className="text-white text-sm font-medium">
                                            {stage.count}
                                        </span>
                                    </div>
                                </div>
                                <div className="w-16 text-right text-sm text-neutral-500 dark:text-neutral-400">
                                    {stage.percentage}%
                                </div>
                            </div>

                            {/* Conversion arrow */}
                            {index < data.funnel.length - 1 && data.conversionRates[index] && (
                                <div className="flex items-center gap-2 ml-24 my-1 text-xs text-neutral-500 dark:text-neutral-400">
                                    <ArrowRight className="h-3 w-3" />
                                    <span>
                                        {data.conversionRates[index].rate}% conversion
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                <SummaryStat
                    label="Application → Screening"
                    value={`${data.summary.applicationToScreening}%`}
                    trend={data.summary.applicationToScreening > 50 ? 'up' : 'down'}
                />
                <SummaryStat
                    label="Screening → Interview"
                    value={`${data.summary.screeningToInterview}%`}
                    trend={data.summary.screeningToInterview > 40 ? 'up' : 'down'}
                />
                <SummaryStat
                    label="Interview → Offer"
                    value={`${data.summary.interviewToOffer}%`}
                    trend={data.summary.interviewToOffer > 20 ? 'up' : 'down'}
                />
                <SummaryStat
                    label="Offer → Hire"
                    value={`${data.summary.offerToHire}%`}
                    trend={data.summary.offerToHire > 70 ? 'up' : 'down'}
                />
            </div>
        </div>
    );
}

function SummaryStat({
    label,
    value,
    trend,
}: {
    label: string;
    value: string;
    trend: 'up' | 'down';
}) {
    return (
        <div className="text-center">
            <div className="flex items-center justify-center gap-1">
                <span className="text-lg font-bold text-neutral-900 dark:text-white">
                    {value}
                </span>
                {trend === 'up' ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                )}
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{label}</p>
        </div>
    );
}

export default HiringFunnel;
