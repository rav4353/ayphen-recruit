import { useState, useEffect } from 'react';
import { Card, CardHeader, Button, StatusBadge } from '../ui';
import { Clock } from 'lucide-react';
import { applicationsApi, extractData } from '../../lib/api';
import { formatDistanceToNow, parseISO } from 'date-fns';

interface Application {
    id: string;
    jobTitle: string;
    company: string;
    status: 'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'OFFER' | 'REJECTED' | 'HIRED';
    lastUpdated: string;
    progress: number;
}

export function MyApplicationsWidget() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchApplications = async () => {
            try {
                // Fetch applications for the current user (backend handles scoping)
                const response = await applicationsApi.getAll();
                const data = extractData<any[]>(response);

                // Map to widget format
                const mappedApps: Application[] = data.slice(0, 3).map((app: any) => ({
                    id: app.id,
                    jobTitle: app.job?.title || 'Unknown Job',
                    company: app.job?.department?.name || 'Ayphen', // Mock company name or get from tenant/dept
                    status: app.status || 'APPLIED',
                    lastUpdated: app.updatedAt ? formatDistanceToNow(parseISO(app.updatedAt), { addSuffix: true }) : 'Just now',
                    progress: getProgress(app.status)
                }));

                setApplications(mappedApps);
            } catch (error) {
                console.error('Failed to fetch applications', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchApplications();
    }, []);

    const getProgress = (status: string) => {
        switch (status) {
            case 'APPLIED': return 10;
            case 'SCREENING': return 30;
            case 'INTERVIEW': return 60;
            case 'OFFER': return 90;
            case 'HIRED': return 100;
            case 'REJECTED': return 100; // Completed but rejected
            default: return 0;
        }
    };

    if (isLoading) {
        return (
            <Card className="h-full">
                <CardHeader title="My Applications" align="left" />
                <div className="p-4 space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
                    ))}
                </div>
            </Card>
        );
    }

    return (
        <Card className="h-full">
            <CardHeader title="My Applications" align="left" action={<Button variant="ghost" size="sm">View All</Button>} />
            <div className="p-0">
                {applications.length === 0 ? (
                    <div className="p-8 text-center text-neutral-500 text-sm">
                        No applications yet.
                    </div>
                ) : (
                    applications.map((app) => (
                        <div key={app.id} className="p-4 border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h4 className="font-medium text-neutral-900 dark:text-white">{app.jobTitle}</h4>
                                    <p className="text-sm text-neutral-500">{app.company}</p>
                                </div>
                                <StatusBadge status={app.status} type="application" />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-xs text-neutral-500">
                                    <span>Progress</span>
                                    <span>{app.progress}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-500 ${app.status === 'REJECTED' ? 'bg-red-500' : 'bg-blue-500'}`}
                                        style={{ width: `${app.progress}%` }}
                                    />
                                </div>
                                <div className="flex items-center gap-1 text-xs text-neutral-400 mt-2">
                                    <Clock size={12} />
                                    <span>Updated {app.lastUpdated}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </Card>
    );
}
