import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { offerTemplatesApi } from '../../../lib/api';
import { Button, Input } from '../../../components/ui';
import { Save, ArrowLeft, Copy, Upload, X, Image } from 'lucide-react';
import toast from 'react-hot-toast';

const PLACEHOLDER_CATEGORIES = [
    {
        category: 'Candidate',
        items: [
            { label: 'Candidate Name', value: '{{CandidateName}}' },
            { label: 'Candidate First Name', value: '{{CandidateFirstName}}' },
            { label: 'Candidate Last Name', value: '{{CandidateLastName}}' },
            { label: 'Candidate Email', value: '{{CandidateEmail}}' },
            { label: 'Candidate Phone', value: '{{CandidatePhone}}' },
            { label: 'Candidate Address', value: '{{CandidateAddress}}' },
        ]
    },
    {
        category: 'Position',
        items: [
            { label: 'Job Title', value: '{{JobTitle}}' },
            { label: 'Department', value: '{{Department}}' },
            { label: 'Location', value: '{{Location}}' },
            { label: 'Work Mode', value: '{{WorkMode}}' },
            { label: 'Employment Type', value: '{{EmploymentType}}' },
            { label: 'Reports To', value: '{{ReportsTo}}' },
        ]
    },
    {
        category: 'Compensation',
        items: [
            { label: 'Base Salary', value: '{{Salary}}' },
            { label: 'Salary (Words)', value: '{{SalaryInWords}}' },
            { label: 'Currency', value: '{{Currency}}' },
            { label: 'Pay Frequency', value: '{{PayFrequency}}' },
            { label: 'Bonus', value: '{{Bonus}}' },
            { label: 'Signing Bonus', value: '{{SigningBonus}}' },
            { label: 'Equity', value: '{{Equity}}' },
            { label: 'Stock Options', value: '{{StockOptions}}' },
            { label: 'Benefits Summary', value: '{{BenefitsSummary}}' },
        ]
    },
    {
        category: 'Dates',
        items: [
            { label: 'Start Date', value: '{{StartDate}}' },
            { label: 'Offer Date', value: '{{OfferDate}}' },
            { label: 'Expiry Date', value: '{{ExpiryDate}}' },
            { label: 'Current Date', value: '{{CurrentDate}}' },
            { label: 'Probation Period', value: '{{ProbationPeriod}}' },
        ]
    },
    {
        category: 'Company',
        items: [
            { label: 'Company Name', value: '{{CompanyName}}' },
            { label: 'Company Address', value: '{{CompanyAddress}}' },
            { label: 'Company Phone', value: '{{CompanyPhone}}' },
            { label: 'Company Website', value: '{{CompanyWebsite}}' },
        ]
    },
    {
        category: 'People',
        items: [
            { label: 'Manager Name', value: '{{ManagerName}}' },
            { label: 'Manager Title', value: '{{ManagerTitle}}' },
            { label: 'HR Contact', value: '{{HRContact}}' },
            { label: 'Recruiter Name', value: '{{RecruiterName}}' },
            { label: 'CEO Name', value: '{{CEOName}}' },
        ]
    },
    {
        category: 'Other',
        items: [
            { label: 'Offer Link', value: '{{OfferLink}}' },
            { label: 'Signature', value: '{{Signature}}' },
            { label: 'Notice Period', value: '{{NoticePeriod}}' },
            { label: 'Working Hours', value: '{{WorkingHours}}' },
            { label: 'PTO Days', value: '{{PTODays}}' },
        ]
    },
];

export function OfferTemplateEditor() {
    const { t } = useTranslation();
    const { tenantId, templateId } = useParams<{ tenantId: string; templateId: string }>();
    const navigate = useNavigate();
    const isEditMode = templateId && templateId !== 'new';

    const [name, setName] = useState('');
    const [content, setContent] = useState('');
    const [letterhead, setLetterhead] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
            setLetterhead(template.letterhead || null);
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

    const handleLetterheadUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error('File size must be less than 2MB');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setLetterhead(reader.result as string);
                toast.success('Letterhead uploaded');
            };
            reader.readAsDataURL(file);
        }
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

                <div className="w-72 flex flex-col gap-4">
                    {/* Letterhead Upload */}
                    <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                        <h3 className="font-semibold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
                            <Image size={16} /> Letterhead
                        </h3>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
                            Upload a letterhead for offer letters.
                        </p>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleLetterheadUpload}
                            accept="image/*"
                            className="hidden"
                        />
                        {letterhead ? (
                            <div className="relative">
                                <img src={letterhead} alt="Letterhead" className="w-full h-24 object-contain border rounded-lg bg-neutral-50 dark:bg-neutral-800" />
                                <button
                                    onClick={() => setLetterhead(null)}
                                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full p-4 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all flex flex-col items-center gap-2"
                            >
                                <Upload size={20} className="text-neutral-400" />
                                <span className="text-xs text-neutral-500">Click to upload</span>
                            </button>
                        )}
                    </div>

                    {/* Placeholders */}
                    <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-y-auto flex-1">
                        <h3 className="font-semibold text-neutral-900 dark:text-white mb-3">{t('offers.templates.editor.placeholdersTitle')}</h3>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
                            {t('offers.templates.editor.placeholdersDesc')}
                        </p>
                        <div className="space-y-4">
                            {PLACEHOLDER_CATEGORIES.map((cat) => (
                                <div key={cat.category}>
                                    <h4 className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-2">{cat.category}</h4>
                                    <div className="space-y-1">
                                        {cat.items.map((placeholder) => (
                                            <button
                                                key={placeholder.value}
                                                onClick={() => copyPlaceholder(placeholder.value)}
                                                className="w-full flex items-center justify-between p-1.5 text-sm text-left rounded hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all group"
                                            >
                                                <span className="text-neutral-700 dark:text-neutral-300 text-xs">
                                                    {placeholder.label}
                                                </span>
                                                <Copy size={10} className="text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
