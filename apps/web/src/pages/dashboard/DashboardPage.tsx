import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../stores/auth';
import { RecruiterDashboard } from '../../components/dashboard/RecruiterDashboard';
import { HiringManagerDashboard } from '../../components/dashboard/HiringManagerDashboard';
import { AdminDashboard } from '../../components/dashboard/AdminDashboard';
import { CandidateDashboard } from '../../components/dashboard/CandidateDashboard';
import { AnnouncementsWidget } from '../../components/dashboard/AnnouncementsWidget';
import { Sparkles, Sun, Moon, Sunset } from 'lucide-react';

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good morning', icon: Sun, color: 'text-amber-500' };
    if (hour < 17) return { text: 'Good afternoon', icon: Sunset, color: 'text-orange-500' };
    return { text: 'Good evening', icon: Moon, color: 'text-indigo-500' };
};

export const DashboardPage = () => {
    const { t } = useTranslation();
    const user = useAuthStore((state) => state.user);
    const greeting = getGreeting();
    const GreetingIcon = greeting.icon;

    const renderDashboard = () => {
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
                return <HiringManagerDashboard />;
            default:
                return <RecruiterDashboard />;
        }
    };

    return (
        <div className="space-y-6 sm:space-y-8">
            {/* Premium Header with Greeting */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-pink-600/5 dark:from-blue-600/10 dark:via-purple-600/10 dark:to-pink-600/10 rounded-2xl" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                
                <div className="relative p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <GreetingIcon size={20} className={greeting.color} />
                                <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                                    {greeting.text}
                                </span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">
                                {user?.firstName ? `Welcome back, ${user.firstName}!` : t('dashboard.title')}
                            </h1>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                                Here's what's happening with your recruitment pipeline today.
                            </p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: 'spring' }}
                                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 rounded-full"
                            >
                                <Sparkles size={16} className="text-blue-600 dark:text-blue-400" />
                                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                    AI-Powered Insights
                                </span>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Announcements */}
            <AnnouncementsWidget />

            {/* Main Dashboard Content */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="min-h-[400px] sm:min-h-[600px]"
            >
                {renderDashboard()}
            </motion.div>
        </div>
    );
};
