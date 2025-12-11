import { useState, useEffect } from 'react';
import { Card, CardHeader, StatusBadge, Button } from '../ui';
import { MoreHorizontal, Users } from 'lucide-react';
import { jobsApi } from '../../lib/api';
import { useNavigate, useParams } from 'react-router-dom';

export function PinnedJobsWidget() {
    const [jobs, setJobs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const { tenantId } = useParams<{ tenantId: string }>();

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                // Fetch active jobs, sorted by creation date for now
                const response = await jobsApi.getAll(tenantId!, {
                    status: 'OPEN',
                    take: 3
                });
                const data = response.data.data || response.data || [];
                // Sort by applicant count if available, or just take first 3
                // Backend usually paginates 'data.data' if using standard nestjs pagination, but here check api response
                const jobsList = Array.isArray(data) ? data : (data.jobs || []);
                setJobs(jobsList.slice(0, 3));
            } catch (error) {
                console.error('Failed to fetch pinned jobs', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchJobs();
    }, [tenantId]);

    const handleJobClick = (jobId: string) => {
        navigate(`/${tenantId}/jobs/${jobId}`);
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader title="Active Jobs" align="left" />
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
                title="Active Jobs"
                align="left"
                action={<Button variant="ghost" size="sm" onClick={() => navigate(`/${tenantId}/jobs`)}>View All</Button>}
            />
            <div className="p-0">
                {jobs.length === 0 ? (
                    <div className="p-8 text-center text-neutral-500 text-sm">No active jobs</div>
                ) : (
                    jobs.map((job) => (
                        <div
                            key={job.id}
                            className="p-4 border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer group"
                            onClick={() => handleJobClick(job.id)}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-medium text-neutral-900 dark:text-white group-hover:text-blue-600 transition-colors">{job.title}</h4>
                                    <p className="text-xs text-neutral-500 mt-0.5">{job.department?.name || 'No Department'}</p>
                                </div>
                                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 -mr-2 h-8 w-8 p-0">
                                    <MoreHorizontal size={16} />
                                </Button>
                            </div>
                            <div className="flex items-center gap-4 mt-3">
                                <StatusBadge status={job.status} type="job" className="text-xs" />
                                <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                                    <Users size={14} />
                                    <span>{job._count?.applications || 0} Applicants</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </Card>
    );
}
