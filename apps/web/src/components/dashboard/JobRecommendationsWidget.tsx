import { Card, CardHeader, Button, Badge } from '../ui';
import { Sparkles, MapPin, Briefcase } from 'lucide-react';

interface Job {
    id: string;
    title: string;
    company: string;
    location: string;
    matchScore: number;
    tags: string[];
}

export function JobRecommendationsWidget() {
    const jobs: Job[] = [
        { id: '1', title: 'Senior React Developer', company: 'TechFlow', location: 'Remote', matchScore: 95, tags: ['React', 'TypeScript'] },
        { id: '2', title: 'Frontend Architect', company: 'BuildCo', location: 'New York, NY', matchScore: 88, tags: ['Architecture', 'Vue'] },
        { id: '3', title: 'UI Engineer', company: 'CreativeMinds', location: 'San Francisco, CA', matchScore: 82, tags: ['Design System', 'React'] },
    ];

    return (
        <Card>
            <CardHeader
                title="Recommended for You"
                align="left"
                icon={<Sparkles size={18} className="text-amber-500" />}
                action={<Button variant="ghost" size="sm">View All</Button>}
            />
            <div className="p-0">
                {jobs.map((job) => (
                    <div key={job.id} className="p-4 border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-medium text-neutral-900 dark:text-white">{job.title}</h4>
                                <p className="text-sm text-neutral-500">{job.company}</p>
                            </div>
                            <Badge variant="success" className="text-xs">{job.matchScore}% Match</Badge>
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
                            <div className="flex gap-1.5">
                                {job.tags.map(tag => (
                                    <span key={tag} className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-[10px] text-neutral-600 dark:text-neutral-400">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                            <Button size="sm" className="h-7 text-xs">Apply Now</Button>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}
