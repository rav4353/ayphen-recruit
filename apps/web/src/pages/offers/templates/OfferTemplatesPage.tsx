import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Edit2, Trash2, FileText } from 'lucide-react';
import { offerTemplatesApi } from '../../../lib/api';
import { Button, Card, ConfirmationModal } from '../../../components/ui';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export function OfferTemplatesPage() {
    const { t } = useTranslation();
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const navigate = useNavigate();
    const { tenantId } = useParams<{ tenantId: string }>();

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const response = await offerTemplatesApi.getAll();
            const data = response.data?.data || response.data;
            setTemplates(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch templates', error);
            toast.error(t('offers.templates.loadError'));
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (id: string) => {
        setTemplateToDelete(id);
    };

    const confirmDelete = async () => {
        if (!templateToDelete) return;

        setIsDeleting(true);
        try {
            await offerTemplatesApi.delete(templateToDelete);
            fetchTemplates();
        } catch (error) {
            console.error('Failed to delete template', error);
            toast.error(t('offers.templates.deleteError'));
        } finally {
            setIsDeleting(false);
            setTemplateToDelete(null);
        }
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">{t('offers.templates.title')}</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">{t('offers.templates.description')}</p>
                </div>
                <Button onClick={() => navigate(`/${tenantId}/offers/templates/new`)} className="shadow-lg shadow-blue-500/20">
                    <Plus size={18} className="mr-2" />
                    {t('offers.templates.create')}
                </Button>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="p-6 h-48 animate-pulse bg-neutral-100 dark:bg-neutral-800 border-none" />
                    ))}
                </div>
            ) : templates.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-neutral-900 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700">
                    <div className="bg-neutral-50 dark:bg-neutral-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="text-neutral-400" size={32} />
                    </div>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">{t('offers.templates.noTemplates')}</h3>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
                        {t('offers.templates.noTemplatesDesc')}
                    </p>
                    <div className="mt-6">
                        <Button onClick={() => navigate(`/${tenantId}/offers/templates/new`)} variant="secondary">
                            <Plus size={16} className="mr-2" />
                            {t('offers.templates.create')}
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map((template) => (
                        <Card
                            key={template.id}
                            className="group p-6 hover:shadow-xl transition-all duration-300 border-neutral-200 dark:border-neutral-800 hover:border-blue-200 dark:hover:border-blue-900 bg-white dark:bg-neutral-900 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 bg-gradient-to-l from-white via-white to-transparent dark:from-neutral-900 dark:via-neutral-900">
                                <button
                                    onClick={(e) => { e.stopPropagation(); navigate(`/${tenantId}/offers/templates/${template.id}/edit`); }}
                                    className="p-2 text-neutral-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors"
                                    title={t('offers.templates.edit')}
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteClick(template.id); }}
                                    className="p-2 text-neutral-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors"
                                    title={t('offers.templates.delete')}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="flex items-start justify-between mb-6">
                                <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl shadow-sm">
                                    <FileText className="text-blue-600 dark:text-blue-400" size={24} />
                                </div>
                            </div>

                            <div>
                                <h3 className="font-bold text-lg mb-2 text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                                    {template.name}
                                </h3>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                    {t('offers.templates.lastUpdated')} {format(new Date(template.updatedAt), 'MMM d, yyyy')}
                                </p>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <ConfirmationModal
                isOpen={!!templateToDelete}
                onCancel={() => setTemplateToDelete(null)}
                onConfirm={confirmDelete}
                title={t('offers.templates.deleteConfirmTitle')}
                message={t('offers.templates.deleteConfirmMessage')}
                confirmLabel={t('common.delete')}
                cancelLabel={t('common.cancel')}
                isLoading={isDeleting}
                variant="danger"
            />
        </div>
    );
}


