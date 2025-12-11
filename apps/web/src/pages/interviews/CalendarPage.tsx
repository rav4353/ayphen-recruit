import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    addWeeks,
    subWeeks,
    addDays,
    subDays,
    isToday,
    parseISO,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Video, MapPin } from 'lucide-react';
import { Card } from '../../components/ui';
import { interviewsApi } from '../../lib/api';
import { Interview } from '../../lib/types';
import { useNavigate, useParams } from 'react-router-dom';

type ViewMode = 'month' | 'week' | 'day';

export function CalendarPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { tenantId } = useParams<{ tenantId: string }>();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<ViewMode>('month');
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchInterviews();
    }, [currentDate, viewMode]);

    const fetchInterviews = async () => {
        setIsLoading(true);
        try {
            let start, end;

            if (viewMode === 'month') {
                start = startOfWeek(startOfMonth(currentDate));
                end = endOfWeek(endOfMonth(currentDate));
            } else if (viewMode === 'week') {
                start = startOfWeek(currentDate);
                end = endOfWeek(currentDate);
            } else {
                start = currentDate;
                end = currentDate;
            }

            const response = await interviewsApi.getAll({
                startDate: start.toISOString(),
                endDate: end.toISOString(),
            });

            const data = response.data.data || response.data;
            setInterviews(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch interviews:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const next = () => {
        if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1));
        else if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1));
        else setCurrentDate(addDays(currentDate, 1));
    };

    const prev = () => {
        if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1));
        else if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1));
        else setCurrentDate(subDays(currentDate, 1));
    };

    const today = () => setCurrentDate(new Date());

    const getDays = () => {
        if (viewMode === 'month') {
            const start = startOfWeek(startOfMonth(currentDate));
            const end = endOfWeek(endOfMonth(currentDate));
            return eachDayOfInterval({ start, end });
        } else if (viewMode === 'week') {
            const start = startOfWeek(currentDate);
            const end = endOfWeek(currentDate);
            return eachDayOfInterval({ start, end });
        }
        return [currentDate];
    };

    const getInterviewsForDay = (date: Date) => {
        return interviews.filter((interview) =>
            isSameDay(parseISO(interview.scheduledAt), date)
        );
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'SCHEDULED': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800';
            case 'CONFIRMED': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800';
            case 'COMPLETED': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800';
            case 'CANCELLED': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800';
            default: return 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700';
        }
    };

    return (
        <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                        <CalendarIcon className="text-primary-600" />
                        {t('interviews.calendar')}
                    </h1>
                    <div className="flex items-center bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-1">
                        <button
                            onClick={prev}
                            className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            onClick={today}
                            className="px-3 py-1 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors"
                        >
                            {t('common.today')}
                        </button>
                        <button
                            onClick={next}
                            className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                    <h2 className="text-lg font-semibold min-w-[200px]">
                        {format(currentDate, 'MMMM yyyy')}
                    </h2>
                </div>

                <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg">
                    {(['month', 'week', 'day'] as ViewMode[]).map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode)}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all capitalize ${viewMode === mode
                                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                                }`}
                        >
                            {t(`interviews.viewMode.${mode}`)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Calendar Grid */}
            <Card className="flex-1 flex flex-col overflow-hidden relative">
                {isLoading && (
                    <div className="absolute inset-0 bg-white/50 dark:bg-neutral-900/50 z-10 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                )}

                <div className="grid grid-cols-7 border-b border-neutral-200 dark:border-neutral-700">
                    {['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].map((day) => (
                        <div key={day} className="py-3 text-center text-sm font-medium text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/50">
                            {t(`common.days.${day}`)}
                        </div>
                    ))}
                </div>

                {/* Days Grid */}
                <div className={`flex-1 grid grid-cols-7 ${viewMode === 'month' ? 'grid-rows-5' : 'grid-rows-1'} overflow-y-auto`}>
                    {getDays().map((day) => {
                        const dayInterviews = getInterviewsForDay(day);
                        const isSelectedMonth = isSameMonth(day, currentDate);
                        const isTodayDate = isToday(day);

                        return (
                            <div
                                key={day.toString()}
                                className={`min-h-[120px] p-2 border-b border-r border-neutral-200 dark:border-neutral-700 transition-colors ${!isSelectedMonth && viewMode === 'month' ? 'bg-neutral-50/50 dark:bg-neutral-900/50' : 'bg-white dark:bg-neutral-800'
                                    } ${isTodayDate ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span
                                        className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${isTodayDate
                                            ? 'bg-blue-600 text-white'
                                            : !isSelectedMonth && viewMode === 'month'
                                                ? 'text-neutral-400 dark:text-neutral-600'
                                                : 'text-neutral-700 dark:text-neutral-300'
                                            }`}
                                    >
                                        {format(day, 'd')}
                                    </span>
                                    {dayInterviews.length > 0 && (
                                        <span className="text-xs font-medium text-neutral-400">
                                            {dayInterviews.length}
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    {dayInterviews.map((interview) => (
                                        <div
                                            key={interview.id}
                                            role="button"
                                            onClick={() => navigate(`/${tenantId}/candidates/${interview.application?.candidate?.id}`)}
                                            className={`w-full text-left px-2 py-1.5 rounded text-xs border transition-all hover:scale-[1.02] hover:shadow-sm group cursor-pointer ${getStatusColor(interview.status)}`}
                                        >
                                            <div className="font-semibold truncate">
                                                {format(parseISO(interview.scheduledAt), 'h:mm a')}
                                            </div>
                                            <div className="truncate opacity-90 flex items-center gap-1">
                                                {interview.application?.candidate?.firstName} {interview.application?.candidate?.lastName}
                                                {interview.application?.candidate?.candidateId && (
                                                    <span className="opacity-75 text-[10px] bg-black/5 dark:bg-white/10 px-1 rounded">
                                                        {interview.application.candidate.candidateId}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 mt-1 opacity-75">
                                                {interview.type === 'VIDEO' ? <Video size={10} /> : <MapPin size={10} />}
                                                <span className="truncate">{interview.type.toLowerCase()}</span>
                                            </div>
                                            {interview.meetingLink && (
                                                <div
                                                    className="mt-1.5 pt-1 border-t border-black/10 dark:border-white/10 flex justify-end"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <a
                                                        href={interview.meetingLink.startsWith('http') ? interview.meetingLink : `https://${interview.meetingLink}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="px-2 py-0.5 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 rounded text-[10px] font-medium transition-colors flex items-center gap-1"
                                                    >
                                                        <Video size={10} />
                                                        Join
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>
        </div>
    );
}
