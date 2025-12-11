import { Card, CardHeader, StatusBadge, Button } from '../ui';
import { Users, Clock, AlertCircle } from 'lucide-react';

export function MyOpenJobsWidget() {
    const jobs = [
        { id: '1', title: 'Senior Backend Engineer', stage: 'Screening', applicants: 12, daysOpen: 5, status: 'Active' },
        { id: '2', title: 'Product Manager', stage: 'Interview', applicants: 8, daysOpen: 15, status: 'Active' },
        { id: '3', title: 'DevOps Engineer', stage: 'Sourcing', applicants: 2, daysOpen: 45, status: 'At Risk' },
    ];

    return (
        <Card className="h-full">
            <CardHeader title="My Open Jobs" align="left" action={<Button variant="ghost" size="sm">View All</Button>} />
            <div className="p-0">
                {jobs.map((job) => (
                    <div key={job.id} className="p-4 border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer group">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-medium text-neutral-900 dark:text-white group-hover:text-blue-600 transition-colors">{job.title}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <StatusBadge status={job.stage.toUpperCase()} type="application" className="text-xs font-normal">{job.stage}</StatusBadge>
                                    {job.status === 'At Risk' && (
                                        <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
                                            <AlertCircle size={12} /> At Risk
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-xs text-neutral-500">
                            <div className="flex items-center gap-1.5">
                                <Users size={14} />
                                <span>{job.applicants} Applicants</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Clock size={14} />
                                <span>{job.daysOpen} days open</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}
