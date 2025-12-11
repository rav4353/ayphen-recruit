import { useState, useEffect } from 'react';
import { Bookmark, Plus, Trash2, Check, ChevronDown, Share2, RotateCcw } from 'lucide-react';
import { savedViewsApi } from '../../lib/api';
import { Button, Input, Modal, ConfirmationModal } from '../ui';
import toast from 'react-hot-toast';

interface SavedView {
    id: string;
    name: string;
    entity: string;
    filters: Record<string, any>;
    isShared: boolean;
    userId: string;
}

interface SavedViewsProps {
    entity: 'JOB' | 'CANDIDATE' | 'APPLICATION';
    currentFilters: Record<string, any>;
    onApplyView: (filters: Record<string, any>) => void;
    onReset?: () => void;
    className?: string;
}

export function SavedViews({ entity, currentFilters, onApplyView, onReset, className }: SavedViewsProps) {
    const [views, setViews] = useState<SavedView[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newViewName, setNewViewName] = useState('');
    const [isShared, setIsShared] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [activeViewId, setActiveViewId] = useState<string | null>(null);

    const [viewToDelete, setViewToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchViews();
    }, [entity]);

    const fetchViews = async () => {
        try {
            const response = await savedViewsApi.getAll(entity);
            setViews(response.data.data);
        } catch (error) {
            console.error('Failed to fetch saved views', error);
        }
    };

    const handleCreateView = async () => {
        if (!newViewName.trim()) return;

        try {
            const response = await savedViewsApi.create({
                name: newViewName,
                entity,
                filters: currentFilters,
                isShared,
            });
            setViews([response.data.data, ...views]);
            setActiveViewId(response.data.data.id);
            setIsCreateModalOpen(false);
            setNewViewName('');
            setIsShared(false);
            toast.success('View saved successfully');
        } catch (error) {
            console.error('Failed to create saved view', error);
            toast.error('Failed to save view');
        }
    };

    const handleDeleteClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setViewToDelete(id);
    };

    const confirmDelete = async () => {
        if (!viewToDelete) return;

        setIsDeleting(true);
        try {
            await savedViewsApi.delete(viewToDelete);
            setViews(views.filter((v) => v.id !== viewToDelete));
            if (activeViewId === viewToDelete) {
                setActiveViewId(null);
            }
            toast.success('View deleted successfully');
        } catch (error) {
            console.error('Failed to delete saved view', error);
            toast.error('Failed to delete view');
        } finally {
            setIsDeleting(false);
            setViewToDelete(null);
        }
    };

    const handleApplyView = (view: SavedView) => {
        onApplyView(view.filters);
        setActiveViewId(view.id);
        setIsOpen(false);
    };

    const handleResetView = () => {
        setActiveViewId(null);
        if (onReset) {
            onReset();
        } else {
            // Fallback: try to apply empty filters if no onReset provided
            onApplyView({});
        }
        setIsOpen(false);
    };

    return (
        <div className={`relative ${className}`}>
            <div className="flex items-center gap-2">
                <Button
                    variant="secondary"
                    size="md"
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 h-[42px]"
                >
                    <Bookmark size={18} />
                    <span className="hidden sm:inline">Saved Views</span>
                    <ChevronDown size={16} />
                </Button>
            </div>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 z-20 p-2">
                        <div className="mb-2 px-2 py-1 space-y-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                className="w-full justify-start gap-2"
                                onClick={() => {
                                    setIsOpen(false);
                                    setIsCreateModalOpen(true);
                                }}
                            >
                                <Plus size={14} />
                                Save Current View
                            </Button>

                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start gap-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                                onClick={handleResetView}
                            >
                                <RotateCcw size={14} />
                                Reset to Default
                            </Button>
                        </div>

                        <div className="border-t border-neutral-200 dark:border-neutral-700 my-2" />

                        <div className="max-h-60 overflow-y-auto">
                            {views.length === 0 ? (
                                <div className="px-4 py-3 text-sm text-neutral-500 text-center">
                                    No saved views yet
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {views.map((view) => (
                                        <div
                                            key={view.id}
                                            className={`group flex items-center justify-between px-3 py-2 rounded-md cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700 ${activeViewId === view.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : ''
                                                }`}
                                            onClick={() => handleApplyView(view)}
                                        >
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                {activeViewId === view.id && <Check size={14} className="shrink-0" />}
                                                <span className="truncate text-sm font-medium">{view.name}</span>
                                                {view.isShared && (
                                                    <Share2 size={12} className="text-neutral-400 shrink-0" />
                                                )}
                                            </div>
                                            <button
                                                onClick={(e) => handleDeleteClick(e, view.id)}
                                                className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-red-500 transition-opacity"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Save View"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                            View Name
                        </label>
                        <Input
                            value={newViewName}
                            onChange={(e) => setNewViewName(e.target.value)}
                            placeholder="e.g. Senior React Developers"
                            autoFocus
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="shareView"
                            checked={isShared}
                            onChange={(e) => setIsShared(e.target.checked)}
                            className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="shareView" className="text-sm text-neutral-700 dark:text-neutral-300">
                            Share with team
                        </label>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <Button
                            variant="ghost"
                            onClick={() => setIsCreateModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateView}
                            disabled={!newViewName.trim()}
                        >
                            Save View
                        </Button>
                    </div>
                </div>
            </Modal>

            <ConfirmationModal
                isOpen={!!viewToDelete}
                onCancel={() => setViewToDelete(null)}
                onConfirm={confirmDelete}
                title="Delete Saved View"
                message="Are you sure you want to delete this view? This action cannot be undone."
                confirmLabel="Delete"
                cancelLabel="Cancel"
                isLoading={isDeleting}
                variant="danger"
            />
        </div>
    );
}
