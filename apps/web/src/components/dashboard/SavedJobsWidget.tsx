import { useState, useEffect } from 'react';
import { Card, CardHeader, Button } from '../ui';
import { Bookmark, Clock } from 'lucide-react';
import { savedJobsApi, extractData } from '../../lib/api';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';

interface Job {
    id: string;
    title: string;
    company: string;
    deadline: string | null;
}

export function SavedJobsWidget() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const { tenantId } = useParams<{ tenantId: string }>();

    useEffect(() => {
        const fetchSavedJobs = async () => {
            try {
                const response = await savedJobsApi.getAll();
                const data = extractData<any[]>(response);

                const mappedJobs = data.slice(0, 3).map((item: any) => ({
                    id: item.job.id,
                    title: item.job.title,
                    company: item.job.department?.name || 'Ayphen',
                    deadline: item.job.closesAt ? format(new Date(item.job.closesAt), 'MMM d') : null
                }));
                setJobs(mappedJobs);
            } catch (error) {
                console.error('Failed to fetch saved jobs', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSavedJobs();
    }, []);

    const handleApply = (jobId: string) => {
        navigate(`/${tenantId || 'careers'}/jobs/${jobId}`);
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader title="Saved Jobs" align="left" />
                <div className="p-4 space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
                    ))}
                </div>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader
                title="Saved Jobs"
                align="left"
                action={<Button variant="ghost" size="sm" onClick={() => navigate('/saved-jobs')}>View All</Button>}
            />
            <div className="p-0">
                {jobs.map((job) => (
                    <div key={job.id} className="p-4 border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                        <div className="flex justify-between items-start">
                            <div className="flex gap-3">
                                <div className="mt-1 text-neutral-400">
                                    <Bookmark size={16} className="fill-current text-blue-600" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-neutral-900 dark:text-white">{job.title}</h4>
                                    <p className="text-sm text-neutral-500">{job.company}</p>
                                    {job.deadline && (
                                        <div className="flex items-center gap-1 text-xs text-amber-600 mt-1">
                                            <Clock size={12} />
                                            <span>Apply by {job.deadline}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <Button variant="secondary" size="sm" className="h-8 text-xs" onClick={() => handleApply(job.id)}>Apply</Button>
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
