import { useState, useEffect } from 'react';
import { Card, CardHeader, Button, Badge } from '../ui';
import { Sparkles, MapPin, Briefcase, Bookmark, BookmarkCheck } from 'lucide-react';
import { jobsApi, savedJobsApi, extractData } from '../../lib/api';
import { useNavigate, useParams } from 'react-router-dom';

interface Job {
    id: string;
    title: string;
    company: string;
    location: string;
    matchScore: number;
    tags: string[];
    isSaved?: boolean;
}

export function JobRecommendationsWidget() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const { tenantId } = useParams<{ tenantId: string }>();

    useEffect(() => {
        const fetchJobs = async () => {
            if (!tenantId) return;
            try {
                // Fetch public jobs. For now, we just show recently posted jobs as "recommendations"
                // Ideally, this calls a dedicated recommendations endpoint
                const response = await jobsApi.getPublicAll(tenantId);
                const data = extractData<any[]>(response);

                // Fetch saved jobs to check status
                let savedIds = new Set<string>();
                try {
                    const savedRes = await savedJobsApi.getAll();
                    savedIds = new Set(extractData<any[]>(savedRes).map((s: any) => s.jobId));
                } catch (e) {
                    console.warn('Failed to fetch saved jobs status');
                }

                // Map to widget format
                const mappedJobs: Job[] = data.slice(0, 3).map((job: any) => ({
                    id: job.id,
                    title: job.title,
                    company: job.department?.name || 'Ayphen',
                    location: job.location || 'Remote',
                    matchScore: Math.floor(Math.random() * (99 - 80) + 80), // Mock match score for now
                    tags: job.skills ? job.skills.map((s: any) => s.name).slice(0, 3) : ['Full-time'],
                    isSaved: savedIds.has(job.id)
                }));

                setJobs(mappedJobs);
            } catch (error) {
                console.error('Failed to fetch job recommendations', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchJobs();
    }, [tenantId]);

    const handleSave = async (jobId: string, isSaved: boolean) => {
        try {
            if (isSaved) {
                await savedJobsApi.unsave(jobId);
                setJobs(jobs.map(j => j.id === jobId ? { ...j, isSaved: false } : j));
            } else {
                await savedJobsApi.save(jobId);
                setJobs(jobs.map(j => j.id === jobId ? { ...j, isSaved: true } : j));
            }
        } catch (error) {
            console.error('Failed to update saved status', error);
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader title="Recommended for You" align="left" icon={<Sparkles size={18} className="text-amber-500" />} />
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
                title="Recommended for You"
                align="left"
                icon={<Sparkles size={18} className="text-amber-500" />}
                action={<Button variant="ghost" size="sm" onClick={() => navigate('/careers')}>View All</Button>}
            />
            <div className="p-0">
                {jobs.length === 0 ? (
                    <div className="p-8 text-center text-neutral-500 text-sm">
                        No recommendations at the moment.
                    </div>
                ) : (
                    jobs.map((job) => (
                        <div key={job.id} className="p-4 border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-medium text-neutral-900 dark:text-white">{job.title}</h4>
                                    <p className="text-sm text-neutral-500">{job.company}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="success" className="text-xs">{job.matchScore}% Match</Badge>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSave(job.id, !!job.isSaved);
                                        }}
                                        className="text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                    >
                                        {job.isSaved ? <BookmarkCheck size={18} className="text-blue-600" /> : <Bookmark size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 mt-2 text-xs text-neutral-500">
                                <div className="flex items-center gap-1">
                                    <MapPin size={12} />
                                    <span>{job.location}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Briefcase size={12} />
                                    <span>Full-time</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-3">
                                <div className="flex gap-1.5 flex-wrap">
                                    {job.tags.map((tag, i) => (
                                        <span key={i} className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-[10px] text-neutral-600 dark:text-neutral-400">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                                <Button size="sm" className="h-7 text-xs" onClick={() => navigate(`/careers/${job.id}`)}>Apply Now</Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </Card>
    );
}
