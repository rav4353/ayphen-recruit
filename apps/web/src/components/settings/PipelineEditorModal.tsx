import { useState, useEffect } from 'react';
import { Button, Input, Modal, Badge } from '../ui';
import { Plus, Trash2, GripVertical, Edit2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import toast from 'react-hot-toast';

interface PipelineStage {
    id: string;
    name: string;
    color: string;
    slaDays: number;
    order: number;
    isTerminal?: boolean;
}

interface PipelineEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { name: string; description: string; isDefault: boolean; stages: Omit<PipelineStage, 'id'>[] }) => Promise<void>;
    initialData?: {
        name: string;
        description: string;
        isDefault: boolean;
        stages: PipelineStage[];
    };
    isSubmitting?: boolean;
}

function SortableStage({ stage, onRemove, onEdit }: { stage: PipelineStage; onRemove: (id: string) => void; onEdit: (stage: PipelineStage) => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: stage.id });
    const { t } = useTranslation();

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center justify-between p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg group"
        >
            <div className="flex items-center gap-3">
                <div {...attributes} {...listeners} className="cursor-grab text-neutral-400 hover:text-neutral-600">
                    <GripVertical size={16} />
                </div>
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: stage.color || '#cbd5e1' }} />
                <div>
                    <p className="font-medium text-sm text-neutral-900 dark:text-white">{stage.name}</p>
                    <p className="text-xs text-neutral-500">{t('pipelines.slaDays', 'SLA')}: {stage.slaDays || 0} days</p>
                </div>
                {stage.isTerminal && (
                    <Badge variant="secondary" className="text-xs">{t('pipelines.terminal', 'Terminal')}</Badge>
                )}
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="sm" onClick={() => onEdit(stage)}>
                    <Edit2 size={14} />
                </Button>
                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => onRemove(stage.id)}>
                    <Trash2 size={14} />
                </Button>
            </div>
        </div>
    );
}

export function PipelineEditorModal({ isOpen, onClose, onSave, initialData, isSubmitting }: PipelineEditorModalProps) {
    const { t } = useTranslation();
    
    // Default stages for new pipeline
    const defaultStages: PipelineStage[] = [
        { id: '1', name: 'Applied', color: '#6B7280', slaDays: 2, order: 0, isTerminal: false },
        { id: '2', name: 'Screening', color: '#3B82F6', slaDays: 3, order: 1, isTerminal: false },
        { id: '3', name: 'Interview', color: '#F59E0B', slaDays: 7, order: 2, isTerminal: false },
        { id: '4', name: 'Offer', color: '#10B981', slaDays: 5, order: 3, isTerminal: false },
        { id: '5', name: 'Hired', color: '#059669', slaDays: 0, order: 4, isTerminal: true },
        { id: '6', name: 'Rejected', color: '#EF4444', slaDays: 0, order: 5, isTerminal: true },
    ];

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isDefault, setIsDefault] = useState(false);
    const [stages, setStages] = useState<PipelineStage[]>(defaultStages);

    // Stage Editing State
    const [isStageModalOpen, setIsStageModalOpen] = useState(false);
    const [editingStageId, setEditingStageId] = useState<string | null>(null);
    const [stageFormData, setStageFormData] = useState({ name: '', slaDays: 3, color: '#94a3b8' });

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setName(initialData.name);
                setDescription(initialData.description);
                setIsDefault(initialData.isDefault);
                setStages(initialData.stages);
            } else {
                // Reset for new creation
                setName('');
                setDescription('');
                setIsDefault(false);
                setStages(defaultStages);
            }
        }
    }, [isOpen, initialData]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setStages((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over?.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleSaveStage = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (editingStageId) {
            // Edit existing
            setStages(stages.map(s => s.id === editingStageId ? { 
                ...s, 
                name: stageFormData.name, 
                slaDays: Number(stageFormData.slaDays), 
                color: stageFormData.color 
            } : s));
        } else {
            // Add new
            const newStage: PipelineStage = {
                id: Math.random().toString(36).substr(2, 9),
                name: stageFormData.name,
                slaDays: Number(stageFormData.slaDays),
                color: stageFormData.color,
                order: stages.length,
                isTerminal: false
            };
            setStages([...stages, newStage]);
        }
        setIsStageModalOpen(false);
    };

    const openAddStageModal = () => {
        setEditingStageId(null);
        setStageFormData({ name: '', slaDays: 3, color: '#94a3b8' });
        setIsStageModalOpen(true);
    };

    const openEditStageModal = (stage: PipelineStage) => {
        setEditingStageId(stage.id);
        setStageFormData({ name: stage.name, slaDays: stage.slaDays, color: stage.color });
        setIsStageModalOpen(true);
    };

    const handleRemoveStage = (id: string) => {
        if (stages.length <= 2) {
            toast.error('Pipeline must have at least 2 stages');
            return;
        }
        setStages(stages.filter(s => s.id !== id));
    };

    const handleSubmit = async () => {
        if (!name.trim()) {
            toast.error('Pipeline name is required');
            return;
        }

        const stagesPayload = stages.map((s, index) => ({
            name: s.name,
            color: s.color,
            slaDays: s.slaDays,
            order: index,
            isTerminal: s.isTerminal
        }));

        await onSave({
            name,
            description,
            isDefault,
            stages: stagesPayload
        });
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title={initialData ? t('pipelines.editPipeline') : t('pipelines.createPipeline')}
                className="max-w-2xl"
            >
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                        <div>
                            <label className="block text-xs font-medium text-neutral-500 mb-1">{t('pipelines.pipelineName')}</label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Engineering Hiring"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-neutral-500 mb-1">{t('pipelines.description')}</label>
                            <Input
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Brief description"
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-medium">{t('pipelines.stages')}</h4>
                            <Button size="sm" variant="secondary" onClick={openAddStageModal}>
                                <Plus size={14} className="mr-1" /> {t('pipelines.addStage')}
                            </Button>
                        </div>

                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={stages.map(s => s.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="space-y-2">
                                    {stages.map((stage) => (
                                        <SortableStage
                                            key={stage.id}
                                            stage={stage}
                                            onRemove={handleRemoveStage}
                                            onEdit={openEditStageModal}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                        <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>{t('common.cancel')}</Button>
                        <Button onClick={handleSubmit} isLoading={isSubmitting}>{t('common.save')}</Button>
                    </div>
                </div>
            </Modal>

            {/* Add/Edit Stage Modal */}
            <Modal
                isOpen={isStageModalOpen}
                onClose={() => setIsStageModalOpen(false)}
                title={editingStageId ? t('pipelines.editStage') : t('pipelines.addStage')}
            >
                <form onSubmit={handleSaveStage} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('pipelines.stageName')}</label>
                        <Input
                            value={stageFormData.name}
                            onChange={(e) => setStageFormData({ ...stageFormData, name: e.target.value })}
                            required
                            placeholder="e.g. Technical Interview"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('pipelines.slaDays')}</label>
                        <Input
                            type="number"
                            value={stageFormData.slaDays}
                            onChange={(e) => setStageFormData({ ...stageFormData, slaDays: Number(e.target.value) })}
                            required
                            min={0}
                        />
                        <p className="text-xs text-neutral-500 mt-1">{t('pipelines.slaDescription', 'Target days to complete this stage')}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('pipelines.color')}</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={stageFormData.color}
                                onChange={(e) => setStageFormData({ ...stageFormData, color: e.target.value })}
                                className="h-9 w-9 rounded cursor-pointer border border-neutral-300"
                            />
                            <Input
                                value={stageFormData.color}
                                onChange={(e) => setStageFormData({ ...stageFormData, color: e.target.value })}
                                placeholder="#000000"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <Button type="button" variant="ghost" onClick={() => setIsStageModalOpen(false)}>{t('common.cancel')}</Button>
                        <Button type="submit">{editingStageId ? t('pipelines.updateStage') : t('pipelines.addStage')}</Button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
