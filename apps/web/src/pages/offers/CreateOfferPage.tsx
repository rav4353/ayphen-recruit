import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Eye } from 'lucide-react';
import { offersApi, offerTemplatesApi, applicationsApi } from '../../lib/api';
import { Button, Card, Input } from '../../components/ui';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import toast from 'react-hot-toast';

const offerSchema = z.object({
    salary: z.string().min(1, 'Salary is required'),
    currency: z.string(),
    startDate: z.string().min(1, 'Start date is required'),
    expiresAt: z.string(),
    bonus: z.string(),
    equity: z.string(),
    notes: z.string(),
});

type OfferFormData = z.infer<typeof offerSchema>;

export function CreateOfferPage() {
    const { t } = useTranslation();
    const { tenantId } = useParams<{ tenantId: string }>();
    const navigate = useNavigate();

    const [applications, setApplications] = useState<any[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);

    const [selectedApplicationId, setSelectedApplicationId] = useState('');
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors }
    } = useForm<OfferFormData>({
        resolver: zodResolver(offerSchema),
        defaultValues: {
            salary: '',
            currency: 'USD',
            startDate: '',
            expiresAt: '',
            bonus: '',
            equity: '',
            notes: '',
        }
    });

    const formData = watch();

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [appsRes, templatesRes] = await Promise.all([
                applicationsApi.getAll(), // Ideally filter by status (e.g. INTERVIEW, OFFER)
                offerTemplatesApi.getAll(),
            ]);
            setApplications(appsRes.data.data || appsRes.data);

            const fetchedTemplates = templatesRes.data.data || templatesRes.data;
            console.log('[CreateOfferPage] Fetched Templates Raw:', templatesRes.data);
            console.log('[CreateOfferPage] Fetched Templates Processed:', fetchedTemplates);
            setTemplates(fetchedTemplates);
        } catch (error) {
            console.error('Failed to fetch data', error);
            toast.error(t('offers.create.loadError'));
        }
    };

    const handleTemplateChange = (templateId: string) => {
        if (templateId === 'create_new') {
            window.open(`/${tenantId}/settings?tab=templates`, '_blank');
            return;
        }
        setSelectedTemplateId(templateId);
        const template = templates.find(t => t.id === templateId);
        if (template) {
            // Here we could auto-replace some placeholders if we had the candidate data ready
            // For now, just load the raw content
            setContent(template.content);
        }
    };

    const getProcessedContent = () => {
        let processedContent = content;
        const app = applications.find(a => a.id === selectedApplicationId);

        if (app) {
            const candidateName = app.candidate ? `${app.candidate.firstName || ''} ${app.candidate.lastName || ''}`.trim() : 'Candidate';
            const jobTitle = app.job?.title || 'Position';
            const managerName = app.job?.hiringManager?.firstName ? `${app.job.hiringManager.firstName} ${app.job.hiringManager.lastName || ''}`.trim() : 'Hiring Manager';
            const department = app.job?.department?.name || 'Department';
            const location = app.job?.location?.city || 'Remote';
            
            processedContent = processedContent.replace(/{{CandidateName}}/g, candidateName);
            processedContent = processedContent.replace(/{{JobTitle}}/g, jobTitle);
            processedContent = processedContent.replace(/{{ManagerName}}/g, managerName);
            processedContent = processedContent.replace(/{{Department}}/g, department);
            processedContent = processedContent.replace(/{{Location}}/g, location);
        }

        const formattedSalary = new Intl.NumberFormat('en-US', { style: 'currency', currency: formData.currency }).format(parseFloat(formData.salary || '0'));
        const formattedBonus = formData.bonus ? new Intl.NumberFormat('en-US', { style: 'currency', currency: formData.currency }).format(parseFloat(formData.bonus)) : '';
        const formattedDate = formData.startDate ? new Date(formData.startDate).toLocaleDateString() : '';

        processedContent = processedContent.replace(/{{Salary}}/g, formattedSalary);
        processedContent = processedContent.replace(/{{StartDate}}/g, formattedDate);
        processedContent = processedContent.replace(/{{Bonus}}/g, formattedBonus);
        processedContent = processedContent.replace(/{{Equity}}/g, formData.equity);

        return processedContent;
    };

    const handlePreview = () => {
        const processed = getProcessedContent();
        setContent(processed);
        toast.success(t('offers.create.placeholdersReplaced'));
    };

    const onSubmit = async (data: OfferFormData) => {
        if (!selectedApplicationId || !selectedTemplateId) {
            toast.error(t('offers.create.fillRequired'));
            return;
        }

        setLoading(true);
        const finalContent = getProcessedContent();

        try {
            await offersApi.create({
                applicationId: selectedApplicationId,
                templateId: selectedTemplateId,
                content: finalContent,
                salary: parseFloat(data.salary),
                currency: data.currency,
                startDate: data.startDate,
                expiresAt: data.expiresAt || undefined,
                bonus: data.bonus ? parseFloat(data.bonus) : undefined,
                equity: data.equity,
                notes: data.notes,
            });
            toast.success(t('offers.create.success'));
            navigate(`/${tenantId}/offers`);
        } catch (error) {
            console.error('Failed to create offer', error);
            toast.error(t('offers.create.error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate(`/${tenantId}/offers`)} className="-ml-4">
                        <ArrowLeft size={16} className="mr-2" />
                        {t('common.back')}
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">{t('offers.create.title')}</h1>
                        <p className="text-neutral-500 dark:text-neutral-400 mt-1">{t('offers.create.description')}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button variant="secondary" onClick={handlePreview} className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-700">
                        <Eye size={16} className="mr-2 text-neutral-500" />
                        {t('offers.create.previewAndReplace')}
                    </Button>
                    <Button onClick={handleSubmit(onSubmit)} disabled={loading} className="shadow-lg shadow-blue-500/20">
                        <Save size={16} className="mr-2" />
                        {loading ? t('offers.create.saving') : t('offers.create.saveDraft')}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 space-y-6">
                    <Card className="p-6 space-y-6 border-neutral-200 dark:border-neutral-800 shadow-sm">
                        <div className="border-b border-neutral-100 dark:border-neutral-800 pb-4">
                            <h3 className="font-semibold text-lg text-neutral-900 dark:text-white">{t('offers.create.details')}</h3>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('offers.create.detailsDesc')}</p>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">{t('offers.create.candidateAndJob')}</label>
                                <div className="relative">
                                    <select
                                        className="w-full p-2.5 pl-3 pr-10 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                                        value={selectedApplicationId}
                                        onChange={(e) => setSelectedApplicationId(e.target.value)}
                                    >
                                        <option value="">{t('offers.create.selectCandidate')}</option>
                                        {applications.map((app) => (
                                            <option key={app.id} value={app.id}>
                                                {app.candidate?.firstName || ''} {app.candidate?.lastName || ''} — {app.job?.title || 'Position'}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-neutral-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">{t('offers.create.template')}</label>
                                <div className="relative">
                                    <select
                                        className="w-full p-2.5 pl-3 pr-10 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                                        value={selectedTemplateId}
                                        onChange={(e) => handleTemplateChange(e.target.value)}
                                    >
                                        <option value="">{t('offers.create.selectTemplate')}</option>
                                        {templates.map((t) => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                        <option disabled>──────────</option>
                                        <option value="create_new">➕ {t('offers.create.createNewTemplate', 'Create New Template')}</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-neutral-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                                {templates.length === 0 && (
                                    <p className="mt-1 text-xs text-amber-600 dark:text-amber-500">
                                        {t('offers.create.noTemplates', 'No templates found.')} <button onClick={() => navigate(`/${tenantId}/settings?tab=templates`)} className="underline font-medium hover:text-amber-700">{t('offers.create.createTemplate', 'Create one in Settings')}</button>
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">{t('offers.create.salary')} *</label>
                                    <Input
                                        type="number"
                                        {...register('salary')}
                                        placeholder="0.00"
                                        className="font-mono"
                                        error={errors.salary?.message}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">{t('offers.create.currency')}</label>
                                    <Input
                                        {...register('currency')}
                                        placeholder="USD"
                                        className="uppercase font-mono"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">{t('offers.create.startDate')} *</label>
                                    <Input
                                        type="date"
                                        {...register('startDate')}
                                        error={errors.startDate?.message}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">{t('offers.create.expiresOn')}</label>
                                    <Input
                                        type="date"
                                        {...register('expiresAt')}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">{t('offers.create.bonus')}</label>
                                    <Input
                                        type="number"
                                        {...register('bonus')}
                                        placeholder="0.00"
                                        className="font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">{t('offers.create.equity')}</label>
                                    <Input
                                        {...register('equity')}
                                        placeholder="e.g. 0.1%"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">{t('offers.create.internalNotes')}</label>
                                <textarea
                                    className="w-full p-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                                    rows={3}
                                    {...register('notes')}
                                    placeholder={t('offers.create.notesPlaceholder')}
                                />
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="lg:col-span-8">
                    <Card className="p-0 h-full flex flex-col overflow-hidden border-neutral-200 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900">
                        <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex justify-between items-center">
                            <div>
                                <h3 className="font-semibold text-lg text-neutral-900 dark:text-white">{t('offers.create.preview')}</h3>
                                <p className="text-sm text-neutral-500">{t('offers.create.previewDesc')}</p>
                            </div>
                            <div className="text-xs text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">
                                {t('offers.create.richTextEditor')}
                            </div>
                        </div>
                        <div className="flex-1 bg-white dark:bg-neutral-900">
                            <ReactQuill
                                theme="snow"
                                value={content}
                                onChange={setContent}
                                className="h-[calc(100%-42px)] flex flex-col"
                                modules={{
                                    toolbar: [
                                        [{ 'header': [1, 2, 3, false] }],
                                        ['bold', 'italic', 'underline', 'strike'],
                                        [{ 'color': [] }, { 'background': [] }],
                                        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                        [{ 'align': [] }],
                                        ['link', 'image'],
                                        ['clean']
                                    ]
                                }}
                            />
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
