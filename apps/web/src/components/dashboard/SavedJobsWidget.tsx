import { Card, CardHeader, Button } from '../ui';
import { Bookmark, Clock } from 'lucide-react';

interface Job {
    id: string;
    title: string;
    company: string;
    deadline: string;
}

export function SavedJobsWidget() {
    const jobs: Job[] = [
        { id: '1', title: 'Product Manager', company: 'InnovateInc', deadline: 'Dec 15' },
        { id: '2', title: 'UX Researcher', company: 'UserFirst', deadline: 'Dec 20' },
    ];

    return (
        <Card>
            <CardHeader title="Saved Jobs" align="left" action={<Button variant="ghost" size="sm">View All</Button>} />
            <div className="p-0">
                {jobs.map((job) => (
                    <div key={job.id} className="p-4 border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                        <div className="flex justify-between items-start">
                            <div className="flex gap-3">
                                <div className="mt-1 text-neutral-400">
                                    <Bookmark size={16} />
                                </div>
                                <div>
                                    <h4 className="font-medium text-neutral-900 dark:text-white">{job.title}</h4>
                                    <p className="text-sm text-neutral-500">{job.company}</p>
                                    <div className="flex items-center gap-1 text-xs text-amber-600 mt-1">
                                        <Clock size={12} />
                                        <span>Apply by {job.deadline}</span>
                                    </div>
                                </div>
                            </div>
                            <Button variant="secondary" size="sm" className="h-8 text-xs">Apply</Button>
                        </div>
                    </div>
                ))}
                {jobs.length === 0 && (
                    <div className="p-8 text-center text-neutral-500 text-sm">
                        No saved jobs yet.
                    </div>
                )}
            </div>
        </Card>
    );
}
