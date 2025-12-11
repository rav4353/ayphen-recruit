import { MyApplicationsWidget } from './MyApplicationsWidget';
import { ActionItemsWidget } from './ActionItemsWidget';
import { JobRecommendationsWidget } from './JobRecommendationsWidget';
import { SavedJobsWidget } from './SavedJobsWidget';
import { ProfileCompletenessWidget } from './ProfileCompletenessWidget';

import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/auth';

export function CandidateDashboard() {
    const { t } = useTranslation();
    const user = useAuthStore((state) => state.user);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Section */}
            <div>
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                    {t('dashboard.greeting.candidate', { name: user?.firstName || 'Candidate' })}
                </h1>
                <p className="text-neutral-500 dark:text-neutral-400 mt-1">{t('dashboard.subtitle.candidate')}</p>
            </div>

            {/* Main Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Applications & Actions */}
                <div className="space-y-6 lg:col-span-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <MyApplicationsWidget />
                        <ActionItemsWidget />
                    </div>

                    <JobRecommendationsWidget />
                </div>

                {/* Right Column - Profile & Saved */}
                <div className="space-y-6">
                    <ProfileCompletenessWidget />
                    <SavedJobsWidget />
                </div>
            </div>
        </div>
    );
}
