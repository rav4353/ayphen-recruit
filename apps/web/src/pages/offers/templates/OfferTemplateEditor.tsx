import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { offerTemplatesApi } from '../../../lib/api';
import { Button, Input } from '../../../components/ui';
import { Save, ArrowLeft, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

const PLACEHOLDERS = [
    { label: 'candidateName', value: '{{CandidateName}}' },
    { label: 'jobTitle', value: '{{JobTitle}}' },
    { label: 'startDate', value: '{{StartDate}}' },
    { label: 'salary', value: '{{Salary}}' },
    { label: 'managerName', value: '{{ManagerName}}' },
    { label: 'department', value: '{{Department}}' },
    { label: 'location', value: '{{Location}}' },
    { label: 'bonus', value: '{{Bonus}}' },
    { label: 'equity', value: '{{Equity}}' },
];

export function OfferTemplateEditor() {
    const { t } = useTranslation();
    const { tenantId, templateId } = useParams<{ tenantId: string; templateId: string }>();
    const navigate = useNavigate();
    const isEditMode = templateId && templateId !== 'new';

    const [name, setName] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isEditMode) {
            fetchTemplate();
        }
    }, [templateId]);

    const fetchTemplate = async () => {
        try {
            const response = await offerTemplatesApi.getOne(templateId!);
            const template = response.data.data || response.data;
            setName(template.name);
            setContent(template.content);
        } catch (error) {
            console.error('Failed to fetch template', error);
            toast.error(t('offers.templates.editor.loadError'));
        }
    };

    const handleSave = async () => {
        if (!name || !content) {
            toast.error(t('offers.templates.editor.fillRequired'));
            return;
        }

        setLoading(true);
        try {
            if (isEditMode) {
                await offerTemplatesApi.update(templateId!, { name, content });
                toast.success(t('offers.templates.editor.updateSuccess'));
            } else {
                await offerTemplatesApi.create({ name, content });
                toast.success(t('offers.templates.editor.createSuccess'));
            }
            navigate(`/${tenantId}/offers/templates`);
        } catch (error) {
            console.error('Failed to save template', error);
            toast.error(t('offers.templates.editor.saveError'));
        } finally {
            setLoading(false);
        }
    };

    const copyPlaceholder = (value: string) => {
        navigator.clipboard.writeText(value);
        toast.success(`${t('offers.templates.editor.copied')} ${value}`);
    };

    return (
        <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate(`/${tenantId}/offers/templates`)}>
                        <ArrowLeft size={16} className="mr-2" />
                        {t('offers.templates.editor.back')}
                    </Button>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                        {isEditMode ? t('offers.templates.editor.editTitle') : t('offers.templates.editor.createTitle')}
                    </h1>
                </div>
                <Button onClick={handleSave} disabled={loading}>
                    <Save size={16} className="mr-2" />
                    {t('offers.templates.editor.save')}
                </Button>
            </div>

            <div className="flex gap-6 flex-1 min-h-0">
                <div className="flex-1 flex flex-col gap-4 bg-white dark:bg-neutral-900 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                            {t('offers.templates.editor.nameLabel')}
                        </label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t('offers.templates.editor.namePlaceholder')}
                        />
                    </div>

                    <div className="flex-1 flex flex-col min-h-0">
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                            {t('offers.templates.editor.contentLabel')}
                        </label>
                        <div className="flex-1 overflow-hidden flex flex-col">
                            <ReactQuill
                                theme="snow"
                                value={content}
                                onChange={setContent}
                                className="h-full flex flex-col"
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
                    </div>
                </div>

                <div className="w-64 bg-white dark:bg-neutral-900 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-y-auto">
                    <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">{t('offers.templates.editor.placeholdersTitle')}</h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
                        {t('offers.templates.editor.placeholdersDesc')}
                    </p>
                    <div className="space-y-2">
                        {PLACEHOLDERS.map((placeholder) => (
                            <button
                                key={placeholder.value}
                                onClick={() => copyPlaceholder(placeholder.value)}
                                className="w-full flex items-center justify-between p-2 text-sm text-left rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700 transition-all group"
                            >
                                <span className="text-neutral-700 dark:text-neutral-300 font-mono text-xs">
                                    {t(`offers.templates.editor.placeholders.${placeholder.label}`)}
                                </span>
                                <Copy size={12} className="text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
