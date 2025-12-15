import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, Button, ConfirmationModal } from '../ui';
import { Plus, Edit2, Trash2, FileText, FileSignature, Mail, Briefcase } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { offerTemplatesApi, settingsApi } from '../../lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Job Description Templates Component
function JobDescriptionTemplates() {
    const navigate = useNavigate();
    const { tenantId } = useParams<{ tenantId: string }>();
    const queryClient = useQueryClient();
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const { data: templates = [], isLoading } = useQuery({
        queryKey: ['job-description-templates'],
        queryFn: async () => {
            try {
                const response = await settingsApi.getByKey('job_description_templates');
                // Handle different API response structures
                const value = response.data?.data?.value || response.data?.value || response.data || [];
                return Array.isArray(value) ? value : [];
            } catch {
                return [];
            }
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const newTemplates = templates.filter((t: any) => t.id !== id);
            return settingsApi.update('job_description_templates', { value: newTemplates, category: 'TEMPLATES' });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['job-description-templates'] });
            toast.success('Template deleted');
            setDeleteId(null);
        },
        onError: () => toast.error('Failed to delete template'),
    });

    return (
        <Card>
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="font-medium text-lg text-neutral-900 dark:text-white">Job Description Templates</h3>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">Create reusable job description templates.</p>
                    </div>
                    <Button className="gap-2" onClick={() => navigate(`/${tenantId}/templates/job-descriptions/new`)}>
                        <Plus size={16} /> Create Template
                    </Button>
                </div>

                {isLoading ? (
                    <div className="text-center py-10 text-neutral-500">Loading...</div>
                ) : templates.length === 0 ? (
                    <div className="text-center py-12 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700">
                        <Briefcase className="mx-auto h-12 w-12 text-neutral-400" />
                        <h3 className="mt-2 text-sm font-medium text-neutral-900 dark:text-white">No job templates</h3>
                        <p className="mt-1 text-sm text-neutral-500">Create your first job description template.</p>
                        <Button variant="secondary" size="sm" className="mt-4" onClick={() => navigate(`/${tenantId}/templates/job-descriptions/new`)}>
                            Create Template
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {templates.map((template: any) => (
                            <div key={template.id} className="group p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:border-blue-500 transition-all bg-white dark:bg-neutral-900">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600">
                                            <Briefcase size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-neutral-900 dark:text-white">{template.name}</h3>
                                            <p className="text-xs text-neutral-500 mt-1">{template.department || 'General'}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => navigate(`/${tenantId}/templates/job-descriptions/${template.id}/edit`)} className="p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded">
                                            <Edit2 size={14} />
                                        </button>
                                        <button onClick={() => setDeleteId(template.id)} className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <ConfirmationModal
                isOpen={!!deleteId}
                onCancel={() => setDeleteId(null)}
                onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
                title="Delete Template"
                message="Are you sure you want to delete this template?"
                confirmLabel="Delete"
                variant="danger"
            />
        </Card>
    );
}

// Email Templates Component
function EmailTemplates() {
    const navigate = useNavigate();
    const { tenantId } = useParams<{ tenantId: string }>();
    const queryClient = useQueryClient();
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const { data: templates = [], isLoading } = useQuery({
        queryKey: ['email-templates-settings'],
        queryFn: async () => {
            try {
                const response = await settingsApi.getByKey('email_templates');
                // Handle different API response structures
                const value = response.data?.data?.value || response.data?.value || response.data || [];
                return Array.isArray(value) ? value : [];
            } catch {
                return [];
            }
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const newTemplates = templates.filter((t: any) => t.id !== id);
            return settingsApi.update('email_templates', { value: newTemplates, category: 'TEMPLATES' });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['email-templates-settings'] });
            toast.success('Template deleted');
            setDeleteId(null);
        },
        onError: () => toast.error('Failed to delete template'),
    });

    return (
        <Card>
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="font-medium text-lg text-neutral-900 dark:text-white">Email Templates</h3>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">Create email templates for candidate communication.</p>
                    </div>
                    <Button className="gap-2" onClick={() => navigate(`/${tenantId}/templates/emails/new`)}>
                        <Plus size={16} /> Create Template
                    </Button>
                </div>

                {isLoading ? (
                    <div className="text-center py-10 text-neutral-500">Loading...</div>
                ) : templates.length === 0 ? (
                    <div className="text-center py-12 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700">
                        <Mail className="mx-auto h-12 w-12 text-neutral-400" />
                        <h3 className="mt-2 text-sm font-medium text-neutral-900 dark:text-white">No email templates</h3>
                        <p className="mt-1 text-sm text-neutral-500">Create your first email template.</p>
                        <Button variant="secondary" size="sm" className="mt-4" onClick={() => navigate(`/${tenantId}/templates/emails/new`)}>
                            Create Template
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {templates.map((template: any) => (
                            <div key={template.id} className="group p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:border-blue-500 transition-all bg-white dark:bg-neutral-900">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600">
                                            <Mail size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-neutral-900 dark:text-white">{template.name}</h3>
                                            <p className="text-xs text-neutral-500 mt-1 truncate max-w-[200px]">Sub: {template.subject}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => navigate(`/${tenantId}/templates/emails/${template.id}/edit`)} className="p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded">
                                            <Edit2 size={14} />
                                        </button>
                                        <button onClick={() => setDeleteId(template.id)} className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <ConfirmationModal
                isOpen={!!deleteId}
                onCancel={() => setDeleteId(null)}
                onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
                title="Delete Template"
                message="Are you sure you want to delete this template?"
                confirmLabel="Delete"
                variant="danger"
            />
        </Card>
    );
}

export function TemplateSettings() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { tenantId } = useParams<{ tenantId: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = (searchParams.get('view') as 'jobs' | 'emails' | 'offers') || 'offers';

    const setActiveTab = (tab: 'jobs' | 'emails' | 'offers') => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.set('view', tab);
            return newParams;
        });
    };

    // Offer Template State
    const [offerTemplates, setOfferTemplates] = useState<any[]>([]);
    const [loadingOffers, setLoadingOffers] = useState(false);
    const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (activeTab === 'offers') {
            fetchOfferTemplates();
        }
    }, [activeTab]);

    const fetchOfferTemplates = async () => {
        setLoadingOffers(true);
        try {
            const response = await offerTemplatesApi.getAll();
            setOfferTemplates(response.data.data || response.data || []);
        } catch (error) {
            console.error('Failed to fetch offer templates', error);
            toast.error(t('offers.templates.loadError'));
        } finally {
            setLoadingOffers(false);
        }
    };

    const handleDeleteOfferTemplate = async () => {
        if (!templateToDelete) return;
        setIsDeleting(true);
        try {
            await offerTemplatesApi.delete(templateToDelete);
            toast.success(t('offers.templates.deleteSuccess', 'Template deleted'));
            fetchOfferTemplates();
        } catch (error) {
            console.error('Failed to delete template', error);
            toast.error(t('offers.templates.deleteError'));
        } finally {
            setIsDeleting(false);
            setTemplateToDelete(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-1 overflow-x-auto">
                <button
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${activeTab === 'offers'
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-blue-900/10'
                        : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400'
                        }`}
                    onClick={() => setActiveTab('offers')}
                >
                    Offer Letters
                </button>
                <button
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${activeTab === 'jobs'
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-blue-900/10'
                        : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400'
                        }`}
                    onClick={() => setActiveTab('jobs')}
                >
                    Job Descriptions
                </button>
                <button
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${activeTab === 'emails'
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-blue-900/10'
                        : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400'
                        }`}
                    onClick={() => setActiveTab('emails')}
                >
                    Email Templates
                </button>
            </div>

            {activeTab === 'offers' && (
                <Card>
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="font-medium text-lg text-neutral-900 dark:text-white">Offer Letter Templates</h3>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">Manage templates for candidate offers.</p>
                            </div>
                            <Button className="gap-2" onClick={() => navigate(`/${tenantId}/offers/templates/new`)}>
                                <Plus size={16} /> Create Template
                            </Button>
                        </div>

                        {loadingOffers ? (
                            <div className="text-center py-10 text-neutral-500">Loading templates...</div>
                        ) : offerTemplates.length === 0 ? (
                            <div className="text-center py-12 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700">
                                <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-3 text-neutral-400">
                                    <FileSignature size={24} />
                                </div>
                                <h3 className="text-sm font-medium text-neutral-900 dark:text-white">No offer templates</h3>
                                <p className="text-xs text-neutral-500 mt-1 mb-4">Create your first offer template to get started.</p>
                                <Button variant="secondary" size="sm" onClick={() => navigate(`/${tenantId}/offers/templates/new`)}>
                                    Create Template
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {offerTemplates.map((template) => (
                                    <div key={template.id} className="group p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:border-blue-500 transition-all bg-white dark:bg-neutral-900">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                                                    <FileText size={20} />
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-neutral-900 dark:text-white group-hover:text-blue-600 transition-colors">{template.name}</h3>
                                                    <p className="text-xs text-neutral-500 mt-1">
                                                        Updated {format(new Date(template.updatedAt), 'MMM d, yyyy')}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => navigate(`/${tenantId}/offers/templates/${template.id}/edit`)}
                                                    className="p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => setTemplateToDelete(template.id)}
                                                    className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {activeTab === 'jobs' && (
                <JobDescriptionTemplates />
            )}

            {activeTab === 'emails' && (
                <EmailTemplates />
            )}

            <ConfirmationModal
                isOpen={!!templateToDelete}
                onCancel={() => setTemplateToDelete(null)}
                onConfirm={handleDeleteOfferTemplate}
                title={t('offers.templates.deleteConfirmTitle', 'Delete Template')}
                message={t('offers.templates.deleteConfirmMessage', 'Are you sure you want to delete this template?')}
                confirmLabel={t('common.delete')}
                cancelLabel={t('common.cancel')}
                isLoading={isDeleting}
                variant="danger"
            />
        </div>
    );
}
