import React, { useState, Component, ErrorInfo, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { communicationApi } from '../../lib/api';
import { Button, Card, ConfirmationModal, Modal } from '../ui';
import { Plus, Edit, Trash2, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

// Error Boundary Component
interface ErrorBoundaryProps {
    children: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

class EmailTemplatesErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('EmailTemplatesSettings Error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
                        Something went wrong
                    </h3>
                    <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                        {this.state.error?.message || 'Failed to load email templates'}
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
const EmailTemplatesSettingsContent = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<any>(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);

    const { data: templates = [], isLoading, error } = useQuery({
        queryKey: ['email-templates'],
        queryFn: async () => {
            try {
                const response = await communicationApi.getTemplates();
                // Handle wrapped response from ResponseInterceptor
                if (response.data && !Array.isArray(response.data) && Array.isArray(response.data.data)) {
                    return response.data.data;
                }
                return response.data || [];
            } catch (err) {
                console.error('Failed to fetch email templates:', err);
                throw err;
            }
        },
        retry: false,
    });

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            return communicationApi.createTemplate(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['email-templates'] });
            toast.success('Template created successfully');
            setIsModalOpen(false);
            setEditingTemplate(null);
        },
        onError: (error: any) => {
            console.error('Create error:', error);
            toast.error('Failed to create template');
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            return communicationApi.updateTemplate(id, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['email-templates'] });
            toast.success('Template updated successfully');
            setIsModalOpen(false);
            setEditingTemplate(null);
        },
        onError: (error: any) => {
            console.error('Update error:', error);
            toast.error('Failed to update template');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            return communicationApi.deleteTemplate(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['email-templates'] });
            toast.success('Template deleted successfully');
            setDeleteConfirmation(null);
        },
        onError: (error: any) => {
            console.error('Delete error:', error);
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
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Email Templates</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">Manage standard email templates for candidate communication.</p>
                    </div>
                </div>
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400">
                        Failed to load email templates. Please check if the API server is running.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Email Templates</h2>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Manage standard email templates for candidate communication.</p>
                </div>
                <Button onClick={() => { setEditingTemplate(null); setIsModalOpen(true); }} className="gap-2">
                    <Plus size={16} />
                    Create Template
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {isLoading ? (
                    <p className="text-neutral-500 dark:text-neutral-400">Loading...</p>
                ) : templates.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                        <Mail className="mx-auto h-12 w-12 text-neutral-400 dark:text-neutral-500" />
                        <h3 className="mt-2 text-sm font-medium text-neutral-900 dark:text-white">No templates yet</h3>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Create your first email template to get started.</p>
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
                                            className="p-1 text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 rounded"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfirmation(template.id)}
                                            className="p-1 text-neutral-400 hover:text-red-600 dark:hover:text-red-400 rounded"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">Sub: {template.subject}</p>
                                <div className="text-xs text-neutral-400 dark:text-neutral-500">Created by {template.user?.firstName || 'User'}</div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            <TemplateModal
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
                message="Are you sure you want to delete this template? This action cannot be undone."
                confirmLabel="Delete"
                variant="danger"
            />
        </div>
    );
};

const TemplateModal = ({ isOpen, onClose, initialData, onSubmit, isLoading }: any) => {
    const [name, setName] = useState(initialData?.name || '');
    const [subject, setSubject] = useState(initialData?.subject || '');
    const [body, setBody] = useState(initialData?.body || '');

    // Reset form when opening for create or edit
    React.useEffect(() => {
        if (isOpen) {
            setName(initialData?.name || '');
            setSubject(initialData?.subject || '');
            setBody(initialData?.body || '');
        }
    }, [isOpen, initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        onSubmit(e, { name, subject, body });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Template' : 'Create Template'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Template Name</label>
                    <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1 block w-full rounded-md border-neutral-300 dark:border-neutral-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border dark:bg-neutral-800 dark:text-white"
                        placeholder="e.g. Initial Screening Invite"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Email Subject</label>
                    <input
                        type="text"
                        required
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="mt-1 block w-full rounded-md border-neutral-300 dark:border-neutral-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border dark:bg-neutral-800 dark:text-white"
                        placeholder="e.g. Invitation to Interview at Ayphen"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Email Body</label>
                    <textarea
                        required
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        rows={10}
                        className="block w-full rounded-md border-neutral-300 dark:border-neutral-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border dark:bg-neutral-800 dark:text-white"
                        placeholder="Enter the email body content..."
                    />
                    <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                        You can use placeholders like {'{candidate_name}'}, {'{job_title}'}, {'{company_name}'}
                    </p>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700 mt-4">
                    <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
                    <Button type="submit" disabled={isLoading}>{isLoading ? 'Saving...' : 'Save Template'}</Button>
                </div>
            </form>
        </Modal>
    );
};

export const EmailTemplatesSettings = () => {
    return (
        <EmailTemplatesErrorBoundary>
            <EmailTemplatesSettingsContent />
        </EmailTemplatesErrorBoundary>
    );
};

export default EmailTemplatesSettings;


