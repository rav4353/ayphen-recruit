import { Card, CardHeader } from '../ui';
import { Clock, TrendingDown, TrendingUp } from 'lucide-react';

export function TimeToFillMetric() {
    // Mock data
    const myAverage = 24;
    const companyAverage = 32;
    const difference = Math.round(((myAverage - companyAverage) / companyAverage) * 100);
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

                <div className="mt-6 space-y-3">
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-neutral-500">Engineering</span>
                            <span className="font-medium text-neutral-900 dark:text-white">28 days</span>
                        </div>
                        <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 w-[70%]" />
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-neutral-500">Product</span>
                            <span className="font-medium text-neutral-900 dark:text-white">18 days</span>
                        </div>
                        <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 w-[45%]" />
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}
