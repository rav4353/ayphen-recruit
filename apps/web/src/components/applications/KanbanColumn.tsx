import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanCard } from './KanbanCard';

interface KanbanColumnProps {
    id: string;
    title: string;
    applications: any[];
    onCardClick?: (application: any) => void;
}

export function KanbanColumn({ id, title, applications, onCardClick }: KanbanColumnProps) {
    const { setNodeRef, isOver } = useDroppable({ id });

    return (
        <div className="flex flex-col w-72 shrink-0">
            {/* Column Header */}
            <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="font-semibold text-sm text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">
                    {title}
                </h3>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                    {applications.length}
                </span>
            </div>

            {/* Column Body */}
            <div
                ref={setNodeRef}
                className={`
                    flex-1
                    bg-neutral-50 dark:bg-neutral-900/20
                    rounded-lg
                    p-2
                    min-h-[600px]
                    transition-colors
                    ${isOver ? 'bg-blue-50 dark:bg-blue-900/10 ring-2 ring-blue-200 dark:ring-blue-800' : ''}
                `}
            >
                <SortableContext items={applications.map(a => a.id)} strategy={verticalListSortingStrategy}>
                    {applications.map((app) => (
                        <KanbanCard key={app.id} id={app.id} application={app} onClick={onCardClick} />
                    ))}
                </SortableContext>

                {/* Empty state */}
                {applications.length === 0 && (
                    <div className="flex items-center justify-center h-32 text-neutral-400 dark:text-neutral-600 text-xs">
                        No applications
                    </div>
                )}
            </div>
        </div>
    );
}
