import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/auth';
import { RecruiterDashboard } from '../../components/dashboard/RecruiterDashboard';
import { HiringManagerDashboard } from '../../components/dashboard/HiringManagerDashboard';
import { AdminDashboard } from '../../components/dashboard/AdminDashboard';
import { CandidateDashboard } from '../../components/dashboard/CandidateDashboard';
import { AnnouncementsWidget } from '../../components/dashboard/AnnouncementsWidget';

export const DashboardPage = () => {
    const { t } = useTranslation();
    const user = useAuthStore((state) => state.user);

    const renderDashboard = () => {
        // Show dashboard based on user's actual role
        switch (user?.role) {
            case 'ADMIN':
            case 'SUPER_ADMIN':
                return <AdminDashboard />;
            case 'RECRUITER':
                return <RecruiterDashboard />;
            case 'HIRING_MANAGER':
                return <HiringManagerDashboard />;
            case 'CANDIDATE':
                return <CandidateDashboard />;
            case 'INTERVIEWER':
                // Interviewers see the hiring manager dashboard
                return <HiringManagerDashboard />;
            default:
                // Default to recruiter dashboard
                return <RecruiterDashboard />;
        }
    };

    return (
        <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">
                    {t('dashboard.title')}
                </h1>
            </div>

            {/* Announcements */}
            <AnnouncementsWidget />

            <div className="min-h-[400px] sm:min-h-[600px]">
                {renderDashboard()}
            </div>
        </div>
    );
};
