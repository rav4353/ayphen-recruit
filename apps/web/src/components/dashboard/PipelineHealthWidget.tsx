import { useState, useEffect } from 'react';
import { Card, CardHeader } from '../ui';
import { analyticsApi } from '../../lib/api';

export function PipelineHealthWidget() {
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await analyticsApi.getPipelineHealth();
                setData(response.data.data || response.data);
            } catch (error) {
                console.error('Failed to fetch pipeline health', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    // Define stage order and colors
    const stageConfig: Record<string, { label: string; color: string; order: number }> = {
        APPLIED: { label: 'Applied', color: 'bg-blue-500', order: 1 },
        SCREENING: { label: 'Screening', color: 'bg-indigo-500', order: 2 },
        PHONE_SCREEN: { label: 'Phone Screen', color: 'bg-indigo-400', order: 3 },
        INTERVIEW: { label: 'Interview', color: 'bg-purple-500', order: 4 },
        OFFER: { label: 'Offer', color: 'bg-pink-500', order: 5 },
        HIRED: { label: 'Hired', color: 'bg-green-500', order: 6 },
    };

    // Filter and sort data
    const stages = data
        .filter(item => stageConfig[item.status])
        .map(item => ({
            ...item,
            ...stageConfig[item.status]
        }))
        .sort((a, b) => a.order - b.order);

    const maxCount = Math.max(...stages.map(s => s.count), 1); // Avoid division by zero

    if (isLoading) {
        return (
            <Card>
                <CardHeader title="Pipeline Health" description="Active candidates across all jobs" align="left" />
                <div className="p-6 pt-2 space-y-4">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
                    ))}
                </div>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader title="Pipeline Health" description="Active candidates across all jobs" align="left" />
            <div className="p-6 pt-2">
                <div className="space-y-4">
                    {stages.length === 0 ? (
                        <div className="text-center py-8 text-neutral-500">No active pipeline data</div>
                    ) : (
                        stages.map((stage) => (
                            <div key={stage.status} className="group">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-medium text-neutral-700 dark:text-neutral-300">{stage.label}</span>
                                    <span className="font-semibold text-neutral-900 dark:text-white">{stage.count}</span>
                                </div>
                                <div className="h-2.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${stage.color} transition-all duration-500 ease-out group-hover:opacity-90`}
                                        style={{ width: `${(stage.count / maxCount) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Optional: Calculate conversion if needed, but keeping it simple for now */}
            </div>
        </Card>
    );
}
