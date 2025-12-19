import { useState, useEffect } from 'react';
import { Card, CardHeader } from '../ui';
import { Clock, TrendingDown, TrendingUp, Loader2 } from 'lucide-react';
import { analyticsApi, extractData } from '../../lib/api';

export function TimeToFillMetric() {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await analyticsApi.getTimeToHire();
                setData(extractData(response));
            } catch (error) {
                console.error('Failed to fetch time to hire', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    if (isLoading) {
        return (
            <Card>
                <CardHeader title="Time to Fill" align="left" icon={<Clock size={20} className="text-blue-600" />} />
                <div className="p-6 flex justify-center py-10">
                    <Loader2 className="animate-spin text-neutral-400" />
                </div>
            </Card>
        );
    }

    // Default values if no data
    const myAverage = data?.averageDays || 0;
    const companyAverage = data?.companyAverage || 30; // Fallback to 30 days if not provided
    const difference = companyAverage > 0 ? Math.round(((myAverage - companyAverage) / companyAverage) * 100) : 0;
    const isGood = difference < 0;

    return (
        <Card>
            <CardHeader title="Time to Fill" align="left" icon={<Clock size={20} className="text-blue-600" />} />
            <div className="px-6 pb-6">
                <div className="flex items-end gap-3">
                    <span className="text-4xl font-bold text-neutral-900 dark:text-white">{myAverage}</span>
                    <span className="text-lg text-neutral-500 mb-1">days</span>
                </div>

                <div className="mt-4 flex items-center gap-2">
                    <div className={`flex items-center gap-1 text-sm font-medium ${isGood ? 'text-green-600' : 'text-red-600'}`}>
                        {isGood ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
                        <span>{Math.abs(difference)}% {isGood ? 'faster' : 'slower'}</span>
                    </div>
                    <span className="text-sm text-neutral-500">than company avg ({companyAverage} days)</span>
                </div>

                {data?.departments && (
                    <div className="mt-6 space-y-3">
                        {data.departments.map((dept: any, i: number) => (
                            <div key={dept.name}>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-neutral-500">{dept.name}</span>
                                    <span className="font-medium text-neutral-900 dark:text-white">{dept.days} days</span>
                                </div>
                                <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full w-[${Math.min(100, (dept.days / 45) * 100)}%] ${i % 2 === 0 ? 'bg-blue-500' : 'bg-indigo-500'}`}
                                        style={{ width: `${Math.min(100, (dept.days / 45) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Card>
    );
}
