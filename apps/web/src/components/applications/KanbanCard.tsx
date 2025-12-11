import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { User, Calendar, Clock } from 'lucide-react';

interface KanbanCardProps {
    id: string;
    application: any;
    onClick?: (application: any) => void;
}

export function KanbanCard({ id, application, onClick }: KanbanCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const fullName = `${application.candidate?.firstName || ''} ${application.candidate?.lastName || ''}`.trim();
    const appliedDate = new Date(application.appliedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    });

    // SLA status indicator
    const getSlaIndicator = () => {
        if (!application.slaStatus) return null;

        const { status, daysRemaining } = application.slaStatus;

        if (status === 'OVERDUE') {
            return (
                <div className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                    <Clock size={12} />
                    <span className="font-medium">Overdue</span>
                </div>
            );
        } else if (status === 'AT_RISK') {
            return (
                <div className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
                    <Clock size={12} />
                    <span className="font-medium">{daysRemaining}d left</span>
                </div>
            );
        }
        return null;
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={() => onClick?.(application)}
            className={`
                group
                bg-white dark:bg-neutral-800
                border-l-4
                ${application.slaStatus?.status === 'OVERDUE' ? 'border-l-red-500' :
                    application.slaStatus?.status === 'AT_RISK' ? 'border-l-yellow-500' :
                        'border-l-transparent'}
                border-r border-t border-b border-neutral-200 dark:border-neutral-700
                rounded-lg
                p-3
                mb-2
                cursor-pointer
                transition-all
                hover:border-neutral-300 dark:hover:border-neutral-600
                hover:shadow-sm
                ${isDragging ? 'opacity-50 shadow-lg' : ''}
            `}
        >
            {/* Candidate Name */}
            <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex flex-col gap-1">
                    <h4 className="font-medium text-sm text-neutral-900 dark:text-neutral-100 line-clamp-1">
                        {fullName || 'Unknown Candidate'}
                    </h4>
                    {application.candidate?.candidateId && (
                        <span className="w-fit text-[10px] font-normal text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-700">
                            {application.candidate.candidateId}
                        </span>
                    )}
                </div>
                {getSlaIndicator()}
            </div>

            {/* Job Title */}
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3 line-clamp-1">
                {application.job?.title || 'No job title'}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-neutral-400 dark:text-neutral-500">
                <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span>{appliedDate}</span>
                </div>
                {application.candidate?.email && (
                    <div className="flex items-center gap-1">
                        <User size={12} />
                    </div>
                )}
            </div>
        </div>
    );
}
