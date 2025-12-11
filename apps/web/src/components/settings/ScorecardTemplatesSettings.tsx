import React, { useState, Component, ErrorInfo, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scorecardTemplatesApi } from '../../lib/api';
import { Button, Card, ConfirmationModal } from '../ui';
import { Plus, Edit, Trash2, ClipboardCheck } from 'lucide-react';
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

// Main Component
const ScorecardTemplatesContent = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<any>(null);
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
                                            onClick={() => { setEditingTemplate(template); setIsModalOpen(true); }}
                                            className="p-1 text-neutral-400 hover:text-blue-600 rounded"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfirmation(template.id)}
                                            className="p-1 text-neutral-400 hover:text-red-600 rounded"
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
