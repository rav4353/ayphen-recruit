import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    Button,
    Input,
    Label,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useQuery } from '@tanstack/react-query';
import { communicationApi } from '../../lib/api';
import { SmtpConfigurationWarning } from '../common';

const bulkEmailSchema = z.object({
    subject: z.string().min(1, 'Subject is required'),
    message: z.string().min(1, 'Message is required'),
});

type BulkEmailFormData = z.infer<typeof bulkEmailSchema>;

interface BulkEmailModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (subject: string, message: string) => Promise<void>;
    recipientCount: number;
}

export function BulkEmailModal({ isOpen, onClose, onSend, recipientCount }: BulkEmailModalProps) {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        control,
        setValue,
        reset,
        formState: { errors }
    } = useForm<BulkEmailFormData>({
        resolver: zodResolver(bulkEmailSchema),
        defaultValues: { subject: '', message: '' }
    });

    useEffect(() => {
        if (isOpen) {
            reset({ subject: '', message: '' });
        }
    }, [isOpen, reset]);

    const { data: templatesResponse } = useQuery({
        queryKey: ['email-templates'],
        queryFn: () => communicationApi.getTemplates(),
        enabled: isOpen,
    });

    const templates = templatesResponse?.data?.data || [];

    const onFormSubmit = async (data: BulkEmailFormData) => {
        setIsLoading(true);
        try {
            await onSend(data.subject, data.message);
            onClose();
            reset();
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const [selectedTemplateId, setSelectedTemplateId] = useState('');

    const handleTemplateSelect = (templateId: string) => {
        setSelectedTemplateId(templateId);
        const template = templates.find((t: any) => t.id === templateId);
        if (template) {
            setValue('subject', template.subject);
            setValue('message', template.body);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-2xl p-0 max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
                    <DialogTitle className="text-lg font-semibold">
                        {t('candidates.bulkEmailTitle', 'Send Email to {{count}} Candidates', { count: recipientCount })}
                    </DialogTitle>
                </DialogHeader>
                <div className="px-6 pt-4">
                    <SmtpConfigurationWarning />
                </div>
                <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col flex-1 overflow-hidden">
                    <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                Use Template
                            </Label>
                            <Select value={selectedTemplateId} onValueChange={handleTemplateSelect}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a template..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {templates && Array.isArray(templates) && templates.map((t: any) => (
                                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Input
                            label={t('candidates.emailSubject', 'Subject')}
                            {...register('subject')}
                            placeholder={t('candidates.emailSubjectPlaceholder', 'e.g. Interview Invitation')}
                            error={errors.subject?.message}
                        />

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                {t('candidates.emailMessage', 'Message')}
                            </Label>
                            <div className="min-h-[250px] [&_.ql-container]:rounded-b-lg [&_.ql-toolbar]:rounded-t-lg [&_.ql-toolbar]:border-neutral-200 dark:[&_.ql-toolbar]:border-neutral-700 [&_.ql-container]:border-neutral-200 dark:[&_.ql-container]:border-neutral-700 [&_.ql-editor]:min-h-[180px]">
                                <Controller
                                    name="message"
                                    control={control}
                                    render={({ field }) => (
                                        <ReactQuill
                                            theme="snow"
                                            value={field.value}
                                            onChange={field.onChange}
                                            className="h-full"
                                        />
                                    )}
                                />
                            </div>
                            {errors.message && (
                                <p className="text-xs text-red-500">{errors.message.message}</p>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3 px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 shrink-0">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading} className="w-full sm:w-auto">
                            {t('common.cancel', 'Cancel')}
                        </Button>
                        <Button type="submit" isLoading={isLoading} className="w-full sm:w-auto">
                            {t('common.send', 'Send Email')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
