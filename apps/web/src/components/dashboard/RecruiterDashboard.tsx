import { StatsCards } from './StatsCards';
import { MyTasksWidget } from './MyTasksWidget';
import { UpcomingInterviewsWidget } from './UpcomingInterviewsWidget';
import { PipelineHealthWidget } from './PipelineHealthWidget';
import { RecentActivityFeed } from './RecentActivityFeed';
import { PinnedJobsWidget } from './PinnedJobsWidget';

import { useAuthStore } from '../../stores/auth';

import { useTranslation } from 'react-i18next';

export function RecruiterDashboard() {
    const { t } = useTranslation();
    const user = useAuthStore((state) => state.user);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Section */}
            <div>
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                    {t('dashboard.greeting.recruiter', { name: user?.firstName || 'Recruiter' })}
                </h1>
                <p className="text-neutral-500 dark:text-neutral-400 mt-1">{t('dashboard.subtitle.recruiter')}</p>
            </div>

            {/* Quick Stats */}
            <StatsCards />

            {/* Main Grid Layout */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
                {/* Priority & Schedule */}
                <div className="space-y-4 sm:space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <MyTasksWidget />
                        <UpcomingInterviewsWidget />
                    </div>

                    {/* Pipeline Health - Full Width */}
                    <PipelineHealthWidget />
                </div>

                {/* Right Column - Activity & Jobs */}
                <div className="space-y-6">
                    <PinnedJobsWidget />
                    <RecentActivityFeed />
                </div>
            </div>
        </div>
    );
}
