import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { X, Calendar, Clock, MapPin, Link as LinkIcon } from 'lucide-react';
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui';
import { interviewsApi, usersApi } from '../../lib/api';
import { User, InterviewType } from '../../lib/types';
import toast from 'react-hot-toast';

interface ScheduleInterviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    applicationId: string;
    onSuccess: () => void;
}

interface ScheduleInterviewForm {
    type: InterviewType;
    scheduledAt: string;
    duration: number;
    interviewerId: string;
    location?: string;
    meetingLink?: string;
    notes?: string;
}

export function ScheduleInterviewModal({
    isOpen,
    onClose,
    applicationId,
    onSuccess,
}: ScheduleInterviewModalProps) {
    const { t } = useTranslation();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [interviewers, setInterviewers] = useState<User[]>([]);

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
        reset,
    } = useForm<ScheduleInterviewForm>({
        defaultValues: {
            type: 'VIDEO',
            duration: 60,
        },
    });

    useEffect(() => {
        if (isOpen) {
            fetchInterviewers();
        }
    }, [isOpen]);

    const fetchInterviewers = async () => {
        try {
            const response = await usersApi.getAll();
            if (response.data && Array.isArray(response.data.data)) {
                setInterviewers(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch interviewers:', error);
            toast.error(t('interviews.fetchInterviewersError', 'Failed to load interviewers'));
        }
    };

    const onSubmit = async (data: ScheduleInterviewForm) => {
        setIsSubmitting(true);
        try {
            // Convert scheduledAt to ISO format
            const payload = {
                ...data,
                applicationId,
                scheduledAt: new Date(data.scheduledAt).toISOString(),
            };

            console.log('Scheduling interview with payload:', payload);

            const response = await interviewsApi.create(payload);
            console.log('Interview scheduled:', response.data);

            toast.success(t('interviews.scheduleSuccess', 'Interview scheduled successfully'));
            reset();
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Failed to schedule interview:', error);
            console.error('Error response:', error.response?.data);

            const errorMessage = error.response?.data?.message || error.message || 'Failed to schedule interview';
            toast.error(String(errorMessage));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
                    <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                        {t('interviews.scheduleTitle', 'Schedule Interview')}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                {t('interviews.type', 'Interview Type')}
                            </label>
                            <Controller
                                name="type"
                                control={control}
                                rules={{ required: t('common.required', 'Required') }}
                                render={({ field }) => (
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger error={errors.type?.message}>
                                            <SelectValue placeholder={t('interviews.type', 'Interview Type')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PHONE_SCREEN">Phone Screen</SelectItem>
                                            <SelectItem value="VIDEO">Video Interview</SelectItem>
                                            <SelectItem value="ONSITE">On-site Interview</SelectItem>
                                            <SelectItem value="TECHNICAL">Technical Interview</SelectItem>
                                            <SelectItem value="BEHAVIORAL">Behavioral Interview</SelectItem>
                                            <SelectItem value="PANEL">Panel Interview</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>

                        <Input
                            label={t('interviews.duration', 'Duration (minutes)')}
                            type="number"
                            leftIcon={<Clock size={16} />}
                            {...register('duration', {
                                required: t('common.required', 'Required'),
                                min: { value: 15, message: 'Min 15 mins' },
                                valueAsNumber: true,
                            })}
                            error={errors.duration?.message}
                        />
                    </div>

                    <Input
                        label={t('interviews.scheduledAt', 'Date & Time')}
                        type="datetime-local"
                        leftIcon={<Calendar size={16} />}
                        {...register('scheduledAt', { required: t('common.required', 'Required') })}
                        error={errors.scheduledAt?.message}
                    />

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                            {t('interviews.interviewer', 'Interviewer')}
                        </label>
                        <Controller
                            name="interviewerId"
                            control={control}
                            rules={{ required: t('common.required', 'Required') }}
                            render={({ field }) => (
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger error={errors.interviewerId?.message}>
                                        <SelectValue placeholder={t('interviews.selectInterviewer', 'Select interviewer')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {interviewers.map((u) => (
                                            <SelectItem key={u.id} value={u.id}>
                                                {u.firstName} {u.lastName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>

                    <Input
                        label={t('interviews.location', 'Location / Address')}
                        placeholder="Office address or room number"
                        leftIcon={<MapPin size={16} />}
                        {...register('location')}
                    />

                    <Input
                        label={t('interviews.meetingLink', 'Meeting Link')}
                        placeholder="https://meet.google.com/..."
                        leftIcon={<LinkIcon size={16} />}
                        {...register('meetingLink')}
                    />

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                            {t('interviews.notes', 'Notes')}
                        </label>
                        <textarea
                            className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            rows={3}
                            placeholder={t('interviews.notesPlaceholder', 'Add any instructions or context...')}
                            {...register('notes')}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={onClose}>
                            {t('common.cancel', 'Cancel')}
                        </Button>
                        <Button type="submit" isLoading={isSubmitting}>
                            {t('interviews.schedule', 'Schedule Interview')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
