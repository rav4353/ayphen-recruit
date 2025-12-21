import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Plus, Trash, Edit, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Input, Card, Modal, ConfirmationModal } from '../ui';
import { settingsApi } from '../../lib/api';

type FieldType = 'text' | 'number' | 'date' | 'boolean' | 'select' | 'textarea';

interface CustomField {
    id: string;
    label: string;
    key: string; // The property key to store in JSON
    type: FieldType;
    required: boolean;
    placeholder?: string;
    options?: string[]; // For select type
    step: 'basics' | 'details' | 'compensation';
    validationRegex?: string;
    validationMessage?: string;
    minLength?: number;
    maxLength?: number;
    placement?: 'section' | 'inline'; // Default 'section'
    sectionTitle?: string; // Default 'Additional Information'
}

interface JobFormConfig {
    customFields: CustomField[];
}

const VALIDATION_PATTERNS = [
    { label: 'None', value: '' },
    { label: 'Alphanumeric', value: '^[a-zA-Z0-9]+$' },
    { label: 'Alphabets Only', value: '^[a-zA-Z\\s]+$' },
    { label: 'Numbers Only', value: '^\\d+$' },
    { label: 'Email Address', value: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$' },
    { label: 'Phone Number', value: '^\\+?[\\d\\s-]{10,}$' },
    { label: 'URL', value: '^https?:\\/\\/.+' },
    { label: 'Zip Code (5 digits)', value: '^\\d{5}$' },
    { label: 'Date (YYYY-MM-DD)', value: '^\\d{4}-\\d{2}-\\d{2}$' },
    { label: 'Custom Regex', value: 'custom' }
];

export function JobFormSettings() {
    const { t } = useTranslation();
    const [regexType, setRegexType] = useState<string>('');
    const [config, setConfig] = useState<JobFormConfig>({ customFields: [] });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingField, setEditingField] = useState<CustomField | null>(null);
    const [deleteFieldId, setDeleteFieldId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const { register, handleSubmit, reset, watch, setValue, setError, formState: { errors } } = useForm<CustomField>();

    const fieldType = watch('type');
    const placement = watch('placement');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const res = await settingsApi.getByKey('jobFormConfig');
            if (res.data?.data?.value) {
                setConfig(res.data.data.value);
            }
        } catch (error: any) {
            console.error('Failed to load job form settings:', error);
            if (error.response?.status !== 404) {
                toast.error(t('settings.loadError', 'Failed to load settings'));
            }
        } finally {
            // Loading done
        }
    };

    const saveSettings = async (newConfig: JobFormConfig) => {
        try {
            await settingsApi.update('jobFormConfig', {
                value: newConfig,
                category: 'hiring',
                isPublic: false
            });
            setConfig(newConfig);
            toast.success(t('settings.saved'));
        } catch (error) {
            console.error('Failed to save settings', error);
            toast.error(t('settings.saveError'));
        }
    };

    const handleAddField = () => {
        setEditingField(null);
        reset({
            id: crypto.randomUUID(),
            label: '',
            key: '',
            type: 'text',
            required: false,
            placeholder: '',
            options: [],
            step: 'basics',
            validationRegex: '',
            validationMessage: '',
            minLength: undefined,
            maxLength: undefined,
            placement: 'section',
            sectionTitle: ''
        });
        setRegexType('');
        setIsModalOpen(true);
    };

    const handleEditField = (field: CustomField) => {
        setEditingField(field);
        reset(field);

        // Determine regex type
        const pattern = VALIDATION_PATTERNS.find(p => p.value === field.validationRegex);
        if (pattern) {
            setRegexType(pattern.value);
        } else if (field.validationRegex) {
            setRegexType('custom');
        } else {
            setRegexType('');
        }

        setIsModalOpen(true);
    };

    const handleDeleteClick = (fieldId: string) => {
        setDeleteFieldId(fieldId);
    };

    const handleConfirmDelete = async () => {
        if (!deleteFieldId) return;
        const newFields = config.customFields.filter(f => f.id !== deleteFieldId);
        await saveSettings({ ...config, customFields: newFields });
        setDeleteFieldId(null);
    };

    const onSubmit = async (data: CustomField) => {
        if (isSaving) return;

        // Generate key if not provided (camelCase from label)
        if (!data.key) {
            data.key = data.label.toLowerCase().replace(/[^a-z0-9]/g, '');
        }

        // Check for duplicates
        const duplicate = config.customFields.find(f =>
            f.key === data.key && f.id !== (editingField ? editingField.id : '')
        );

        if (duplicate) {
            setError('key', {
                type: 'manual',
                message: t('settings.jobForm.validation.uniqueKey', 'Key must be unique')
            });
            return;
        }

        let newFields = [...config.customFields];

        // Sanitize data
        const sanitizedData = {
            ...data,
            minLength: Number.isNaN(Number(data.minLength)) ? undefined : Number(data.minLength),
            maxLength: Number.isNaN(Number(data.maxLength)) ? undefined : Number(data.maxLength),
            validationRegex: data.validationRegex || undefined,
            validationMessage: data.validationMessage || undefined,
            options: Array.isArray(data.options) ? data.options : [],
            placement: data.placement || 'section',
            sectionTitle: data.placement === 'section' ? (data.sectionTitle || 'Additional Information') : undefined
        };

        if (editingField) {
            const index = newFields.findIndex(f => f.id === editingField.id);
            if (index !== -1) {
                newFields[index] = sanitizedData;
            }
        } else {
            newFields.push(sanitizedData);
        }

        setIsSaving(true);
        try {
            await saveSettings({ ...config, customFields: newFields });
            setIsModalOpen(false);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-medium text-neutral-900 dark:text-white">
                    {t('settings.jobForm.title', 'Job Form Customization')}
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {t('settings.jobForm.description', 'Add custom fields to the job creation form to capture specific requirements.')}
                </p>
            </div>

            <Card className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-medium text-neutral-900 dark:text-white">{t('settings.jobForm.customFields', 'Custom Fields')}</h3>
                    <Button onClick={handleAddField} size="sm" className="gap-2">
                        <Plus size={16} />
                        {t('common.add')}
                    </Button>
                </div>

                {config.customFields.length === 0 ? (
                    <div className="text-center py-8 text-neutral-500 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                        {t('settings.jobForm.noFields', 'No custom fields configured.')}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {config.customFields.map((field) => (
                            <div key={field.id} className="flex items-center justify-between p-4 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded">
                                        <Check size={16} className={field.required ? 'opacity-100' : 'opacity-0'} />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-neutral-900 dark:text-white">{field.label}</h4>
                                        <p className="text-xs text-neutral-500 font-mono">
                                            {field.key} • {field.type} • {t(`settings.jobForm.steps.${field.step || 'basics'}`)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button size="sm" variant="ghost" onClick={() => handleEditField(field)}>
                                        <Edit size={16} />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteClick(field.id)}>
                                        <Trash size={16} />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingField ? t('settings.jobForm.editField', 'Edit Field') : t('settings.jobForm.addField', 'Add Field')}
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input
                        label={t('common.label')}
                        {...register('label', { required: t('auth.validation.required') })}
                        error={errors.label?.message}
                    />

                    <div>
                        <label className="label">{t('settings.jobForm.step', 'Form Page')}</label>
                        <select className="input" {...register('step')}>
                            <option value="basics">{t('settings.jobForm.steps.basics', 'Basic Information')}</option>
                            <option value="details">{t('settings.jobForm.steps.details', 'Job Details')}</option>
                            <option value="compensation">{t('settings.jobForm.steps.compensation', 'Compensation')}</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Placement</label>
                            <select className="input" {...register('placement')}>
                                <option value="section">Separate Section</option>
                                <option value="inline">Inline (Top)</option>
                            </select>
                        </div>
                        {placement !== 'inline' && (
                            <div>
                                <Input
                                    label="Section Title"
                                    placeholder="Additional Information"
                                    {...register('sectionTitle')}
                                />
                            </div>
                        )}
                    </div>

                    <div>    <label className="label">{t('common.type')}</label>
                        <select className="input" {...register('type')}>
                            <option value="text">Text</option>
                            <option value="textarea">Long Text</option>
                            <option value="number">Number</option>
                            <option value="boolean">Checkbox (Yes/No)</option>
                            <option value="date">Date</option>
                            <option value="select">Dropdown</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <Input
                            label={t('common.key')}
                            placeholder="e.g. budgetCode"
                            {...register('key', { required: t('auth.validation.required') })}
                            error={errors.key?.message}
                        />
                        <p className="text-xs text-neutral-500">Unique identifier for storing data</p>
                    </div>

                    {fieldType === 'select' && (
                        <div>
                            <label className="label">{t('common.options')}</label>
                            <textarea

                                className="input min-h-[80px]"
                                placeholder="Enter options separated by comma"
                                {...register('options', {
                                    required: t('auth.validation.required'),
                                    setValueAs: (v) => typeof v === 'string' ? v.split(',').map(s => s.trim()).filter(Boolean) : v
                                })}
                            />
                            {errors.options && <p className="text-error text-xs mt-1">{errors.options.message}</p>}
                            <p className="text-xs text-neutral-500 mt-1">Comma separated values</p>
                        </div>
                    )}

                    <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4 mt-4">
                        <h4 className="text-sm font-medium text-neutral-900 dark:text-white mb-3">Validation Rules</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">

                                <label className="label">{t('settings.jobForm.validation.regex')}</label>
                                <select
                                    className="input mb-2"
                                    value={regexType}
                                    onChange={(e) => {
                                        const type = e.target.value;
                                        setRegexType(type);
                                        if (type !== 'custom') {
                                            setValue('validationRegex', type);
                                        } else {
                                            setValue('validationRegex', ''); // Reset for custom input
                                        }
                                    }}
                                >
                                    {VALIDATION_PATTERNS.map(p => (
                                        <option key={p.label} value={p.value}>{p.label}</option>
                                    ))}
                                </select>

                                {regexType === 'custom' ? (
                                    <Input
                                        placeholder={t('settings.jobForm.validation.regexPlaceholder')}
                                        {...register('validationRegex')}
                                    />
                                ) : (
                                    <input type="hidden" {...register('validationRegex')} />
                                )}
                            </div>
                            <div className="col-span-2">
                                <Input
                                    label={t('settings.jobForm.validation.message')}
                                    placeholder={t('settings.jobForm.validation.messagePlaceholder')}
                                    {...register('validationMessage')}
                                />
                            </div>
                            <Input
                                type="number"
                                label={t('settings.jobForm.validation.min')}
                                {...register('minLength', { valueAsNumber: true })}
                            />
                            <Input
                                type="number"
                                label={t('settings.jobForm.validation.max')}
                                {...register('maxLength', { valueAsNumber: true })}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="field-required"
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            {...register('required')}
                        />
                        <label htmlFor="field-required" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('auth.validation.isRequired')}
                        </label>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isSaving}>
                            {t('common.cancel')}
                        </Button>
                        <Button type="submit" isLoading={isSaving}>
                            {t('common.save')}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={!!deleteFieldId}
                onCancel={() => setDeleteFieldId(null)}
                onConfirm={handleConfirmDelete}
                title={t('common.confirmDelete', 'Delete Field')}
                message={t('settings.jobForm.deleteConfirm', 'Are you sure you want to delete this field? This action cannot be undone.')}
                variant="danger"
                confirmLabel={t('common.delete', 'Delete')}
            />
        </div>
    );
}
