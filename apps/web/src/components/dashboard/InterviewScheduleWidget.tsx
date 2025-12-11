import { useState, useEffect } from 'react';
import { Card, CardHeader, Button } from '../ui';
import { Calendar, Video, MapPin, Clock } from 'lucide-react';
import { interviewsApi } from '../../lib/api';
import { useAuthStore } from '../../stores/auth';
import { format, parseISO } from 'date-fns';

interface Interview {
    id: string;
    scheduledAt: string;
    type: string;
    meetingLink?: string;
    location?: string;
    application: {
        candidate: {
            firstName: string;
            lastName: string;
        };
        job: {
            title: string;
        };
    };
    interviewer: {
        id: string;
        firstName: string;
        lastName: string;
    };
}

export function InterviewScheduleWidget() {
    const [filter, setFilter] = useState<'my' | 'team'>('my');
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const user = useAuthStore((state) => state.user);

    useEffect(() => {
        const fetchInterviews = async () => {
            setIsLoading(true);
            try {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const params: any = {
                    startDate: today.toISOString(),
                    status: 'SCHEDULED'
                };

                if (filter === 'my' && user?.id) {
                    params.interviewerId = user.id;
                }

                const response = await interviewsApi.getAll(params);
                const data = response.data.data || response.data;

                const sorted = (Array.isArray(data) ? data : [])
                    .sort((a: Interview, b: Interview) =>
                        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
                    )
                    .slice(0, 5); // Limit to 5 items

                setInterviews(sorted);
            } catch (error) {
                console.error('Failed to fetch interviews', error);
                setInterviews([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInterviews();
    }, [filter, user?.id]);

    const handleJoin = (link: string) => {
        if (link) {
            window.open(link.startsWith('http') ? link : `https://${link}`, '_blank');
        }
    };

    return (
        <Card className="h-full flex flex-col">
            <CardHeader
                title="Interview Schedule"
                align="left"
                action={
                    <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
                        <button
                            onClick={() => setFilter('my')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${filter === 'my'
                                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                                }`}
                        >
                            My Interviews
                        </button>
                        <button
                            onClick={() => setFilter('team')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${filter === 'team'
                                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                                }`}
                        >
                            Team
                        </button>
                    </div>
                }
            />
            <div className="p-0 flex-1 overflow-auto">
                {isLoading ? (
                    <div className="p-4 space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-20 bg-neutral-50 dark:bg-neutral-800/50 rounded animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <>
                        {interviews.map((interview) => {
                            const interviewDate = parseISO(interview.scheduledAt);

                            return (
                                <div key={interview.id} className="p-4 border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div className="flex gap-3 items-start">
                                            <div className="mt-1 p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                                                <Calendar size={18} />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-neutral-900 dark:text-white">
                                                    {interview.application?.candidate?.firstName} {interview.application?.candidate?.lastName}
                                                </h4>
                                                <p className="text-sm text-neutral-500">{interview.application?.job?.title}</p>
                                                <div className="flex items-center gap-3 mt-2 text-xs text-neutral-500 flex-wrap">
                                                    <div className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300 font-medium whitespace-nowrap">
                                                        <Clock size={12} />
                                                        {format(interviewDate, 'MMM d, h:mm a')}
                                                    </div>
                                                    <span className="flex items-center gap-1">
                                                        {interview.type === 'VIDEO' ? <Video size={12} /> : <MapPin size={12} />}
                                                        <span className="capitalize">
                                                            {interview.type.toLowerCase().replace('_', ' ')}
                                                            {interview.location ? ` - ${interview.location}` : ''}
                                                        </span>
                                                    </span>
                                                    {filter === 'team' && interview.interviewer && (
                                                        <span className="text-neutral-400">• with {interview.interviewer.firstName}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {interview.meetingLink && (
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                className="h-8 text-xs"
                                                onClick={() => handleJoin(interview.meetingLink!)}
                                            >
                                                Join
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {interviews.length === 0 && (
                            <div className="p-8 text-center text-neutral-500 text-sm">
                                No interviews scheduled.
                            </div>
                        )}
                    </>
                )}
            </div>
        </Card>
    );
}
