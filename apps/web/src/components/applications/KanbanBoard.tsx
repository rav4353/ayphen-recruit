import { useState, useMemo } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';

interface KanbanBoardProps {
    stages: any[];
    applications: any[];
    onMoveCard: (applicationId: string, stageId: string) => void;
    onCardClick?: (application: any) => void;
}

export function KanbanBoard({ stages, applications, onMoveCard, onCardClick }: KanbanBoardProps) {
    const [activeId, setActiveId] = useState<string | null>(null);

    // Group applications by stage
    const columns = useMemo(() => {
        const cols: Record<string, any[]> = {};
        stages.forEach(stage => {
            cols[stage.id] = applications.filter(app => app.currentStageId === stage.id);
        });
        return cols;
    }, [stages, applications]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // 5px movement required to start drag
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) {
            setActiveId(null);
            return;
        }

        const activeId = active.id as string;
        const overId = over.id as string;

        // Find the application
        const application = applications.find(app => app.id === activeId);
        if (!application) return;

        // Find the target stage
        // If overId is a container (stage id)
        let targetStageId = overId;

        // If overId is an item, find its stage
        const overApplication = applications.find(app => app.id === overId);
        if (overApplication) {
            targetStageId = overApplication.currentStageId;
        } else {
            // Check if overId is one of the stages
            const isStage = stages.some(s => s.id === overId);
            if (!isStage) {
                // Might be dropping on the column container but not the id itself?
                // For now assume overId is stageId if it's not an application
            }
        }

        if (application.currentStageId !== targetStageId) {
            onMoveCard(activeId, targetStageId);
        }

        setActiveId(null);
    };

    const activeApplication = activeId ? applications.find(app => app.id === activeId) : null;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex gap-4 overflow-x-auto pb-4 h-full">
                {stages.map((stage) => (
                    <KanbanColumn
                        key={stage.id}
                        id={stage.id}
                        title={stage.name}
                        applications={columns[stage.id] || []}
                        onCardClick={onCardClick}
                    />
                ))}
            </div>

            <DragOverlay>
                {activeApplication ? (
                    <KanbanCard id={activeApplication.id} application={activeApplication} />
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
