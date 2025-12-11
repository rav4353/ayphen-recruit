import { useState, useEffect } from 'react';
import { Card, CardHeader } from '../ui';
import { User, FileText, CheckCircle, XCircle, Mail, Activity as ActivityIcon } from 'lucide-react';
import { analyticsApi } from '../../lib/api';
import { formatDistanceToNow } from 'date-fns';

interface Activity {
    id: string;
    action: string;
    description: string | null;
    createdAt: string;
    user?: {
        firstName: string;
        lastName: string;
    };
    candidate?: {
        firstName: string;
        lastName: string;
    };
}

export function RecentActivityFeed() {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await analyticsApi.getRecentActivity();
                setActivities(response.data.data || response.data);
            } catch (error) {
                console.error('Failed to fetch recent activity', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const getIcon = (action: string) => {
        if (action.includes('APPLICATION')) return <FileText size={16} className="text-blue-500" />;
        if (action.includes('INTERVIEW')) return <User size={16} className="text-purple-500" />;
        if (action.includes('OFFER')) return <CheckCircle size={16} className="text-green-500" />;
        if (action.includes('REJECT')) return <XCircle size={16} className="text-red-500" />;
        if (action.includes('EMAIL')) return <Mail size={16} className="text-amber-500" />;
        return <ActivityIcon size={16} className="text-neutral-500" />;
    };

    const formatActivityText = (activity: Activity) => {
        const actor = activity.user ? `${activity.user.firstName} ${activity.user.lastName}` : 'System';
        const target = activity.candidate ? `${activity.candidate.firstName} ${activity.candidate.lastName}` : '';

        // Simple fallback if description is missing
        if (activity.description) return activity.description;

        // Construct message based on action
        switch (activity.action) {
            case 'APPLICATION_CREATED':
                return <span><span className="font-medium">{target}</span> applied for a job</span>;
            case 'STAGE_CHANGED':
                return <span><span className="font-medium">{actor}</span> moved <span className="font-medium">{target}</span> to a new stage</span>;
            case 'INTERVIEW_SCHEDULED':
                return <span><span className="font-medium">{actor}</span> scheduled an interview with <span className="font-medium">{target}</span></span>;
            default:
                return <span>{activity.action.replace(/_/g, ' ').toLowerCase()}</span>;
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader title="Recent Activity" align="left" />
                <div className="p-0">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex gap-3">
                            <div className="h-8 w-8 rounded-full bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-3/4 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
                                <div className="h-3 w-1/4 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader title="Recent Activity" align="left" />
            <div className="p-0">
                {activities.length === 0 ? (
                    <div className="p-8 text-center text-neutral-500 text-sm">No recent activity</div>
                ) : (
                    activities.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3 p-4 border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                            <div className="mt-1 p-2 bg-neutral-50 dark:bg-neutral-800 rounded-full border border-neutral-100 dark:border-neutral-700">
                                {getIcon(activity.action)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-neutral-900 dark:text-white">
                                    {formatActivityText(activity)}
                                </p>
                                <p className="text-xs text-neutral-500 mt-1">
                                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </Card>
    );
}
