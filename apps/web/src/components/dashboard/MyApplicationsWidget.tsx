import { Card, CardHeader, Button, StatusBadge } from '../ui';
import { Clock } from 'lucide-react';

interface Application {
    id: string;
    jobTitle: string;
    company: string;
    status: 'Applied' | 'Screening' | 'Interview' | 'Offer' | 'Rejected';
    lastUpdated: string;
    progress: number;
}

export function MyApplicationsWidget() {
    const applications: Application[] = [
        { id: '1', jobTitle: 'Senior Frontend Engineer', company: 'TechCorp', status: 'Interview', lastUpdated: '2 hours ago', progress: 60 },
        { id: '2', jobTitle: 'Product Designer', company: 'DesignStudio', status: 'Applied', lastUpdated: '1 day ago', progress: 20 },
        { id: '3', jobTitle: 'Full Stack Developer', company: 'StartupInc', status: 'Screening', lastUpdated: '3 days ago', progress: 40 },
    ];

    return (
        <Card className="h-full">
            <CardHeader title="My Applications" align="left" action={<Button variant="ghost" size="sm">View All</Button>} />
            <div className="p-0">
                {applications.map((app) => (
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
                                    className="h-full bg-blue-500 transition-all duration-500"
                                    style={{ width: `${app.progress}%` }}
                                />
                            </div>
                            <div className="flex items-center gap-1 text-xs text-neutral-400 mt-2">
                                <Clock size={12} />
                                <span>Updated {app.lastUpdated}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}
