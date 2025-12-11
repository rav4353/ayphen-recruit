
import { useState, useEffect } from 'react';
import { Card, CardHeader, Button, Badge } from '../ui';
import { Video, Calendar, MapPin } from 'lucide-react';
import { interviewsApi } from '../../lib/api';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import { useNavigate, useParams } from 'react-router-dom';

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
}

export function UpcomingInterviewsWidget() {
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const { tenantId } = useParams<{ tenantId: string }>();

    useEffect(() => {
        const fetchInterviews = async () => {
            try {
                // Fetch interviews from now onwards
                const start = new Date();
                start.setHours(0, 0, 0, 0);

                const response = await interviewsApi.getAll({
                    startDate: start.toISOString(),
                    status: 'SCHEDULED'
                });

                const data = response.data.data || response.data;
                // Sort by time
                const sorted = (Array.isArray(data) ? data : []).sort((a: Interview, b: Interview) =>
                    new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
                );

                // Take top 5
                setInterviews(sorted.slice(0, 5));
            } catch (error) {
                console.error('Failed to fetch upcoming interviews', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInterviews();
    }, []);

    const handleJoin = (link: string) => {
        if (link) {
            window.open(link.startsWith('http') ? link : `https://${link}`, '_blank');
        }
    };

    const formatInterviewDate = (dateString: string) => {
        const date = parseISO(dateString);
        if (isToday(date)) return `Today, ${format(date, 'h:mm a')}`;
        if (isTomorrow(date)) return `Tomorrow, ${format(date, 'h:mm a')}`;
        return format(date, 'MMM d, h:mm a');
    };

    if (isLoading) {
        return (
            <Card className="h-full flex flex-col">
                <CardHeader title="Upcoming Interviews" description="Next 7 days" align="left" />
                <div className="p-4 space-y-4">
                    {[1, 2].map(i => (
                        <div key={i} className="h-24 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
                    ))}
                </div>
            </Card>
        );
    }

    return (
        <Card className="h-[550px] flex flex-col">
            <CardHeader
                title="Upcoming Interviews"
                description="Next 7 days"
                align="left"
                action={
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/${tenantId}/interviews`)}
                    >
                        <Calendar size={16} />
                    </Button>
                }
            />
            <div className="p-4 space-y-4 flex-1 overflow-auto">
                {interviews.length === 0 ? (
                    <div className="text-center py-8 text-neutral-500">
                        No upcoming interviews scheduled.
                    </div>
                ) : (
                    interviews.map((interview, index) => (
                        <div key={interview.id} className="relative pl-6 pb-4 last:pb-0">
                            {/* Timeline line */}
                            {index !== interviews.length - 1 && (
                                <div className="absolute left-[11px] top-3 bottom-0 w-px bg-neutral-200 dark:bg-neutral-800" />
                            )}
                            {/* Timeline dot */}
                            <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full border-2 border-white dark:border-neutral-900 bg-blue-500 z-10 ring-4 ring-white dark:ring-neutral-950" />

                            <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-4 border border-neutral-100 dark:border-neutral-800">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="font-semibold text-neutral-900 dark:text-white">
                                            {interview.application?.candidate?.firstName} {interview.application?.candidate?.lastName}
                                        </h4>
                                        <p className="text-sm text-neutral-500">{interview.application?.job?.title}</p>
                                    </div>
                                    <Badge variant="secondary" className="font-mono text-xs">
                                        {formatInterviewDate(interview.scheduledAt)}
                                    </Badge>
                                </div>

                                <div className="flex items-center justify-between mt-3">
                                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                                        {interview.type === 'VIDEO' ? <Video size={14} /> : <MapPin size={14} />}
                                        <span className="capitalize">
                                            {interview.type.toLowerCase()}
                                            {interview.location ? ` • ${interview.location}` : ''}
                                        </span>
                                    </div>
                                    {interview.type === 'VIDEO' && (
                                        <Button
                                            size="sm"
                                            className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white border-0 gap-1.5 px-3"
                                            onClick={() => handleJoin(interview.meetingLink || '')}
                                            disabled={!interview.meetingLink}
                                        >
                                            <Video size={12} />
                                            Join Meeting
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </Card>
    );
}
