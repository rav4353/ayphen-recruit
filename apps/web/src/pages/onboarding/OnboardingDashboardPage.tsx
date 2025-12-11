import { useState, useEffect } from 'react';
import { Card, Badge } from '../../components/ui';
import { onboardingApi } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { Users, CheckSquare, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export function OnboardingDashboardPage() {
    const [workflows, setWorkflows] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchWorkflows();
    }, []);

    const fetchWorkflows = async () => {
        try {
            const response = await onboardingApi.getAll();
            // Ensure response.data is an array, otherwise default to empty array
            setWorkflows(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch onboarding workflows');
            setWorkflows([]); // Fallback to empty array on error
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'success';
            case 'IN_PROGRESS': return 'primary';
            default: return 'secondary';
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Onboarding Dashboard</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Track and manage new hire onboarding tasks</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="p-6 border-l-4 border-l-blue-500">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">Active Onboardings</p>
                            <h3 className="text-2xl font-bold text-neutral-900 dark:text-white">
                                {workflows.filter(w => w.status === 'IN_PROGRESS').length}
                            </h3>
                        </div>
                    </div>
                </Card>
                <Card className="p-6 border-l-4 border-l-green-500">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                            <CheckSquare size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">Completed</p>
                            <h3 className="text-2xl font-bold text-neutral-900 dark:text-white">
                                {workflows.filter(w => w.status === 'COMPLETED').length}
                            </h3>
                        </div>
                    </div>
                </Card>
                <Card className="p-6 border-l-4 border-l-yellow-500">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg text-yellow-600 dark:text-yellow-400">
                            <Clock size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">Pending Start</p>
                            <h3 className="text-2xl font-bold text-neutral-900 dark:text-white">
                                {workflows.filter(w => w.status === 'NOT_STARTED').length}
                            </h3>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {isLoading ? (
                    <div className="text-center py-10">Loading...</div>
                ) : !workflows || workflows.length === 0 ? (
                    <Card className="p-10 text-center text-neutral-500">
                        No active onboarding workflows found.
                    </Card>
                ) : (
                    workflows.map((workflow) => (
                        <Card
                            key={workflow.id}
                            className="p-4 hover:shadow-md transition-shadow cursor-pointer border border-neutral-200 dark:border-neutral-800"
                            onClick={() => navigate(`/onboarding/${workflow.id}`)}
                        >
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300 font-semibold">
                                        {workflow.application.candidate.firstName[0]}
                                        {workflow.application.candidate.lastName[0]}
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-neutral-900 dark:text-white">
                                            {workflow.application.candidate.firstName} {workflow.application.candidate.lastName}
                                        </h4>
                                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                            {workflow.application.job.title} • Starts {new Date(workflow.startDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="flex flex-col items-end gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-neutral-500 dark:text-neutral-400">Progress</span>
                                            <span className="font-medium text-neutral-900 dark:text-white">{Math.round(workflow.progress)}%</span>
                                        </div>
                                        <div className="w-32 h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                                style={{ width: `${workflow.progress}%` }}
                                            />
                                        </div>
                                    </div>
                                    <Badge variant={getStatusColor(workflow.status)}>
                                        {workflow.status.replace('_', ' ')}
                                    </Badge>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
