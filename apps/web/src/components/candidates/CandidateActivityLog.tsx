import { useEffect, useState } from 'react';
import { Card, CardHeader } from '../ui';
import { MessageSquare, Phone, Calendar, CheckCircle2, FileText, UserPlus, Mail } from 'lucide-react';
import { candidatesApi } from '../../lib/api';

interface Activity {
    id: string;
    action: string;
    description: string;
    createdAt: string;
    user?: {
        firstName: string;
        lastName: string;
    };
}

interface CandidateActivityLogProps {
    candidateId?: string;
}

function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";

    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";

    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";

    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";

    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";

    return Math.floor(seconds) + " seconds ago";
}

export function CandidateActivityLog({ candidateId }: CandidateActivityLogProps) {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!candidateId) return;

        const fetchActivities = async () => {
            try {
                const response = await candidatesApi.getActivities(candidateId);
                setActivities(response.data.data);
            } catch (error) {
                console.error('Failed to fetch activities', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchActivities();
    }, [candidateId]);

    const getIcon = (action: string) => {
        if (action.includes('NOTE')) return <MessageSquare size={14} />;
        if (action.includes('EMAIL')) return <Mail size={14} />;
        if (action.includes('CALL') || action.includes('PHONE')) return <Phone size={14} />;
        if (action.includes('STAGE') || action.includes('STATUS')) return <CheckCircle2 size={14} />;
        if (action.includes('INTERVIEW')) return <Calendar size={14} />;
        if (action.includes('CREATED')) return <UserPlus size={14} />;
        return <FileText size={14} />;
    };

    const getIconColor = (action: string) => {
        if (action.includes('NOTE')) return 'text-amber-500 bg-amber-50 dark:bg-amber-900/20';
        if (action.includes('EMAIL')) return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20';
        if (action.includes('CALL') || action.includes('PHONE')) return 'text-purple-500 bg-purple-50 dark:bg-purple-900/20';
        if (action.includes('STAGE') || action.includes('STATUS')) return 'text-green-500 bg-green-50 dark:bg-green-900/20';
        if (action.includes('INTERVIEW')) return 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20';
        return 'text-neutral-500 bg-neutral-50 dark:bg-neutral-800';
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader title="Activity Log" />
                <div className="p-6 pt-0 text-center text-neutral-500">Loading...</div>
            </Card>
        );
    }

    if (activities.length === 0) {
        return (
            <Card>
                <CardHeader title="Activity Log" />
                <div className="p-6 pt-0 text-center text-neutral-500 italic">No activity recorded yet.</div>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader title="Activity Log" />
            <div className="p-6 pt-0">
                <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:-translate-x-px before:bg-gradient-to-b before:from-neutral-200 before:via-neutral-200 before:to-transparent dark:before:from-neutral-700 dark:before:via-neutral-700">
                    {activities.map((activity) => (
                        <div key={activity.id} className="relative flex gap-4">
                            <div className={`absolute left-0 mt-1 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white dark:border-neutral-900 ${getIconColor(activity.action)}`}>
                                {getIcon(activity.action)}
                            </div>
                            <div className="flex-1 pl-12">
                                <p className="text-sm font-medium text-neutral-900 dark:text-white">{activity.description}</p>
                                <p className="text-xs text-neutral-500 mt-0.5">
                                    {activity.user ? `${activity.user.firstName} ${activity.user.lastName}` : 'System'} • {formatTimeAgo(activity.createdAt)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    );
}
