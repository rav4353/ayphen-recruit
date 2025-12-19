import { useState, useEffect } from 'react';
import { Card, Badge } from '../../components/ui';
import { onboardingApi } from '../../lib/api';
import { useNavigate, useParams } from 'react-router-dom';
import { Users, CheckSquare, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export function OnboardingDashboardPage() {
    const { tenantId } = useParams<{ tenantId: string }>();
    const navigate = useNavigate();
    const [workflows, setWorkflows] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchWorkflows();
    }, []);

    const fetchWorkflows = async () => {
        try {
            const response = await onboardingApi.getAll();
            console.log('Onboarding API response:', response.data);
            // Handle both response.data.data and response.data formats
            const workflowsData = response.data?.data || response.data;
            // Ensure it's an array, otherwise default to empty array
            setWorkflows(Array.isArray(workflowsData) ? workflowsData : []);
        } catch (error) {
            console.error('Failed to fetch workflows:', error);
            toast.error('Failed to fetch onboarding workflows');
            setWorkflows([]); // Fallback to empty array on error
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'success';
            case 'IN_PROGRESS': return 'default';
            default: return 'secondary';
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Onboarding Dashboard</h1>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Track and manage new hire onboarding tasks</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="p-5 border-l-4 border-l-primary-500 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Active Onboardings</p>
                            <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
                                {workflows.filter(w => w.status === 'IN_PROGRESS').length}
                            </h3>
                        </div>
                        <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-400">
                            <Users size={22} />
                        </div>
                    </div>
                </Card>
                <Card className="p-5 border-l-4 border-l-green-500 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Completed</p>
                            <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
                                {workflows.filter(w => w.status === 'COMPLETED').length}
                            </h3>
                        </div>
                        <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center text-green-600 dark:text-green-400">
                            <CheckSquare size={22} />
                        </div>
                    </div>
                </Card>
                <Card className="p-5 border-l-4 border-l-yellow-500 hover:shadow-md transition-all sm:col-span-2 lg:col-span-1">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Pending Start</p>
                            <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
                                {workflows.filter(w => w.status === 'NOT_STARTED').length}
                            </h3>
                        </div>
                        <div className="w-12 h-12 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl flex items-center justify-center text-yellow-600 dark:text-yellow-400">
                            <Clock size={22} />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Workflows List */}
            <Card className="overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
                    <h2 className="text-base font-semibold text-neutral-900 dark:text-white">Onboarding Workflows</h2>
                </div>
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                                <span className="text-sm text-neutral-500">Loading...</span>
                            </div>
                        </div>
                    ) : !workflows || workflows.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="w-14 h-14 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
                                <Users size={24} className="text-neutral-400" />
                            </div>
                            <p className="font-medium text-neutral-900 dark:text-white mb-1">No workflows found</p>
                            <p className="text-sm text-neutral-500">No active onboarding workflows found.</p>
                        </div>
                    ) : (
                        workflows.map((workflow) => (
                            <div
                                key={workflow.id}
                                className="p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors cursor-pointer"
                                onClick={() => navigate(`/${tenantId}/onboarding/${workflow.id}`)}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 text-sm font-semibold">
                                            {workflow.application?.candidate?.firstName?.[0] || '?'}
                                            {workflow.application?.candidate?.lastName?.[0] || ''}
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-sm text-neutral-900 dark:text-white">
                                                {workflow.application?.candidate?.firstName || ''} {workflow.application?.candidate?.lastName || 'Unknown'}
                                            </h4>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                                {workflow.application?.job?.title || 'Position'} • Starts {workflow.startDate ? new Date(workflow.startDate).toLocaleDateString() : 'TBD'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 ml-13 sm:ml-0">
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-xs font-medium text-neutral-900 dark:text-white">{Math.round(workflow.progress)}%</span>
                                            <div className="w-24 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary-500 rounded-full transition-all duration-500"
                                                    style={{ width: `${workflow.progress}%` }}
                                                />
                                            </div>
                                        </div>
                                        <Badge variant={getStatusColor(workflow.status)}>
                                            {workflow.status.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Card>
        </div>
    );
}
