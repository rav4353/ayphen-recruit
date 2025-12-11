import { ActionRequiredWidget } from './ActionRequiredWidget';
import { MyOpenJobsWidget } from './MyOpenJobsWidget';
import { InterviewScheduleWidget } from './InterviewScheduleWidget';
import { TimeToFillMetric } from './TimeToFillMetric';
import { NewHiresWidget } from './NewHiresWidget';

import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/auth';

export function HiringManagerDashboard() {
    const { t } = useTranslation();
    const user = useAuthStore((state) => state.user);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Section */}
            <div>
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                    {t('dashboard.greeting.hiringManager', { name: user?.firstName || 'User' })}
                </h1>
                <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                    {t('dashboard.subtitle.hiringManager', { count: 3 })}
                </p>
            </div>

            {/* Main Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Action & Jobs */}
                <div className="space-y-6 lg:col-span-2">
                    <ActionRequiredWidget />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <MyOpenJobsWidget />
                        <InterviewScheduleWidget />
                    </div>
                </div>

                {/* Right Column - Metrics & Hires */}
                <div className="space-y-6">
                    <TimeToFillMetric />
                    <NewHiresWidget />
                </div>
            </div>
        </div>
    );
}
