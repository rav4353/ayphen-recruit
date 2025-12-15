import { useState, useEffect } from 'react';
import { Button, Badge, Input, Modal } from '../ui';
import { Plus, GitBranch, Trash2, GripVertical, Edit2 } from 'lucide-react';
import { pipelinesApi } from '../../lib/api';
import toast from 'react-hot-toast';
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

interface PipelineStage {
    id: string;
    name: string;
    color: string;
    slaDays: number;
    order: number;
    isTerminal: boolean;
}

interface Pipeline {
    id: string;
    name: string;
    description: string;
    isDefault: boolean;
    stages: PipelineStage[];
    _count?: {
        jobs: number;
    };
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
                    <p className="text-xs text-neutral-500">{t('pipelines.slaDays')}: {stage.slaDays || 0} days</p>
                </div>
                {stage.isTerminal && (
                    <Badge variant="secondary" className="text-xs">{t('pipelines.terminal')}</Badge>
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

export function PipelineSettings() {
    const { t } = useTranslation();
    const [pipelines, setPipelines] = useState<Pipeline[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingPipeline, setEditingPipeline] = useState<Pipeline | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Stage editing state
    const [isStageModalOpen, setIsStageModalOpen] = useState(false);
    const [editingStage, setEditingStage] = useState<PipelineStage | null>(null); // null means creating new
    const [stageFormData, setStageFormData] = useState({ name: '', slaDays: 3, color: '#94a3b8' });

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        fetchPipelines();
    }, []);

    const fetchPipelines = async () => {
        try {
            const response = await pipelinesApi.getAll();
            setPipelines(response.data.data);
        } catch (error) {
            console.error('Failed to fetch pipelines', error);
            toast.error(t('pipelines.createError')); // Using generic error for now or add specific fetch error
        }
    };

    const handleCreatePipeline = async (data: { name: string; description: string; isDefault: boolean }) => {
        try {
            // First create the pipeline
            await pipelinesApi.create({
                name: data.name,
                description: data.description,
                isDefault: data.isDefault,
                stages: [
                    { name: t('pipelines.stageNames.applied'), color: '#6B7280', slaDays: 2 },
                    { name: t('pipelines.stageNames.screening'), color: '#3B82F6', slaDays: 3 },
                    { name: t('pipelines.stageNames.interview'), color: '#F59E0B', slaDays: 7 },
                    { name: t('pipelines.stageNames.offer'), color: '#10B981', slaDays: 5 },
                    { name: t('pipelines.stageNames.hired'), color: '#059669', isTerminal: true },
                    { name: t('pipelines.stageNames.rejected'), color: '#EF4444', isTerminal: true },
                ]
            });

            toast.success(t('pipelines.createSuccess'));
            setIsCreateModalOpen(false);
            fetchPipelines();
        } catch (error) {
            console.error('Failed to create pipeline', error);
            toast.error(t('pipelines.createError'));
        }
    };

    const handleUpdatePipeline = async () => {
        if (!editingPipeline) return;

        try {
            await pipelinesApi.update(editingPipeline.id, {
                name: editingPipeline.name,
                description: editingPipeline.description,
                isDefault: editingPipeline.isDefault
            });
            toast.success(t('pipelines.updateSuccess'));
            setIsEditModalOpen(false);
            setEditingPipeline(null);
            fetchPipelines();
        } catch (error) {
            console.error('Failed to update pipeline', error);
            toast.error(t('pipelines.updateError'));
        }
    };

    const handleDeletePipeline = async (id: string) => {
        if (!confirm(t('pipelines.deleteConfirm'))) return;

        try {
            await pipelinesApi.delete(id);
            toast.success(t('pipelines.deleteSuccess'));
            fetchPipelines();
        } catch (error) {
            console.error('Failed to delete pipeline', error);
            toast.error(t('pipelines.deleteError'));
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!editingPipeline || !over || active.id === over.id) {
            return;
        }

        const oldIndex = editingPipeline.stages.findIndex((stage) => stage.id === active.id);
        const newIndex = editingPipeline.stages.findIndex((stage) => stage.id === over.id);

        const newStages = arrayMove(editingPipeline.stages, oldIndex, newIndex);

        // Optimistic update
        setEditingPipeline({
            ...editingPipeline,
            stages: newStages,
        });

        try {
            await pipelinesApi.reorderStages(editingPipeline.id, newStages.map(s => s.id));
        } catch (error) {
            console.error('Failed to reorder stages', error);
            toast.error(t('pipelines.reorderError'));
            // Revert on failure
            fetchPipelines(); // Or revert local state
        }
    };

    const openAddStageModal = () => {
        setEditingStage(null);
        setStageFormData({ name: '', slaDays: 3, color: '#94a3b8' });
        setIsStageModalOpen(true);
    };

    const openEditStageModal = (stage: PipelineStage) => {
        setEditingStage(stage);
        setStageFormData({ name: stage.name, slaDays: stage.slaDays, color: stage.color });
        setIsStageModalOpen(true);
    };

    const handleSaveStage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPipeline) return;

        try {
            if (editingStage) {
                // Update existing stage
                await pipelinesApi.updateStage(editingStage.id, {
                    name: stageFormData.name,
                    slaDays: Number(stageFormData.slaDays),
                    color: stageFormData.color
                });
                toast.success(t('pipelines.updateStageSuccess'));
            } else {
                // Add new stage
                await pipelinesApi.addStage(editingPipeline.id, {
                    name: stageFormData.name,
                    slaDays: Number(stageFormData.slaDays),
                    color: stageFormData.color
                });
                toast.success(t('pipelines.addStageSuccess'));
            }

            // Refresh pipeline data
            const response = await pipelinesApi.getById(editingPipeline.id);
            setEditingPipeline(response.data.data);
            setIsStageModalOpen(false);

            // Also refresh main list to reflect changes
            fetchPipelines();
        } catch (error) {
            console.error('Failed to save stage', error);
            toast.error(editingStage ? t('pipelines.updateStageError') : t('pipelines.addStageError'));
        }
    };

    const handleRemoveStage = async (stageId: string) => {
        if (!confirm(t('pipelines.deleteStageConfirm'))) return;

        try {
            await pipelinesApi.removeStage(stageId);

            if (editingPipeline) {
                setEditingPipeline({
                    ...editingPipeline,
                    stages: editingPipeline.stages.filter(s => s.id !== stageId)
                });
            }
            toast.success(t('pipelines.removeStageSuccess'));
            fetchPipelines(); // Refresh main list
        } catch (error) {
            console.error('Failed to remove stage', error);
            toast.error(t('pipelines.removeStageError'));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <Button className="gap-2" onClick={() => setIsCreateModalOpen(true)}>
                    <Plus size={16} /> {t('pipelines.createPipeline')}
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {pipelines.map((pipeline) => (
                    <div key={pipeline.id} className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                                    <GitBranch size={20} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-medium text-neutral-900 dark:text-white">{pipeline.name}</h3>
                                        {pipeline.isDefault && (
                                            <Badge variant="primary" className="text-xs">{t('pipelines.default')}</Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-neutral-500">{pipeline.description || t('pipelines.noDescription')}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="secondary" size="sm" onClick={() => {
                                    setEditingPipeline(pipeline);
                                    setIsEditModalOpen(true);
                                }}>
                                    {t('pipelines.editStages')}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => handleDeletePipeline(pipeline.id)}
                                    disabled={pipeline.isDefault || (pipeline._count?.jobs || 0) > 0}
                                >
                                    <Trash2 size={16} />
                                </Button>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 overflow-x-auto pb-2">
                            {pipeline.stages.map((stage, index) => (
                                <div key={stage.id} className="flex items-center">
                                    <div
                                        className="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-2"
                                        style={{ backgroundColor: `${stage.color}20`, color: stage.color || '#64748b' }}
                                    >
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color || '#64748b' }} />
                                        {stage.name}
                                    </div>
                                    {index < pipeline.stages.length - 1 && (
                                        <div className="w-4 h-px bg-neutral-300 dark:bg-neutral-600 mx-1" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Pipeline Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title={t('pipelines.createPipeline')}
            >
                <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    handleCreatePipeline({
                        name: formData.get('name') as string,
                        description: formData.get('description') as string,
                        isDefault: formData.get('isDefault') === 'on'
                    });
                }} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('pipelines.pipelineName')}</label>
                        <Input name="name" required placeholder="e.g. Engineering Hiring" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('pipelines.description')}</label>
                        <Input name="description" placeholder="Brief description of this pipeline" />
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" name="isDefault" id="isDefault" className="rounded border-neutral-300" />
                        <label htmlFor="isDefault" className="text-sm">{t('pipelines.isDefault')}</label>
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)}>{t('common.cancel')}</Button>
                        <Button type="submit">{t('pipelines.createPipeline')}</Button>
                    </div>
                </form>
            </Modal>

            {/* Edit Pipeline Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setEditingPipeline(null);
                }}
                title={editingPipeline ? `${t('pipelines.editPipeline')}: ${editingPipeline.name}` : t('pipelines.editPipeline')}
                className="max-w-2xl"
            >
                {editingPipeline && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                            <div>
                                <label className="block text-xs font-medium text-neutral-500 mb-1">{t('pipelines.pipelineName')}</label>
                                <Input
                                    value={editingPipeline.name}
                                    onChange={(e) => setEditingPipeline({ ...editingPipeline, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-neutral-500 mb-1">{t('pipelines.description')}</label>
                                <Input
                                    value={editingPipeline.description || ''}
                                    onChange={(e) => setEditingPipeline({ ...editingPipeline, description: e.target.value })}
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
                                    items={editingPipeline.stages.map(s => s.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="space-y-2">
                                        {editingPipeline.stages.map((stage) => (
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
                            <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>{t('common.cancel')}</Button>
                            <Button onClick={handleUpdatePipeline}>{t('pipelines.saveChanges')}</Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Add/Edit Stage Modal */}
            <Modal
                isOpen={isStageModalOpen}
                onClose={() => setIsStageModalOpen(false)}
                title={editingStage ? t('pipelines.editStage') : t('pipelines.addStage')}
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
                        <p className="text-xs text-neutral-500 mt-1">{t('pipelines.slaDescription')}</p>
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
                        <Button type="submit">{editingStage ? t('pipelines.updateStage') : t('pipelines.addStage')}</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
