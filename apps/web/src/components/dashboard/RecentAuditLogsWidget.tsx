import { Card, CardHeader, Button } from '../ui';
import { FileText, Settings, UserX, Download, UserPlus, Calendar, Briefcase, CheckCircle, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi, extractData } from '../../lib/api';
import { formatDistanceToNow } from 'date-fns';

interface ActivityLog {
    id: string;
    action: string;
    description: string;
    createdAt: string;
    user?: {
        firstName: string;
        lastName: string;
        avatar?: string;
    };
    candidate?: {
        firstName: string;
        lastName: string;
    };
    application?: {
        job?: {
            title: string;
        };
    };
}

export function RecentAuditLogsWidget() {
    const { data: response, isLoading } = useQuery({
        queryKey: ['recent-activity'],
        queryFn: analyticsApi.getRecentActivity,
    });

    const logs = response ? extractData<ActivityLog[]>(response) : [];

    const getIcon = (action: string) => {
        if (action.includes('CANDIDATE')) return <UserPlus size={16} className="text-blue-500" />;
        if (action.includes('INTERVIEW')) return <Calendar size={16} className="text-purple-500" />;
        if (action.includes('OFFER')) return <Briefcase size={16} className="text-green-500" />;
        if (action.includes('REJECTED')) return <UserX size={16} className="text-red-500" />;
        if (action.includes('HIRED')) return <CheckCircle size={16} className="text-emerald-500" />;
        if (action.includes('SETTINGS')) return <Settings size={16} className="text-gray-500" />;
        if (action.includes('EXPORT')) return <Download size={16} className="text-orange-500" />;
        return <FileText size={16} className="text-neutral-400" />;
    };

    const formatAction = (log: ActivityLog) => {
        if (log.description) return log.description;

        const actionBase = log.action.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');

        if (log.action === 'APPLICATION_CREATED' && log.application?.job?.title) {
            return `New application for ${log.application.job.title}`;
        }

        if (log.action === 'CANDIDATE_CREATED' && log.candidate) {
            return `Added candidate ${log.candidate.firstName} ${log.candidate.lastName}`;
        }

        if (log.action.includes('INTERVIEW') && log.candidate) {
            return `${actionBase} with ${log.candidate.firstName} ${log.candidate.lastName}`;
        }

        if (log.action.includes('OFFER') && log.candidate) {
            return `${actionBase} for ${log.candidate.firstName} ${log.candidate.lastName}`;
        }

        return actionBase;
    };

    const getUserName = (log: ActivityLog) => {
        if (log.user) return `${log.user.firstName} ${log.user.lastName}`;
        return 'System';
    };

    if (isLoading) {
        return (
            <Card className="h-full">
                <CardHeader title="Recent Audit Logs" align="left" />
                <div className="p-6 flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
                </div>
            </Card>
        );
    }

    return (
        <Card className="h-full flex flex-col">
            <CardHeader title="Recent Audit Logs" align="left" action={<Button variant="ghost" size="sm">View All</Button>} />
            <div className="flex-1 overflow-auto">
                {!logs || logs.length === 0 ? (
                    <div className="p-6 text-center text-sm text-neutral-500 italic">
                        No recent activity found.
                    </div>
                ) : (
                    logs.map((log) => (
                        <div key={log.id} className="flex items-start gap-3 p-4 border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                            <div className="mt-1">
                                {getIcon(log.action)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                                    {formatAction(log)}
                                </p>
                                <p className="text-xs text-neutral-500 mt-0.5">
                                    by {getUserName(log)} • {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </Card>
    );
}
