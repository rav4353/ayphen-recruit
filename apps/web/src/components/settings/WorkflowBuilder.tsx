import { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Mail, Tag, CheckSquare, MessageSquare, Clock, X } from 'lucide-react';
import { Button, Input, Select, Card, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui';
import { workflowsApi } from '../../lib/api';
import { WorkflowAutomation } from '../../lib/types';
import toast from 'react-hot-toast';

interface WorkflowBuilderProps {
    stageId: string;
    workflow?: WorkflowAutomation | null;
    onClose: () => void;
    onSuccess: () => void;
}

interface WorkflowForm {
    name: string;
    description: string;
    trigger: 'STAGE_ENTER' | 'STAGE_EXIT' | 'TIME_IN_STAGE';
    delayMinutes: number;
    actions: {
        type: 'SEND_EMAIL' | 'ADD_TAG' | 'CREATE_TASK' | 'REQUEST_FEEDBACK';
        config: Record<string, any>;
    }[];
}

export function WorkflowBuilder({ stageId, workflow, onClose, onSuccess }: WorkflowBuilderProps) {
    const { t } = useTranslation();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { control, register, handleSubmit, watch, formState: { errors } } = useForm<WorkflowForm>({
        defaultValues: {
            name: workflow?.name || '',
            description: workflow?.description || '',
            trigger: (workflow?.trigger as any) || 'STAGE_ENTER',
            delayMinutes: workflow?.delayMinutes || 0,
            actions: workflow?.actions?.map(a => ({
                type: a.type as any, // Cast to any to avoid strict type mismatch during initialization
                config: a.config || {} // Ensure config is an object
            })) || [
                    { type: 'SEND_EMAIL', config: { subject: '', body: '', to: 'candidate' } }
                ]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "actions"
    });

    const triggerType = watch('trigger');

    const onSubmit = async (data: WorkflowForm) => {
        setIsSubmitting(true);
        try {
            // Ensure config objects are clean
            const cleanedData = {
                ...data,
                actions: data.actions.map(action => ({
                    type: action.type,
                    config: action.config || {}
                }))
            };

            if (workflow) {
                await workflowsApi.update(workflow.id, cleanedData);
                toast.success(t('workflows.updateSuccess', 'Workflow updated successfully'));
            } else {
                await workflowsApi.create({
                    ...cleanedData,
                    stageId,
                    conditions: {} // Empty conditions for now
                });
                toast.success(t('workflows.createSuccess', 'Workflow created successfully'));
            }
            onSuccess();
        } catch (error: any) {
            console.error('Failed to save workflow:', error);
            const errorMessage = error.response?.data?.message || t('workflows.saveError', 'Failed to save workflow');
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const actionTypes = [
        { value: 'SEND_EMAIL', label: 'Send Email', icon: Mail },
        { value: 'ADD_TAG', label: 'Add Tag', icon: Tag },
        { value: 'CREATE_TASK', label: 'Create Task', icon: CheckSquare },
        { value: 'REQUEST_FEEDBACK', label: 'Request Feedback', icon: MessageSquare },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
                    <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                        {workflow ? t('workflows.editTitle', 'Edit Automation') : t('workflows.createTitle', 'Create Automation')}
                    </h2>
                    <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <form id="workflow-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <Input
                            label={t('workflows.name', 'Automation Name')}
                            placeholder={t('workflows.namePlaceholder', 'e.g. Send welcome email')}
                            {...register('name', { required: t('common.required', 'Required') })}
                            error={errors.name?.message}
                        />

                        <Input
                            label={t('workflows.description', 'Description')}
                            placeholder={t('workflows.descriptionPlaceholder', 'Briefly describe what this automation does')}
                            {...register('description')}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    {t('workflows.trigger', 'Trigger')}
                                </label>
                                <Controller
                                    name="trigger"
                                    control={control}
                                    rules={{ required: true }}
                                    render={({ field }) => (
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('workflows.trigger', 'Trigger')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="STAGE_ENTER">
                                                    {t('workflows.triggers.stageEnter', 'When candidate enters stage')}
                                                </SelectItem>
                                                <SelectItem value="STAGE_EXIT">
                                                    {t('workflows.triggers.stageExit', 'When candidate leaves stage')}
                                                </SelectItem>
                                                <SelectItem value="TIME_IN_STAGE">
                                                    {t('workflows.triggers.timeInStage', 'After time in stage')}
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>

                            {triggerType === 'TIME_IN_STAGE' ? (
                                <Input
                                    label={t('workflows.daysInStage', 'Days in Stage')}
                                    type="number"
                                    {...register('delayMinutes', {
                                        valueAsNumber: true,
                                        setValueAs: (v) => v * 1440 // Convert days input to minutes for storage
                                    })}
                                />
                            ) : (
                                <Input
                                    label={t('workflows.delay', 'Delay (minutes)')}
                                    type="number"
                                    leftIcon={<Clock size={16} />}
                                    {...register('delayMinutes', { valueAsNumber: true })}
                                />
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-medium text-neutral-900 dark:text-white">{t('workflows.actions', 'Actions')}</h3>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => append({ type: 'SEND_EMAIL', config: { subject: '', body: '', to: 'candidate' } })}
                                    className="gap-2"
                                >
                                    <Plus size={16} />
                                    {t('workflows.addAction', 'Add Action')}
                                </Button>
                            </div>

                            {fields.map((field, index) => (
                                <Card key={field.id} className="p-4 bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-white dark:bg-neutral-800 rounded-lg shadow-sm">
                                                {(() => {
                                                    const actionType = watch(`actions.${index}.type`);
                                                    const Icon = actionTypes.find(t => t.value === actionType)?.icon || CheckSquare;
                                                    return <Icon size={16} className="text-primary-600" />;
                                                })()}
                                            </div>
                                            <span className="font-medium text-sm">Action {index + 1}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => remove(index)}
                                            className="text-neutral-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <Controller
                                            name={`actions.${index}.type`}
                                            control={control}
                                            render={({ field }) => (
                                                <Select value={field.value} onValueChange={field.onChange}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={t('workflows.actions', 'Actions')} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {actionTypes.map((a) => (
                                                            <SelectItem key={a.value} value={a.value}>
                                                                {a.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />

                                        {/* Action Specific Config */}
                                        {watch(`actions.${index}.type`) === 'SEND_EMAIL' && (
                                            <div className="space-y-4 pl-4 border-l-2 border-neutral-200 dark:border-neutral-700">
                                                {/* Recipient Selection */}
                                                <div>
                                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                                        Send To
                                                    </label>
                                                    <Controller
                                                        name={`actions.${index}.config.to`}
                                                        control={control}
                                                        defaultValue="candidate"
                                                        render={({ field }) => (
                                                            <Select value={field.value || 'candidate'} onValueChange={field.onChange}>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select recipient" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="candidate">Candidate</SelectItem>
                                                                    <SelectItem value="hiring_manager">Hiring Manager</SelectItem>
                                                                    <SelectItem value="recruiter">Recruiter</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        )}
                                                    />
                                                </div>

                                                <Input
                                                    label={t('workflows.emailSubject', 'Subject')}
                                                    {...register(`actions.${index}.config.subject` as const)}
                                                    placeholder="e.g. Next steps for your application at {{company_name}}"
                                                />

                                                <div>
                                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                                        {t('workflows.emailBody', 'Message Body')}
                                                    </label>
                                                    <textarea
                                                        id={`email-body-${index}`}
                                                        className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all min-h-[120px]"
                                                        rows={5}
                                                        {...register(`actions.${index}.config.body` as const)}
                                                        placeholder="Hi {{candidate_name}},

Thank you for applying to the {{job_title}} position at {{company_name}}..."
                                                    />
                                                </div>

                                                {/* Available Variables - Clickable Chips */}
                                                <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-3">
                                                    <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                                                        Click to insert variable:
                                                    </p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {[
                                                            { var: 'candidate_name', label: 'Candidate Name' },
                                                            { var: 'candidate_email', label: 'Candidate Email' },
                                                            { var: 'job_title', label: 'Job Title' },
                                                            { var: 'company_name', label: 'Company Name' },
                                                            { var: 'stage_name', label: 'Stage Name' },
                                                            { var: 'recruiter_name', label: 'Recruiter Name' },
                                                            { var: 'hiring_manager_name', label: 'Hiring Manager' },
                                                            { var: 'application_date', label: 'Application Date' },
                                                        ].map((v) => (
                                                            <button
                                                                key={v.var}
                                                                type="button"
                                                                className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-medium rounded hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors cursor-pointer"
                                                                onClick={() => {
                                                                    const textarea = document.getElementById(`email-body-${index}`) as HTMLTextAreaElement;
                                                                    if (textarea) {
                                                                        const start = textarea.selectionStart;
                                                                        const end = textarea.selectionEnd;
                                                                        const text = textarea.value;
                                                                        const variable = `{{${v.var}}}`;
                                                                        const newText = text.substring(0, start) + variable + text.substring(end);

                                                                        // Update the form value
                                                                        textarea.value = newText;
                                                                        textarea.dispatchEvent(new Event('input', { bubbles: true }));

                                                                        // Move cursor after inserted variable
                                                                        setTimeout(() => {
                                                                            textarea.focus();
                                                                            textarea.setSelectionRange(start + variable.length, start + variable.length);
                                                                        }, 0);
                                                                    }
                                                                }}
                                                                title={`Insert {{${v.var}}}`}
                                                            >
                                                                <span className="opacity-60">{'{{'}</span>
                                                                {v.label}
                                                                <span className="opacity-60">{'}}'}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {watch(`actions.${index}.type`) === 'ADD_TAG' && (
                                            <div className="space-y-3 pl-4 border-l-2 border-neutral-200 dark:border-neutral-700">
                                                <Input
                                                    label={t('workflows.tagName', 'Tag Name')}
                                                    {...register(`actions.${index}.config.tag` as const)}
                                                    placeholder="e.g. interviewed"
                                                />
                                            </div>
                                        )}

                                        {watch(`actions.${index}.type`) === 'CREATE_TASK' && (
                                            <div className="space-y-3 pl-4 border-l-2 border-neutral-200 dark:border-neutral-700">
                                                <Input
                                                    label={t('workflows.taskTitle', 'Task Title')}
                                                    {...register(`actions.${index}.config.title` as const)}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 rounded-b-xl flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose} type="button">
                        {t('common.cancel', 'Cancel')}
                    </Button>
                    <Button type="submit" form="workflow-form" isLoading={isSubmitting}>
                        {workflow ? t('common.saveChanges', 'Save Changes') : t('workflows.create', 'Create Automation')}
                    </Button>
                </div>
            </div>
        </div>
    );
}
