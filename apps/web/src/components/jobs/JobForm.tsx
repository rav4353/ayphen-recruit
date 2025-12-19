import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Check, ChevronRight, ChevronLeft, Wand2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Input, Card, SkillSelector, Modal } from '../ui';
import { aiApi, usersApi, referenceApi, pipelinesApi, settingsApi, scorecardTemplatesApi, departmentsApi } from '../../lib/api';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import { ScorecardModal } from '../settings/ScorecardModal';
import { DepartmentModal } from './DepartmentModal';

export type JobFormData = {
    title: string;
    department: string;
    employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP' | 'TEMPORARY';
    workLocation: 'ONSITE' | 'REMOTE' | 'HYBRID';
    description: string;
    requirements: string;
    responsibilities: string;
    experience: string;
    education: string;
    benefits: string;
    salaryMin: number;
    salaryMax: number;
    salaryCurrency: string;
    showSalary: boolean;
    skills: string[];
    hiringManagerId: string;
    recruiterId: string;
    pipelineId?: string;
    duration?: string;
    durationUnit?: string;
    scorecardTemplateId?: string;
    customFields?: Record<string, any>;
};

interface JobFormProps {
    initialData?: JobFormData;
    mode: 'create' | 'edit';
    onSubmit: (data: JobFormData, requestApproval: boolean) => Promise<void>;
    onCancel: () => void;
    isSubmitting?: boolean;
}

export function JobForm({ initialData, mode, onSubmit, onCancel, isSubmitting = false }: JobFormProps) {
    const { t } = useTranslation();
    const [currentStep, setCurrentStep] = useState(0);
    const [isGenerating, setIsGenerating] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isSubmitSuccess, setIsSubmitSuccess] = useState(false);
    const [isCheckingBias, setIsCheckingBias] = useState(false);
    const [biasIssues, setBiasIssues] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [currencies, setCurrencies] = useState<any[]>([]);
    const [pipelines, setPipelines] = useState<any[]>([]);
    const [scorecardTemplates, setScorecardTemplates] = useState<any[]>([]);
    const [customFieldsConfig, setCustomFieldsConfig] = useState<any[]>([]);
    const [isCreatePipelineModalOpen, setIsCreatePipelineModalOpen] = useState(false);
    const [isCreatingPipeline, setIsCreatingPipeline] = useState(false);

    // Scorecard Modal State
    const [isCreateScorecardModalOpen, setIsCreateScorecardModalOpen] = useState(false);
    const [isCreatingScorecard, setIsCreatingScorecard] = useState(false);

    // Department State
    const [departments, setDepartments] = useState<any[]>([]);
    const [isCreateDepartmentModalOpen, setIsCreateDepartmentModalOpen] = useState(false);
    const [isCreatingDepartment, setIsCreatingDepartment] = useState(false);

    const STEPS = [
        { id: 'basics', title: t('jobs.create.steps.basics') },
        { id: 'details', title: t('jobs.create.steps.details') },
        { id: 'compensation', title: t('jobs.create.steps.compensation') },
        { id: 'review', title: t('jobs.create.steps.review') },
    ];

    const {
        register,
        handleSubmit,
        watch,
        trigger,
        setValue,
        getValues,
        control,
        formState: { errors, isDirty },
        reset
    } = useForm<JobFormData>({
        defaultValues: {
            employmentType: 'FULL_TIME',
            workLocation: 'ONSITE',
            salaryCurrency: 'USD',
            showSalary: false,
            skills: [],
            ...initialData,
        },
    });

    const formData = watch();

    useEffect(() => {
        if (initialData) {
            reset(initialData);
        }
    }, [initialData, reset]);

    // Track unsaved changes
    useUnsavedChanges({
        when: hasUnsavedChanges && isDirty && !isSubmitSuccess,
        message: mode === 'create' ? t('jobs.create.unsavedChanges') : t('jobs.edit.unsavedChanges'),
    });

    const fetchPipelines = async () => {
        try {
            const res = await pipelinesApi.getAll();
            setPipelines(res.data.data);
            // Set default pipeline if available and no pipeline selected (only in create mode usually)
            if (mode === 'create' && !getValues('pipelineId')) {
                const defaultPipeline = res.data.data.find((p: any) => p.isDefault);
                if (defaultPipeline) {
                    setValue('pipelineId', defaultPipeline.id);
                }
            }
        } catch (err) {
            console.error('Failed to fetch pipelines', err);
        }
    };

    // Fetch users
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await usersApi.getAll({ limit: 100 });
                setUsers(res.data.data);
            } catch (err) {
                console.error('Failed to fetch users', err);
            }
        };
        fetchUsers();
    }, []);

    // Fetch currencies
    useEffect(() => {
        const fetchCurrencies = async () => {
            try {
                const res = await referenceApi.getCurrencies();
                setCurrencies(res.data.data);
            } catch (err) {
                console.error('Failed to fetch currencies', err);
            }
        };
        fetchCurrencies();
        fetchCurrencies();
    }, []);

    // Fetch scorecard templates
    const fetchScorecards = async () => {
        try {
            const res = await scorecardTemplatesApi.getAll();
            // Handle different response structures for robustness
            if (res.data && Array.isArray(res.data.data)) {
                setScorecardTemplates(res.data.data);
            } else {
                setScorecardTemplates(Array.isArray(res.data) ? res.data : []);
            }
        } catch (err) {
            console.error('Failed to fetch scorecard templates', err);
            setScorecardTemplates([]);
        }
    };

    useEffect(() => {
        fetchScorecards();
    }, []);

    // ... (existing code)

    const handleCreateScorecard = async (e: React.FormEvent, formData: any) => {
        e.preventDefault();
        setIsCreatingScorecard(true);
        try {
            const res = await scorecardTemplatesApi.create(formData);
            toast.success('Scorecard template created successfully');
            setIsCreateScorecardModalOpen(false);

            // Refresh list
            await fetchScorecards();

            // Auto-select the new template
            // Attempt to find the new ID from response, fallback to re-fetching
            const newId = res.data?.data?.id || res.data?.id;
            if (newId) {
                setValue('scorecardTemplateId', newId);
            }
        } catch (err) {
            console.error('Failed to create scorecard template', err);
            toast.error('Failed to create template');
        } finally {
            setIsCreatingScorecard(false);
        }
    };

    // Fetch pipelines on mount
    useEffect(() => {
        fetchPipelines();
    }, [mode, setValue, getValues]);

    // Fetch custom fields config
    useEffect(() => {
        const fetchCustomFields = async () => {
            try {
                const res = await settingsApi.getByKey('jobFormConfig');
                if (res.data?.data?.value?.customFields) {
                    setCustomFieldsConfig(res.data.data.value.customFields);
                }
            } catch (err) {
                console.error('Failed to fetch custom fields settings', err);
            }
        };
        fetchCustomFields();
    }, []);

    // Fetch departments
    const fetchDepartments = async () => {
        try {
            const res = await departmentsApi.getAll();
            const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
            setDepartments(data);
        } catch (err) {
            console.error('Failed to fetch departments', err);
        }
    };

    useEffect(() => {
        fetchDepartments();
    }, []);

    const handleCreateDepartment = async (data: any) => {
        setIsCreatingDepartment(true);
        try {
            const res = await departmentsApi.create(data);
            toast.success(t('settings.departments.createSuccess', 'Department created successfully'));
            setIsCreateDepartmentModalOpen(false);

            // Refresh list
            await fetchDepartments();

            // Auto-select the new department
            const newDept = res.data?.data || res.data;
            if (newDept && newDept.name) {
                setValue('department', newDept.name);
            }
        } catch (error: any) {
            console.error('Failed to create department', error);
            const message = error?.response?.data?.message || t('common.error');
            toast.error(message);
        } finally {
            setIsCreatingDepartment(false);
        }
    };

    const handleCreatePipeline = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = formData.get('name') as string;
        const description = formData.get('description') as string;

        if (!name) return;

        setIsCreatingPipeline(true);
        try {
            const newPipelineRes = await pipelinesApi.create({
                name,
                description,
                isDefault: false,
                stages: [
                    { name: 'Applied', color: '#6B7280', slaDays: 2 },
                    { name: 'Screening', color: '#3B82F6', slaDays: 3 },
                    { name: 'Interview', color: '#F59E0B', slaDays: 7 },
                    { name: 'Offer', color: '#10B981', slaDays: 5 },
                    { name: 'Hired', color: '#059669', isTerminal: true },
                    { name: 'Rejected', color: '#EF4444', isTerminal: true },
                ]
            });

            toast.success(t('pipelines.createSuccess'));
            setIsCreatePipelineModalOpen(false);

            // Refresh pipelines and select the new one
            await fetchPipelines();

            // The response might contain the created object directly or inside data
            const createdPipeline = (newPipelineRes.data as any).data || newPipelineRes.data;
            if (createdPipeline && createdPipeline.id) {
                setValue('pipelineId', createdPipeline.id);
            }

        } catch (error) {
            console.error('Failed to create pipeline', error);
            toast.error(t('pipelines.createError'));
        } finally {
            setIsCreatingPipeline(false);
        }
    };

    const stripHtmlTags = (html: string): string => {
        if (!html) return '';
        let text = html;
        text = text.replace(/<li>/gi, '• ').replace(/<\/li>/gi, '\n');
        text = text.replace(/<p>/gi, '').replace(/<\/p>/gi, '\n\n');
        text = text.replace(/<br\s*\/?>/gi, '\n');
        text = text.replace(/<[^>]+>/g, '');
        text = text.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        return text.trim();
    };

    const handleGenerateAI = async () => {
        if (!formData.title) {
            toast.error(t('jobs.create.validation.titleRequired'));
            return;
        }

        setIsGenerating(true);
        const toastId = toast.loading(t('jobs.create.form.generating'));

        try {
            const skillsList = formData.skills || [];

            const response = await aiApi.generateJd({
                title: formData.title,
                department: formData.department,
                skills: skillsList,
                experience: formData.experience,
            });

            const { description, requirements, responsibilities, skills } = response.data.data;

            setValue('description', stripHtmlTags(description));
            setValue('requirements', stripHtmlTags(requirements));
            setValue('responsibilities', stripHtmlTags(responsibilities));
            if (skills && Array.isArray(skills)) {
                setValue('skills', skills);
            }

            toast.success(t('jobs.create.form.generateSuccess') || 'Job description generated!', { id: toastId });
        } catch (error) {
            console.error('AI Generation error', error);
            toast.error(t('jobs.create.form.generateError') || 'Failed to generate description', { id: toastId });
        } finally {
            setIsGenerating(false);
        }
    };



    const handleCheckBias = async () => {
        const description = getValues('description');
        if (!description) {
            toast.error(t('jobs.create.validation.descriptionRequired'));
            return;
        }

        setIsCheckingBias(true);
        setBiasIssues([]);
        try {
            const res = await aiApi.checkBias({ text: description });
            const issues = res.data.data.issues;
            setBiasIssues(issues);
            if (issues.length === 0) {
                toast.success(t('jobs.create.messages.noBias'));
            } else {
                toast(t('jobs.create.messages.biasDetected'), { icon: '⚠️' });
            }
        } catch (err) {
            toast.error(t('jobs.create.validation.checkBiasError'));
        } finally {
            setIsCheckingBias(false);
        }
    };



    const nextStep = async () => {
        let isValid = false;
        if (currentStep === 0) {
            const fields = ['title', 'department', 'employmentType', 'workLocation', 'hiringManagerId', 'recruiterId'];
            if (mode === 'create') fields.push('pipelineId');
            if (formData.employmentType === 'PART_TIME') {
                fields.push('duration');
                fields.push('durationUnit');
            }
            // Add custom fields validation for basics
            customFieldsConfig.filter(f => !f.step || f.step === 'basics').forEach(field => {
                if (field.required) fields.push(`customFields.${field.key}`);
            });
            isValid = await trigger(fields as any);
        } else if (currentStep === 1) {
            const fields = ['description', 'requirements'];
            // Add custom fields validation for details
            customFieldsConfig.filter(f => f.step === 'details').forEach(field => {
                if (field.required) fields.push(`customFields.${field.key}`);
            });
            isValid = await trigger(fields as any);
        } else if (currentStep === 2) {
            const fields = ['salaryMin', 'salaryMax'];
            // Add custom fields validation for compensation
            customFieldsConfig.filter(f => f.step === 'compensation').forEach(field => {
                if (field.required) fields.push(`customFields.${field.key}`);
            });
            isValid = await trigger(fields as any);
        } else {
            isValid = true;
        }

        if (isValid) {
            setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
        }
    };

    const prevStep = () => {
        setCurrentStep((prev) => Math.max(prev - 1, 0));
    };

    const onSubmitForm = async (data: JobFormData) => {
        // Set success flag BEFORE calling onSubmit to prevent unsaved changes warning during navigation
        setIsSubmitSuccess(true);
        await onSubmit(data, false);
    };

    const onSubmitWithApproval = async (data: JobFormData) => {
        // Set success flag BEFORE calling onSubmit to prevent unsaved changes warning during navigation
        setIsSubmitSuccess(true);
        await onSubmit(data, true);
    };

    if (isDirty && !hasUnsavedChanges) {
        setHasUnsavedChanges(true);
    }

    const renderCustomFieldsGroup = (fields: any[]) => {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fields.map((field) => {
                    const rules: any = {
                        required: field.required ? t('auth.validation.required') : false
                    };
                    if (field.validationRegex) {
                        try {
                            rules.pattern = {
                                value: new RegExp(field.validationRegex),
                                message: field.validationMessage || 'Invalid format'
                            };
                        } catch (e) {
                            console.warn('Invalid regex for field', field.key);
                        }
                    }
                    if (field.minLength) {
                        rules.minLength = {
                            value: field.minLength,
                            message: `Min length is ${field.minLength}`
                        };
                    }
                    if (field.maxLength) {
                        rules.maxLength = {
                            value: field.maxLength,
                            message: `Max length is ${field.maxLength}`
                        };
                    }

                    return (
                        <div key={field.id} className={field.type === 'textarea' ? 'col-span-full' : ''}>
                            <label className="label">
                                {field.label}
                                {field.required && <span className="text-red-500 ml-1">*</span>}
                            </label>

                            {field.type === 'textarea' ? (
                                <textarea
                                    className="input min-h-[100px]"
                                    placeholder={field.placeholder}
                                    {...register(`customFields.${field.key}`, rules)}
                                />
                            ) : field.type === 'select' ? (
                                <select
                                    className="input"
                                    {...register(`customFields.${field.key}`, rules)}
                                >
                                    <option value="">Select...</option>
                                    {field.options?.map((opt: string) => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            ) : field.type === 'boolean' ? (
                                <div className="flex items-center gap-2 mt-2">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 text-blue-600 border-neutral-300 rounded focus:ring-blue-500"
                                        {...register(`customFields.${field.key}`)}
                                    />
                                    <span className="text-sm text-neutral-700 dark:text-neutral-300">{t('common.yes')}</span>
                                </div>
                            ) : (
                                <Input
                                    type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                                    placeholder={field.placeholder}
                                    itemScope={undefined}
                                    {...register(`customFields.${field.key}`, rules)}
                                    error={errors.customFields?.[field.key]?.message as string}
                                />
                            )}
                            {errors.customFields?.[field.key] && (
                                <p className="text-error text-sm mt-1">{(errors.customFields as any)[field.key]?.message}</p>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderInlineCustomFields = (step: 'basics' | 'details' | 'compensation') => {
        const fields = customFieldsConfig.filter(f => {
            const stepMatch = step === 'basics' ? (!f.step || f.step === 'basics') : f.step === step;
            return stepMatch && f.placement === 'inline';
        });

        if (fields.length === 0) return null;
        return renderCustomFieldsGroup(fields);
    }

    const renderSectionCustomFields = (step: 'basics' | 'details' | 'compensation') => {
        const fields = customFieldsConfig.filter(f => {
            const stepMatch = step === 'basics' ? (!f.step || f.step === 'basics') : f.step === step;
            return stepMatch && (!f.placement || f.placement === 'section');
        });

        if (fields.length === 0) return null;

        // Group by section title
        const groupedFields: Record<string, any[]> = {};
        fields.forEach(f => {
            const title = f.sectionTitle || 'Additional Information';
            if (!groupedFields[title]) groupedFields[title] = [];
            groupedFields[title].push(f);
        });

        return (
            <>
                {Object.entries(groupedFields).map(([title, sectionFields]) => (
                    <div key={title} className="border-t border-neutral-200 dark:border-neutral-700 pt-6 mt-6">
                        <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-4">
                            {title === 'Additional Information' ? t('jobs.create.form.additionalInfo', 'Additional Information') : title}
                        </h3>
                        {renderCustomFieldsGroup(sectionFields)}
                    </div>
                ))}
            </>
        );
    };

    return (
        <div className="space-y-8">
            {/* Steps Indicator - Styled like EditJobPage */}
            <div className="flex items-center justify-between">
                {STEPS.map((step, index) => (
                    <div key={step.id} className="flex items-center flex-1">
                        <div
                            className="flex flex-col items-center flex-1 cursor-pointer"
                            onClick={() => {
                                // Allow clicking previous steps or current step
                                if (index <= currentStep) setCurrentStep(index);
                            }}
                        >
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${index <= currentStep
                                    ? 'bg-blue-600 border-blue-600 text-white'
                                    : 'bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 text-neutral-400'
                                    }`}
                            >
                                {index < currentStep ? <Check size={20} /> : index + 1}
                            </div>
                            <span
                                className={`text-sm mt-2 font-medium ${index <= currentStep
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : 'text-neutral-400'
                                    }`}
                            >
                                {step.title}
                            </span>
                        </div>
                        {index < STEPS.length - 1 && (
                            <div
                                className={`h-0.5 flex-1 mx-4 transition-colors ${index < currentStep
                                    ? 'bg-blue-600'
                                    : 'bg-neutral-200 dark:bg-neutral-800'
                                    }`}
                            />
                        )}
                    </div>
                ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmitForm)}>
                <Card className="p-8">
                    {/* Step 0: Basic Info */}
                    {currentStep === 0 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">{t('jobs.create.steps.basics')}</h2>

                            <Input
                                label={t('jobs.create.form.jobTitle')}
                                error={errors.title?.message}
                                {...register('title', { required: t('jobs.create.validation.titleRequired') })}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="label">{t('jobs.create.form.department')}</label>
                                    <select
                                        className="input"
                                        {...register('department', {
                                            required: t('jobs.create.validation.departmentRequired'),
                                            onChange: (e) => {
                                                if (e.target.value === 'new') {
                                                    setIsCreateDepartmentModalOpen(true);
                                                    setValue('department', ''); // Reset to empty or previous valid value
                                                }
                                            }
                                        })}
                                    >
                                        <option value="">{t('common.select')}...</option>
                                        <option value="new" className="font-medium text-blue-600">+ {t('settings.departments.add', 'Add New Department')}</option>
                                        {departments.map((dept) => (
                                            <option key={dept.id} value={dept.name}>
                                                {dept.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.department && (
                                        <p className="text-error text-sm mt-1">{errors.department.message}</p>
                                    )}
                                </div>

                                {mode === 'create' && (
                                    <div>
                                        <label className="label">{t('jobs.create.form.hiringPipeline')}</label>
                                        <select
                                            className="input"
                                            {...register('pipelineId', {
                                                required: mode === 'create' ? t('jobs.create.validation.pipelineRequired') : false,
                                                onChange: (e) => {
                                                    if (e.target.value === 'new') {
                                                        setIsCreatePipelineModalOpen(true);
                                                        setValue('pipelineId', ''); // Reset to empty or previous valid value
                                                    }
                                                }
                                            })}
                                        >
                                            <option value="">{t('jobs.create.form.selectPipeline')}</option>
                                            <option value="new" className="font-medium text-blue-600">+ {t('pipelines.createPipeline')}</option>
                                            {pipelines.map((pipeline) => (
                                                <option key={pipeline.id} value={pipeline.id}>
                                                    {pipeline.name} {pipeline.isDefault ? `(${t('pipelines.default')})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.pipelineId && (
                                            <p className="text-error text-sm mt-1">{errors.pipelineId.message}</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="label">{t('jobs.create.form.employmentType')}</label>
                                    <select
                                        className="input"
                                        {...register('employmentType', { required: t('jobs.create.validation.employmentTypeRequired') })}
                                    >
                                        <option value="FULL_TIME">Full Time</option>
                                        <option value="PART_TIME">Part Time</option>
                                        <option value="CONTRACT">Contract</option>
                                        <option value="INTERNSHIP">Internship</option>
                                        <option value="TEMPORARY">Temporary</option>
                                    </select>
                                    {errors.employmentType && (
                                        <p className="text-error text-sm mt-1">{errors.employmentType.message}</p>
                                    )}
                                    {formData.employmentType === 'PART_TIME' && (
                                        <div className="mt-4 grid grid-cols-2 gap-4">
                                            <Input
                                                label={t('jobs.create.form.duration', 'Duration')}
                                                placeholder="e.g. 20"
                                                {...register('duration', { required: t('jobs.create.validation.durationRequired', 'Duration is required for part-time jobs') })}
                                                error={errors.duration?.message}
                                            />
                                            <div>
                                                <label className="label">{t('jobs.create.form.durationUnit', 'Per')}</label>
                                                <select
                                                    className="input"
                                                    {...register('durationUnit', { required: t('jobs.create.validation.durationUnitRequired', 'Unit is required') })}
                                                >
                                                    <option value="HOUR">Hour</option>
                                                    <option value="DAY">Day</option>
                                                    <option value="WEEK">Week</option>
                                                    <option value="MONTH">Month</option>
                                                    <option value="YEAR">Year</option>
                                                </select>
                                                {errors.durationUnit && (
                                                    <p className="text-error text-sm mt-1">{errors.durationUnit.message}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="label">{t('jobs.create.form.workLocation')}</label>
                                    <select
                                        className="input"
                                        {...register('workLocation', { required: t('jobs.create.validation.workLocationRequired') })}
                                    >
                                        <option value="ONSITE">Onsite</option>
                                        <option value="REMOTE">Remote</option>
                                        <option value="HYBRID">Hybrid</option>
                                    </select>
                                    {errors.workLocation && (
                                        <p className="text-error text-sm mt-1">{errors.workLocation.message}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="label">{t('jobs.create.form.hiringManager')}</label>
                                    <select
                                        className="input"
                                        {...register('hiringManagerId', { required: t('jobs.create.validation.hiringManagerRequired') })}
                                    >
                                        <option value="">{t('jobs.create.form.selectHiringManager')}</option>
                                        {users.map((user) => (
                                            <option key={user.id} value={user.id}>
                                                {user.firstName} {user.lastName}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.hiringManagerId && (
                                        <p className="text-error text-sm mt-1">{errors.hiringManagerId.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="label">{t('jobs.create.form.recruiter')}</label>
                                    <select
                                        className="input"
                                        {...register('recruiterId', { required: t('jobs.create.validation.recruiterRequired') })}
                                    >
                                        <option value="">{t('jobs.create.form.selectRecruiter')}</option>
                                        {users.map((user) => (
                                            <option key={user.id} value={user.id}>
                                                {user.firstName} {user.lastName}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.recruiterId && (
                                        <p className="text-error text-sm mt-1">{errors.recruiterId.message}</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="label">{t('jobs.create.form.scorecardTemplate', 'Scorecard Template')}</label>
                                <select
                                    className="input"
                                    {...register('scorecardTemplateId', {
                                        onChange: (e) => {
                                            if (e.target.value === 'new') {
                                                setIsCreateScorecardModalOpen(true);
                                                setValue('scorecardTemplateId', '');
                                            }
                                        }
                                    })}
                                >
                                    <option value="">{t('jobs.create.form.selectScorecard', 'Default (Standard Scorecard)')}</option>
                                    {scorecardTemplates.map((template) => (
                                        <option key={template.id} value={template.id}>
                                            {template.name}
                                        </option>
                                    ))}
                                    <option value="new" className="font-medium text-blue-600">+ Create New Template</option>
                                </select>
                            </div>

                            {renderInlineCustomFields('basics')}

                            {renderSectionCustomFields('basics')}
                        </div>
                    )}

                    <ScorecardModal
                        isOpen={isCreateScorecardModalOpen}
                        onClose={() => setIsCreateScorecardModalOpen(false)}
                        onSubmit={handleCreateScorecard}
                        isLoading={isCreatingScorecard}
                        title="Create New Scorecard Template"
                    />

                    <DepartmentModal
                        isOpen={isCreateDepartmentModalOpen}
                        onClose={() => setIsCreateDepartmentModalOpen(false)}
                        onSubmit={handleCreateDepartment}
                        isLoading={isCreatingDepartment}
                    />

                    {/* Step 1: Job Details */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">{t('jobs.create.steps.details')}</h2>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={handleGenerateAI}
                                    disabled={isGenerating || !formData.title}
                                    className="gap-2"
                                >
                                    <Wand2 size={16} className={isGenerating ? 'animate-spin' : ''} />
                                    {isGenerating ? t('jobs.create.form.generating') : t('jobs.create.form.generateAI')}
                                </Button>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="label">{t('jobs.create.form.description')}</label>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            onClick={handleCheckBias}
                                            isLoading={isCheckingBias}
                                            className="text-xs h-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                                        >
                                            <AlertTriangle size={12} className="mr-1" /> {t('jobs.create.form.checkBias')}
                                        </Button>
                                    </div>
                                </div>
                                <textarea
                                    className="input min-h-[120px]"
                                    {...register('description', { required: t('jobs.create.validation.descriptionRequired') })}
                                />
                                {errors.description && (
                                    <p className="text-error text-sm mt-1">{errors.description.message}</p>
                                )}

                                {biasIssues.length > 0 && (
                                    <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm animate-in fade-in slide-in-from-top-2">
                                        <p className="font-medium text-yellow-800 dark:text-yellow-200 mb-1 flex items-center gap-2">
                                            <AlertTriangle size={14} />
                                            {t('jobs.create.messages.potentialBias')}
                                        </p>
                                        <ul className="list-disc list-inside space-y-1 text-yellow-700 dark:text-yellow-300 ml-1">
                                            {biasIssues.map((issue, i) => (
                                                <li key={i}>
                                                    <span className="font-medium">"{issue.term}"</span> - {issue.suggestion ? `Try: ${issue.suggestion}` : issue.type}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="label">{t('jobs.create.form.experience')}</label>
                                    <input
                                        className="input"
                                        placeholder={t('jobs.create.form.experiencePlaceholder')}
                                        {...register('experience')}
                                    />
                                </div>
                                <div>
                                    <label className="label">{t('jobs.create.form.education')}</label>
                                    <input
                                        className="input"
                                        placeholder={t('jobs.create.form.educationPlaceholder')}
                                        {...register('education')}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="label">{t('jobs.create.form.requirements')}</label>
                                <textarea
                                    className="input min-h-[120px]"
                                    {...register('requirements', { required: t('jobs.create.validation.requirementsRequired') })}
                                />
                                {errors.requirements && (
                                    <p className="text-error text-sm mt-1">{errors.requirements.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="label">{t('jobs.create.form.responsibilities')}</label>
                                <textarea
                                    className="input min-h-[120px]"
                                    {...register('responsibilities')}
                                />
                            </div>

                            <div>
                                <label className="label">{t('jobs.create.form.benefits')}</label>
                                <textarea
                                    className="input min-h-[100px]"
                                    {...register('benefits')}
                                />
                            </div>

                            <Controller
                                name="skills"
                                control={control}
                                render={({ field }) => (
                                    <SkillSelector
                                        value={field.value}
                                        onChange={field.onChange}
                                        label={t('jobs.create.form.skills')}
                                        placeholder={t('jobs.create.form.skillsPlaceholder')}
                                    />
                                )}
                            />






                            {renderInlineCustomFields('details')}

                            {renderSectionCustomFields('details')}
                        </div>
                    )}

                    {/* Step 2: Compensation */}
                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">{t('jobs.create.steps.compensation')}</h2>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Input
                                    label={t('jobs.create.form.minSalary')}
                                    type="number"
                                    {...register('salaryMin', {
                                        required: t('jobs.create.validation.minSalaryRequired'),
                                        min: { value: 0, message: t('jobs.create.validation.salaryPositive') }
                                    })}
                                    error={errors.salaryMin?.message}
                                />
                                <Input
                                    label={t('jobs.create.form.maxSalary')}
                                    type="number"
                                    {...register('salaryMax', {
                                        required: t('jobs.create.validation.maxSalaryRequired'),
                                        min: { value: 0, message: t('jobs.create.validation.salaryPositive') }
                                    })}
                                    error={errors.salaryMax?.message}
                                />
                                <div>
                                    <label className="label">{t('jobs.create.form.currency')}</label>
                                    <select className="input" {...register('salaryCurrency')}>
                                        {currencies.length > 0 ? (
                                            currencies.map((currency) => (
                                                <option key={currency.code} value={currency.code}>
                                                    {currency.code} ({currency.symbol}) - {currency.name}
                                                </option>
                                            ))
                                        ) : (
                                            <option value="USD">USD ($)</option>
                                        )}
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="showSalary"
                                    className="w-4 h-4 text-blue-600 border-neutral-300 rounded focus:ring-blue-500"
                                    {...register('showSalary')}
                                />
                                <label htmlFor="showSalary" className="text-sm text-neutral-700 dark:text-neutral-300">
                                    {t('jobs.create.form.showSalary')}
                                </label>
                            </div>

                            {renderInlineCustomFields('compensation')}

                            {renderSectionCustomFields('compensation')}
                        </div>
                    )}

                    {/* Step 3: Review */}
                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">{t('jobs.create.steps.review')}</h2>

                            <div className="space-y-6 bg-neutral-50 dark:bg-neutral-800/50 p-6 rounded-lg">
                                {/* Basics Section */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="font-medium text-neutral-900 dark:text-white mb-2">{t('jobs.create.steps.basics')}</h3>
                                        <p className="text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
                                            <span className="block"><strong>{t('jobs.create.form.jobTitle')}:</strong> {formData.title}</span>
                                            <span className="block"><strong>{t('jobs.create.form.department')}:</strong> {formData.department}</span>
                                            <span className="block"><strong>{t('jobs.create.form.employmentType')}:</strong> {formData.employmentType}</span>
                                            <span className="block"><strong>{t('jobs.create.form.workLocation')}:</strong> {formData.workLocation}</span>
                                        </p>
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-neutral-900 dark:text-white mb-2">Hiring Team & Pipeline</h3>
                                        <p className="text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
                                            <span className="block"><strong>{t('jobs.create.form.hiringManager')}:</strong> {users.find(u => u.id === formData.hiringManagerId)?.firstName} {users.find(u => u.id === formData.hiringManagerId)?.lastName}</span>
                                            <span className="block"><strong>{t('jobs.create.form.recruiter')}:</strong> {users.find(u => u.id === formData.recruiterId)?.firstName} {users.find(u => u.id === formData.recruiterId)?.lastName}</span>
                                            <span className="block"><strong>{t('jobs.create.form.hiringPipeline')}:</strong> {pipelines.find(p => p.id === formData.pipelineId)?.name}</span>
                                        </p>
                                    </div>
                                </div>

                                {/* Details Section */}
                                <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
                                    <h3 className="font-medium text-neutral-900 dark:text-white mb-3">{t('jobs.create.steps.details')}</h3>
                                    <div className="space-y-4 text-sm text-neutral-600 dark:text-neutral-400">

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {formData.experience && (
                                                <p><strong>{t('jobs.create.form.experience')}:</strong> {formData.experience}</p>
                                            )}
                                            {formData.education && (
                                                <p><strong>{t('jobs.create.form.education')}:</strong> {formData.education}</p>
                                            )}
                                        </div>

                                        {formData.description && (
                                            <div>
                                                <strong>{t('jobs.create.form.description')}:</strong>
                                                <p className="mt-1 whitespace-pre-wrap">{formData.description}</p>
                                            </div>
                                        )}
                                        {formData.requirements && (
                                            <div>
                                                <strong>{t('jobs.create.form.requirements')}:</strong>
                                                <p className="mt-1 whitespace-pre-wrap">{formData.requirements}</p>
                                            </div>
                                        )}
                                        {formData.responsibilities && (
                                            <div>
                                                <strong>{t('jobs.create.form.responsibilities')}:</strong>
                                                <p className="mt-1 whitespace-pre-wrap">{formData.responsibilities}</p>
                                            </div>
                                        )}
                                        {formData.benefits && (
                                            <div>
                                                <strong>{t('jobs.create.form.benefits')}:</strong>
                                                <p className="mt-1 whitespace-pre-wrap">{formData.benefits}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Compensation Section */}
                                <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
                                    <h3 className="font-medium text-neutral-900 dark:text-white mb-2">{t('jobs.create.steps.compensation')}</h3>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                        <strong>Range:</strong> {formData.salaryCurrency} {formData.salaryMin?.toLocaleString()} - {formData.salaryMax?.toLocaleString()}<br />
                                        <strong>{t('jobs.create.form.showSalary')}:</strong> {formData.showSalary ? t('common.yes') : t('common.no')}
                                    </p>
                                </div>

                                {/* Skills Section */}
                                {formData.skills && formData.skills.length > 0 && (
                                    <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
                                        <h3 className="font-medium text-neutral-900 dark:text-white mb-2">{t('jobs.create.form.skills')}</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {formData.skills.map((skill, index) => (
                                                <span key={index} className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded text-sm text-neutral-700 dark:text-neutral-300">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Custom Fields Section - only show if at least one field has a value */}
                                {customFieldsConfig.length > 0 && formData.customFields &&
                                    customFieldsConfig.some(field => {
                                        const value = formData.customFields?.[field.key];
                                        return value || value === false || value === 0;
                                    }) && (
                                        <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
                                            <h3 className="font-medium text-neutral-900 dark:text-white mb-2">{t('jobs.create.form.additionalInfo')}</h3>
                                            <div className="text-sm text-neutral-600 dark:text-neutral-400 grid grid-cols-2 gap-x-4 gap-y-2">
                                                {customFieldsConfig.map((field) => {
                                                    const value = formData.customFields?.[field.key];
                                                    if (!value && value !== false && value !== 0) return null;
                                                    return (
                                                        <div key={field.key}>
                                                            <span className="font-medium">{field.label}:</span> {typeof value === 'boolean' ? (value ? t('common.yes') : t('common.no')) : value.toString()}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                            </div>

                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-800">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                                if (currentStep === 0) {
                                    onCancel();
                                } else {
                                    prevStep();
                                }
                            }}
                            className="gap-2"
                        >
                            <ChevronLeft size={16} />
                            {currentStep === 0 ? t('common.cancel') : t('common.previous')}
                        </Button>

                        {currentStep < STEPS.length - 1 ? (
                            <Button type="button" onClick={nextStep} className="gap-2">
                                {t('common.next')}
                                <ChevronRight size={16} />
                            </Button>
                        ) : (
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    isLoading={isSubmitting}
                                    onClick={handleSubmit(onSubmitWithApproval)}
                                    className="gap-2"
                                >
                                    {t('jobs.create.form.submitApproval')}
                                </Button>
                                <Button
                                    type="submit"
                                    isLoading={isSubmitting}
                                    className="gap-2"
                                >
                                    {mode === 'create' ? t('jobs.create.form.create') : t('common.saveChanges')}
                                </Button>
                            </div>
                        )}
                    </div>
                </Card>
            </form>

            <Modal
                isOpen={isCreatePipelineModalOpen}
                onClose={() => setIsCreatePipelineModalOpen(false)}
                title={t('pipelines.createPipeline')}
            >
                <form onSubmit={handleCreatePipeline} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('pipelines.pipelineName')}</label>
                        <Input name="name" required placeholder="e.g. Engineering Hiring" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('pipelines.description')}</label>
                        <Input name="description" placeholder="Brief description of this pipeline" />
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <Button type="button" variant="ghost" onClick={() => setIsCreatePipelineModalOpen(false)}>{t('common.cancel')}</Button>
                        <Button type="submit" isLoading={isCreatingPipeline}>{t('pipelines.createPipeline')}</Button>
                    </div>
                </form>
            </Modal>
        </div >
    );
}
