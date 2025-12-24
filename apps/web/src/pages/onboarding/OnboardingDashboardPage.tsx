import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Badge, Skeleton } from '../../components/ui';
import { onboardingApi } from '../../lib/api';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckSquare, Clock, ClipboardList, Search, ExternalLink, Briefcase, Calendar, UserCheck, PlayCircle, History } from 'lucide-react';
import toast from 'react-hot-toast';

type TabType = 'all' | 'in_progress' | 'completed' | 'pending';

export function OnboardingDashboardPage() {
    const { t } = useTranslation();
    const { tenantId } = useParams<{ tenantId: string }>();
    const navigate = useNavigate();
    const [workflows, setWorkflows] = useState<any[]>([]);
    const [filteredWorkflows, setFilteredWorkflows] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [searchTerm, setSearchTerm] = useState('');

    const tabs = [
        { id: 'all' as TabType, label: t('onboarding.allWorkflows', 'All Workflows'), icon: ClipboardList },
        { id: 'in_progress' as TabType, label: t('onboarding.inProgress', 'In Progress'), icon: PlayCircle },
        { id: 'completed' as TabType, label: t('onboarding.completed', 'Completed'), icon: CheckSquare },
        { id: 'pending' as TabType, label: t('onboarding.pending', 'Pending'), icon: Clock },
    ];

    useEffect(() => {
        fetchWorkflows();
    }, []);

    useEffect(() => {
        let filtered = workflows;
        
        // Filter by tab
        if (activeTab !== 'all') {
            const statusMap: Record<TabType, string[]> = {
                all: [],
                in_progress: ['IN_PROGRESS'],
                completed: ['COMPLETED'],
                pending: ['NOT_STARTED'],
            };
            filtered = filtered.filter(w => statusMap[activeTab].includes(w.status));
        }
        
        // Filter by search
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(w =>
                w.application?.candidate?.firstName?.toLowerCase().includes(term) ||
                w.application?.candidate?.lastName?.toLowerCase().includes(term) ||
                w.application?.job?.title?.toLowerCase().includes(term)
            );
        }
        
        setFilteredWorkflows(filtered);
    }, [activeTab, searchTerm, workflows]);

    const fetchWorkflows = async () => {
        try {
            const response = await onboardingApi.getAll();
            const workflowsData = response.data?.data || response.data;
            const data = Array.isArray(workflowsData) ? workflowsData : [];
            setWorkflows(data);
            setFilteredWorkflows(data);
        } catch (error) {
            console.error('Failed to fetch workflows:', error);
            toast.error('Failed to fetch onboarding workflows');
            setWorkflows([]);
            setFilteredWorkflows([]);
        } finally {
            setIsLoading(false);
        }
    };

    const stats = {
        total: workflows.length,
        in_progress: workflows.filter(w => w.status === 'IN_PROGRESS').length,
        completed: workflows.filter(w => w.status === 'COMPLETED').length,
        pending: workflows.filter(w => w.status === 'NOT_STARTED').length,
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return <Badge variant="success">{t('onboarding.status.completed', 'Completed')}</Badge>;
            case 'IN_PROGRESS':
                return <Badge variant="default">{t('onboarding.status.inProgress', 'In Progress')}</Badge>;
            case 'NOT_STARTED':
                return <Badge variant="secondary">{t('onboarding.status.notStarted', 'Not Started')}</Badge>;
            default:
                return <Badge variant="secondary">{status.replace('_', ' ')}</Badge>;
        }
    };

    // Loading skeleton
    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="rounded-2xl bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800 border border-neutral-200 dark:border-neutral-700 p-8">
                    <div className="flex items-center justify-between">
                        <div className="space-y-3">
                            <Skeleton className="h-8 w-56" />
                            <Skeleton className="h-5 w-72" />
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Skeleton className="h-24 rounded-xl" />
                    <Skeleton className="h-24 rounded-xl" />
                    <Skeleton className="h-24 rounded-xl" />
                </div>
                <Skeleton className="h-96 rounded-xl" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Premium Hero Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 via-white to-cyan-50/30 dark:from-neutral-900 dark:via-neutral-900 dark:to-cyan-950/20 border border-neutral-200/60 dark:border-neutral-700/60 shadow-sm">
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                
                <div className="relative p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 via-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25">
                                <UserCheck size={28} />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">
                                    {t('onboarding.dashboard', 'Onboarding Dashboard')}
                                </h1>
                                <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                                    {t('onboarding.trackOnboarding', 'Track and manage new hire onboarding tasks')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="border-b border-neutral-200 dark:border-neutral-700">
                <nav className="flex gap-1 -mb-px overflow-x-auto">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        const count = tab.id === 'all' ? stats.total : stats[tab.id as keyof typeof stats];
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${isActive ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400' : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-600'}`}
                            >
                                <Icon size={16} />
                                {tab.label}
                                {count > 0 && (
                                    <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${isActive ? 'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-600 dark:text-cyan-400' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'}`}>{count}</span>
                                )}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2">
                    <Card className="overflow-hidden">
                        <div className="p-4 border-b border-neutral-200 dark:border-neutral-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                <ClipboardList size={16} className="text-cyan-500" />
                                {t('onboarding.workflows', 'Onboarding Workflows')}
                            </h3>
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                                <input
                                    type="text"
                                    placeholder={t('onboarding.searchPlaceholder', 'Search workflows...')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full h-9 pl-9 pr-4 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-shadow"
                                />
                            </div>
                        </div>
                        
                        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {filteredWorkflows.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16">
                                    <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
                                        <UserCheck size={28} className="text-neutral-400" />
                                    </div>
                                    <p className="font-semibold text-neutral-900 dark:text-white mb-1">{t('onboarding.noWorkflows', 'No workflows found')}</p>
                                    <p className="text-sm text-neutral-500 text-center max-w-sm">{t('onboarding.noWorkflowsDesc', 'No active onboarding workflows found.')}</p>
                                </div>
                            ) : (
                                filteredWorkflows.map((workflow) => (
                                    <div
                                        key={workflow.id}
                                        className="p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors cursor-pointer"
                                        onClick={() => navigate(`/${tenantId}/onboarding/${workflow.id}`)}
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold shadow-md">
                                                    {workflow.application?.candidate?.firstName?.[0] || '?'}{workflow.application?.candidate?.lastName?.[0] || ''}
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-neutral-900 dark:text-white">
                                                        {workflow.application?.candidate?.firstName || ''} {workflow.application?.candidate?.lastName || 'Unknown'}
                                                    </h4>
                                                    <div className="flex items-center gap-3 mt-1 text-sm text-neutral-500">
                                                        <span className="flex items-center gap-1">
                                                            <Briefcase size={12} />
                                                            {workflow.application?.job?.title || 'Position'}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Calendar size={12} />
                                                            {workflow.startDate ? new Date(workflow.startDate).toLocaleDateString() : 'TBD'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="hidden sm:flex flex-col items-end gap-1">
                                                    <span className="text-sm font-semibold text-neutral-900 dark:text-white">{Math.round(workflow.progress || 0)}%</span>
                                                    <div className="w-24 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-500 ${
                                                                workflow.progress >= 100 ? 'bg-emerald-500' :
                                                                workflow.progress >= 50 ? 'bg-cyan-500' : 'bg-amber-500'
                                                            }`}
                                                            style={{ width: `${workflow.progress || 0}%` }}
                                                        />
                                                    </div>
                                                </div>
                                                {getStatusBadge(workflow.status)}
                                                <ExternalLink size={16} className="text-neutral-400" />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Onboarding Stats */}
                    <Card className="overflow-hidden">
                        <div className="p-6">
                            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                <CheckSquare size={16} className="text-emerald-500" />
                                {t('onboarding.stats', 'Onboarding Statistics')}
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800">
                                    <span className="text-sm text-neutral-500">{t('onboarding.totalWorkflows', 'Total Workflows')}</span>
                                    <span className="text-sm font-semibold text-neutral-900 dark:text-white">{stats.total}</span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800">
                                    <span className="text-sm text-neutral-500">{t('onboarding.completionRate', 'Completion Rate')}</span>
                                    <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                        {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                                    </span>
                                </div>
                                <div className="flex items-center justify-between py-2">
                                    <span className="text-sm text-neutral-500">{t('onboarding.needsAttention', 'Needs Attention')}</span>
                                    <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">{stats.pending}</span>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Upcoming Start Dates */}
                    <Card className="overflow-hidden">
                        <div className="p-6">
                            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Calendar size={16} className="text-blue-500" />
                                {t('onboarding.upcomingStarts', 'Upcoming Start Dates')}
                            </h3>
                            {workflows.filter(w => w.status !== 'COMPLETED').length === 0 ? (
                                <p className="text-sm text-neutral-500 italic">{t('onboarding.noUpcoming', 'No upcoming starts')}</p>
                            ) : (
                                <div className="space-y-3">
                                    {workflows
                                        .filter(w => w.status !== 'COMPLETED')
                                        .slice(0, 4)
                                        .map((w) => (
                                            <div key={w.id} className="flex items-center justify-between text-sm">
                                                <span className="font-medium text-neutral-900 dark:text-white truncate">
                                                    {w.application?.candidate?.firstName} {w.application?.candidate?.lastName?.[0]}.
                                                </span>
                                                <span className="text-neutral-500 flex items-center gap-1">
                                                    <Calendar size={12} />
                                                    {w.startDate ? new Date(w.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'TBD'}
                                                </span>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Recent Activity */}
                    <Card className="overflow-hidden">
                        <div className="p-6">
                            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                <History size={16} className="text-purple-500" />
                                {t('onboarding.recentActivity', 'Recent Activity')}
                            </h3>
                            {workflows.length === 0 ? (
                                <p className="text-sm text-neutral-500 italic">{t('onboarding.noActivity', 'No recent activity')}</p>
                            ) : (
                                <div className="space-y-3">
                                    {workflows.slice(0, 3).map((w) => (
                                        <div key={w.id} className="flex items-center gap-3 text-sm">
                                            <div className={`w-2 h-2 rounded-full ${
                                                w.status === 'COMPLETED' ? 'bg-emerald-500' :
                                                w.status === 'IN_PROGRESS' ? 'bg-cyan-500' : 'bg-amber-500'
                                            }`} />
                                            <span className="text-neutral-600 dark:text-neutral-400 truncate">
                                                <span className="font-medium text-neutral-900 dark:text-white">{w.application?.candidate?.firstName}</span> - {w.status.replace('_', ' ').toLowerCase()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
