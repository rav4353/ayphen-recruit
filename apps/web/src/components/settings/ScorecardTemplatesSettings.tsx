import React, { useState, Component, ErrorInfo, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scorecardTemplatesApi } from '../../lib/api';
import { Button, Card, ConfirmationModal } from '../ui';
import { Plus, Edit, Trash2, ClipboardCheck, X } from 'lucide-react';
import { ScorecardModal } from './ScorecardModal';
import toast from 'react-hot-toast';

// Error Boundary
interface ErrorBoundaryProps {
    children: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

class ScorecardsErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ScorecardsTemplatesSettings Error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
                        Something went wrong
                    </h3>
                    <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                        {this.state.error?.message || 'Failed to load scorecard templates'}
                    </p>
                    <Button onClick={() => window.location.reload()}>
                        Reload Page
                    </Button>
                </div>
            );
        }
        return this.props.children;
    }
}

const ScorecardPreviewModal = ({ isOpen, onClose, template }: { isOpen: boolean; onClose: () => void; template: any }) => {
    if (!template) return null;

    // Defaults for backward compatibility or new templates
    const ratingScale = template.ratingScale || 5;
    const ratingLabelMin = template.ratingLabelMin || 'Poor';
    const ratingLabelMax = template.ratingLabelMax || 'Excellent';

    // Ensure decision options are an array
    const decisionOptions = Array.isArray(template.recommendationOptions)
        ? template.recommendationOptions
        : (template.recommendationOptions ? template.recommendationOptions.split(',').map((s: string) => s.trim()) : ['Strong No', 'No', 'Yes', 'Strong Yes']);

    // Generate array for rating buttons 1..N
    const ratingButtons = Array.from({ length: ratingScale }, (_, i) => i + 1);

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col relative z-10 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
                    <div>
                        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Scorecard Preview</h2>
                        <p className="text-sm text-neutral-500">Preview how "{template.name}" will look to interviewers</p>
                    </div>
                    <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Header Info */}
                    <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg flex gap-3 text-blue-700 dark:text-blue-300 text-sm">
                        <div className="shrink-0 mt-0.5">
                            <ClipboardCheck size={16} />
                        </div>
                        <p>This is a preview mode. Interviewers will use this form to rate candidates on a scale of 1-{ratingScale} and provide feedback.</p>
                    </div>

                    <div className="space-y-6">
                        {template.sections && template.sections.length > 0 ? (
                            template.sections.map((criteria: any, index: number) => (
                                <div key={index} className="space-y-3 pb-6 border-b border-neutral-100 dark:border-neutral-800 last:border-0 last:pb-0">
                                    <div>
                                        <h4 className="font-medium text-neutral-900 dark:text-white text-base">
                                            {index + 1}. {criteria.label}
                                        </h4>
                                        {criteria.description && (
                                            <p className="text-sm text-neutral-500 mt-1">{criteria.description}</p>
                                        )}
                                    </div>

                                    <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-xl space-y-4">
                                        {(criteria.type === 'rating' || criteria.type === 'both' || !criteria.type) && (
                                            <>
                                                <div className="flex justify-between items-center px-2">
                                                    <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">{ratingLabelMin}</span>
                                                    <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">{ratingLabelMax}</span>
                                                </div>
                                                <div className="flex justify-between gap-2">
                                                    {ratingButtons.map((score) => (
                                                        <button
                                                            key={score}
                                                            disabled
                                                            className="flex-1 h-10 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-400 font-medium text-sm flex items-center justify-center hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors cursor-default"
                                                        >
                                                            {score}
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        )}

                                        {(criteria.type === 'text' || criteria.type === 'both') && (
                                            <textarea
                                                disabled
                                                className="w-full p-3 text-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg resize-none text-neutral-400 italic"
                                                rows={2}
                                                placeholder="Interviewers will add their notes and observations here..."
                                            />
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-neutral-500">
                                No criteria defined for this scorecard.
                            </div>
                        )}
                    </div>

                    {/* Recommendation Section Preview */}
                    <div className="pt-6 border-t border-neutral-200 dark:border-neutral-800">
                        <h4 className="font-medium text-neutral-900 dark:text-white mb-4">Overall Recommendation</h4>
                        <div className={`grid gap-3 ${decisionOptions.length > 4 ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-4'}`}>
                            {decisionOptions.map((rec: string, i: number) => (
                                <div key={i} className="h-10 px-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 flex items-center justify-center text-sm font-medium text-neutral-400 truncate" title={rec}>
                                    {rec}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-neutral-200 dark:border-neutral-800 flex justify-end">
                    <Button onClick={onClose}>Close Preview</Button>
                </div>
            </div>
        </div>
    );
};

// Main Component
const ScorecardTemplatesContent = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<any>(null);
    const [previewTemplate, setPreviewTemplate] = useState<any>(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);

    const { data: templates = [], isLoading, error } = useQuery({
        queryKey: ['scorecard-templates'],
        queryFn: async () => {
            const response = await scorecardTemplatesApi.getAll();
            // API returns { success: true, data: [...], ... }
            if (response.data && Array.isArray(response.data.data)) {
                return response.data.data;
            }
            // Fallback for direct array or missing wrapper (though interceptor seems active)
            return Array.isArray(response.data) ? response.data : [];
        },
    });

    const createMutation = useMutation({
        mutationFn: async (data: any) => scorecardTemplatesApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scorecard-templates'] });
            toast.success('Template created successfully');
            setIsModalOpen(false);
            setEditingTemplate(null);
        },
        onError: (err) => {
            console.error('Create error:', err);
            toast.error('Failed to create template');
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => scorecardTemplatesApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scorecard-templates'] });
            toast.success('Template updated successfully');
            setIsModalOpen(false);
            setEditingTemplate(null);
        },
        onError: (err) => {
            console.error('Update error:', err);
            toast.error('Failed to update template');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => scorecardTemplatesApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scorecard-templates'] });
            toast.success('Template deleted successfully');
            setDeleteConfirmation(null);
        },
        onError: (err) => {
            console.error('Delete error:', err);
            toast.error('Failed to delete template');
        },
    });

    const handleSubmit = (e: React.FormEvent, formData: any) => {
        e.preventDefault();
        if (editingTemplate) {
            updateMutation.mutate({ id: editingTemplate.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    if (error) {
        return <div className="text-red-500">Failed to load templates.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Scorecard Templates</h2>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Define criteria for evaluating candidates during interviews.</p>
                </div>
                <Button onClick={() => { setEditingTemplate(null); setIsModalOpen(true); }} className="gap-2">
                    <Plus size={16} />
                    Create Template
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {isLoading ? (
                    <p className="text-neutral-500">Loading...</p>
                ) : templates.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                        <ClipboardCheck className="mx-auto h-12 w-12 text-neutral-400" />
                        <h3 className="mt-2 text-sm font-medium text-neutral-900 dark:text-white">No templates yet</h3>
                        <p className="mt-1 text-sm text-neutral-500">Create your first scorecard template.</p>
                    </div>
                ) : (
                    templates.map((template: any) => (
                        <Card key={template.id} className="hover:shadow-md transition-shadow">
                            <div className="p-4 space-y-2">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-semibold text-neutral-900 dark:text-white">{template.name}</h3>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => setPreviewTemplate(template)}
                                            className="p-1 text-neutral-400 hover:text-blue-600 rounded"
                                            title="Preview Scorecard"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                        </button>
                                        <button
                                            onClick={() => { setEditingTemplate(template); setIsModalOpen(true); }}
                                            className="p-1 text-neutral-400 hover:text-blue-600 rounded"
                                            title="Edit Template"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfirmation(template.id)}
                                            className="p-1 text-neutral-400 hover:text-red-600 rounded"
                                            title="Delete Template"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-sm text-neutral-500">
                                    {(template.sections || []).length} criteria defined
                                </p>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            <ScorecardModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingTemplate(null); }}
                initialData={editingTemplate}
                onSubmit={handleSubmit}
                isLoading={createMutation.isPending || updateMutation.isPending}
            />

            <ScorecardPreviewModal
                isOpen={!!previewTemplate}
                onClose={() => setPreviewTemplate(null)}
                template={previewTemplate}
            />

            <ConfirmationModal
                isOpen={!!deleteConfirmation}
                onCancel={() => setDeleteConfirmation(null)}
                onConfirm={() => deleteConfirmation && deleteMutation.mutate(deleteConfirmation)}
                title="Delete Template"
                message="Are you sure you want to delete this template? Jobs using this template might be affected."
                confirmLabel="Delete"
                variant="danger"
            />
        </div>
    );
};



export const ScorecardTemplatesSettings = () => {
    return (
        <ScorecardsErrorBoundary>
            <ScorecardTemplatesContent />
        </ScorecardsErrorBoundary>
    );
};
