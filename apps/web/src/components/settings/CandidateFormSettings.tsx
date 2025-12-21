import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Trash, Edit, Check, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Input, Card, Modal, ConfirmationModal } from '../ui';
import { settingsApi } from '../../lib/api';

type FieldType = 'text' | 'number' | 'date' | 'boolean' | 'select' | 'textarea' | 'email' | 'phone' | 'url';

interface CustomCandidateField {
    id: string;
    label: string;
    key: string; // The property key to store in JSON
    type: FieldType;
    required: boolean;
    unique?: boolean; // If true, enforce unique values across all candidates
    placeholder?: string;
    options?: string[]; // For select type
    validationRegex?: string;
    validationMessage?: string;
    minLength?: number;
    maxLength?: number;
    helpText?: string;
}

interface CandidateFormConfig {
    customFields: CustomCandidateField[];
}

const VALIDATION_PATTERNS = [
    { label: 'None', value: '' },
    { label: 'Alphanumeric', value: '^[a-zA-Z0-9]+$' },
    { label: 'Alphabets Only', value: '^[a-zA-Z\\s]+$' },
    { label: 'Numbers Only', value: '^\\d+$' },
    { label: 'Email Address', value: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$' },
    { label: 'Phone Number (Indian)', value: '^[6-9]\\d{9}$' },
    { label: 'Phone Number (International)', value: '^\\+?[\\d\\s-]{10,}$' },
    { label: 'URL', value: '^https?:\\/\\/.+' },
    { label: 'Aadhaar Number', value: '^\\d{12}$' },
    { label: 'PAN Card', value: '^[A-Z]{5}[0-9]{4}[A-Z]{1}$' },
    { label: 'Zip Code (6 digits)', value: '^\\d{6}$' },
    { label: 'Date (YYYY-MM-DD)', value: '^\\d{4}-\\d{2}-\\d{2}$' },
    { label: 'Custom Regex', value: 'custom' }
];

export function CandidateFormSettings() {
    const [regexType, setRegexType] = useState<string>('');
    const [config, setConfig] = useState<CandidateFormConfig>({ customFields: [] });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingField, setEditingField] = useState<CustomCandidateField | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [deleteFieldId, setDeleteFieldId] = useState<string | null>(null);

    const { register, handleSubmit, reset, watch, setValue, setError, formState: { errors } } = useForm<CustomCandidateField>();

    const fieldType = watch('type');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const res = await settingsApi.getByKey('candidateFormConfig');
            if (res.data?.data?.value) {
                setConfig(res.data.data.value);
            }
        } catch (error: any) {
            console.error('Failed to load candidate form settings:', error);
            if (error.response?.status !== 404) {
                toast.error('Failed to load settings');
            }
        }
    };

    const saveSettings = async (newConfig: CandidateFormConfig) => {
        try {
            console.log('Saving candidate form config:', newConfig);
            await settingsApi.update('candidateFormConfig', {
                value: newConfig,
                category: 'hiring',
                isPublic: true // Make public so job applicants can see custom fields
            });
            setConfig(newConfig);
            toast.success('Settings saved successfully');
        } catch (error: any) {
            console.error('Failed to save settings', error);
            console.error('Error response:', error.response?.data);
            toast.error(error.response?.data?.message || 'Failed to save settings');
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
            unique: false,
            placeholder: '',
            options: [],
            validationRegex: '',
            validationMessage: '',
            minLength: undefined,
            maxLength: undefined,
            helpText: ''
        });
        setRegexType('');
        setIsModalOpen(true);
    };

    const handleEditField = (field: CustomCandidateField) => {
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

    const onSubmit = async (data: CustomCandidateField) => {
        if (isSaving) return;

        // Generate key if not provided (camelCase from label)
        if (!data.key) {
            data.key = data.label.toLowerCase().replace(/[^a-z0-9]/g, '');
        }

        // Check for duplicate keys
        const duplicate = config.customFields.find(f =>
            f.key === data.key && f.id !== (editingField ? editingField.id : '')
        );

        if (duplicate) {
            setError('key', {
                type: 'manual',
                message: 'This field key already exists. Please use a unique key.'
            });
            return;
        }

        // Check for duplicate labels
        const duplicateLabel = config.customFields.find(f =>
            f.label.toLowerCase() === data.label.toLowerCase() && f.id !== (editingField ? editingField.id : '')
        );

        if (duplicateLabel) {
            setError('label', {
                type: 'manual',
                message: 'A field with this label already exists. Please use a unique label.'
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
            helpText: data.helpText || undefined
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
                    Candidate Form Customization
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    Add custom fields to the candidate form to capture additional information specific to your hiring process.
                </p>
            </div>

            <Card className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-medium text-neutral-900 dark:text-white">Custom Fields</h3>
                    <Button onClick={handleAddField} size="sm" className="gap-2">
                        <Plus size={16} />
                        Add Field
                    </Button>
                </div>

                {config.customFields.length === 0 ? (
                    <div className="text-center py-12 text-neutral-500 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border-2 border-dashed border-neutral-200 dark:border-neutral-700">
                        <AlertCircle size={48} className="mx-auto mb-3 opacity-50" />
                        <p className="font-medium">No custom fields configured</p>
                        <p className="text-sm mt-1">Click "Add Field" to create your first custom field</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {config.customFields.map((field) => (
                            <div key={field.id} className="flex items-center justify-between p-4 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded">
                                        <Check size={16} className={field.required ? 'opacity-100' : 'opacity-30'} />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-neutral-900 dark:text-white">{field.label}</h4>
                                        <p className="text-xs text-neutral-500 font-mono">
                                            {field.key} • {field.type}
                                            {field.required && ' • Required'}
                                            {field.unique && ' • Unique'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button size="sm" variant="ghost" onClick={() => handleEditField(field)}>
                                        <Edit size={16} />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => handleDeleteClick(field.id)}>
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
                title={editingField ? 'Edit Custom Field' : 'Add Custom Field'}
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input
                        label="Field Label"
                        placeholder="e.g. Years of Experience"
                        {...register('label', { required: 'Label is required' })}
                        error={errors.label?.message}
                    />

                    <div className="space-y-1">
                        <Input
                            label="Field Key"
                            placeholder="e.g. yearsOfExperience"
                            {...register('key', { required: 'Key is required' })}
                            error={errors.key?.message}
                        />
                        <p className="text-xs text-neutral-500">
                            Unique identifier for storing data (camelCase recommended)
                        </p>
                    </div>

                    <div>
                        <label className="label">Field Type</label>
                        <select className="input" {...register('type')}>
                            <option value="text">Text (Short)</option>
                            <option value="textarea">Text (Long)</option>
                            <option value="email">Email</option>
                            <option value="phone">Phone Number</option>
                            <option value="url">URL</option>
                            <option value="number">Number</option>
                            <option value="date">Date</option>
                            <option value="boolean">Checkbox (Yes/No)</option>
                            <option value="select">Dropdown</option>
                        </select>
                    </div>

                    <Input
                        label="Placeholder Text"
                        placeholder="e.g. Enter your experience in years"
                        {...register('placeholder')}
                    />

                    <Input
                        label="Help Text"
                        placeholder="Additional guidance for the user"
                        {...register('helpText')}
                    />

                    {fieldType === 'select' && (
                        <div>
                            <label className="label">Dropdown Options</label>
                            <textarea
                                className="input min-h-[80px]"
                                placeholder="Enter options separated by comma (e.g. 0-1 years, 1-3 years, 3-5 years, 5+ years)"
                                {...register('options', {
                                    required: 'Options are required for dropdown fields',
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
                                <label className="label">Validation Pattern</label>
                                <select
                                    className="input mb-2"
                                    value={regexType}
                                    onChange={(e) => {
                                        const type = e.target.value;
                                        setRegexType(type);
                                        if (type !== 'custom') {
                                            setValue('validationRegex', type);
                                        } else {
                                            setValue('validationRegex', '');
                                        }
                                    }}
                                >
                                    {VALIDATION_PATTERNS.map(p => (
                                        <option key={p.label} value={p.value}>{p.label}</option>
                                    ))}
                                </select>

                                {regexType === 'custom' && (
                                    <Input
                                        placeholder="Enter custom regex pattern"
                                        {...register('validationRegex')}
                                    />
                                )}
                            </div>
                            <div className="col-span-2">
                                <Input
                                    label="Validation Error Message"
                                    placeholder="e.g. Please enter a valid value"
                                    {...register('validationMessage')}
                                />
                            </div>
                            <Input
                                type="number"
                                label="Minimum Length"
                                {...register('minLength', { valueAsNumber: true })}
                            />
                            <Input
                                type="number"
                                label="Maximum Length"
                                {...register('maxLength', { valueAsNumber: true })}
                            />
                        </div>
                    </div>

                    <div className="space-y-3 border-t border-neutral-200 dark:border-neutral-700 pt-4">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="field-required"
                                className="w-4 h-4 text-primary-600 rounded border-neutral-300 focus:ring-primary-500"
                                {...register('required')}
                            />
                            <label htmlFor="field-required" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                Required Field
                            </label>
                        </div>

                        <div className="flex items-start gap-2">
                            <input
                                type="checkbox"
                                id="field-unique"
                                className="w-4 h-4 text-primary-600 rounded border-neutral-300 focus:ring-primary-500 mt-0.5"
                                {...register('unique')}
                            />
                            <div>
                                <label htmlFor="field-unique" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                    Unique Values Only
                                </label>
                                <p className="text-xs text-neutral-500 mt-0.5">
                                    Prevent duplicate values across all candidates for this field
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isSaving}>
                            Cancel
                        </Button>
                        <Button type="submit" isLoading={isSaving}>
                            {editingField ? 'Update Field' : 'Add Field'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={!!deleteFieldId}
                onCancel={() => setDeleteFieldId(null)}
                onConfirm={handleConfirmDelete}
                title="Delete Field"
                message="Are you sure you want to delete this field? This action cannot be undone."
                variant="danger"
                confirmLabel="Delete"
            />
        </div>
    );
}
