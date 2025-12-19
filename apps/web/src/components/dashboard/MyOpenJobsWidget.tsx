import { useState, useEffect } from 'react';
import { Card, CardHeader, StatusBadge, Button } from '../ui';
import { Users, Clock, AlertCircle } from 'lucide-react';
import { jobsApi } from '../../lib/api';
import { useParams, useNavigate } from 'react-router-dom';
import { differenceInDays, parseISO } from 'date-fns';

export function MyOpenJobsWidget() {
    const [jobs, setJobs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { tenantId } = useParams<{ tenantId: string }>();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchJobs = async () => {
            if (!tenantId) return;
            try {
                // Fetch active jobs (typically mapped to current user on backend if filtered by role)
                const response = await jobsApi.getAll(tenantId, { status: 'OPEN', take: 3 });
                const data = response.data.data || response.data || [];
                const jobsList = Array.isArray(data) ? data : (data.jobs || []);

                // Map to widget format
                const mappedJobs = jobsList.slice(0, 3).map((job: any) => ({
                    id: job.id,
                    title: job.title,
                    stage: 'Active', // Default since we fetched OPEN jobs
                    applicants: job._count?.applications || 0,
                    daysOpen: differenceInDays(new Date(), parseISO(job.createdAt)),
                    status: 'Active' // Could check SLA here
                }));

                setJobs(mappedJobs);
            } catch (error) {
                console.error('Failed to fetch open jobs', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchJobs();
    }, [tenantId]);

    if (isLoading) {
        return (
            <Card className="h-full">
                <CardHeader title="My Open Jobs" align="left" />
                <div className="p-4 space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-20 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
                    ))}
                </div>
            </Card>
        );
    }

    return (
        <Card className="h-full">
            <CardHeader
                title="My Open Jobs"
                align="left"
                action={<Button variant="ghost" size="sm" onClick={() => navigate(`/${tenantId}/jobs`)}>View All</Button>}
            />
            <div className="p-0">
                {jobs.length === 0 ? (
                    <div className="p-8 text-center text-neutral-500 text-sm">
                        No open jobs found.
                    </div>
                ) : (
                    jobs.map((job) => (
                        <div key={job.id} className="p-4 border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer group" onClick={() => navigate(`/${tenantId}/jobs/${job.id}`)}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-medium text-neutral-900 dark:text-white group-hover:text-blue-600 transition-colors">{job.title}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <StatusBadge status="OPEN" type="job" className="text-xs font-normal">Active</StatusBadge>
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
                    ))
                )}
            </div>
        </Card>
    );
}
