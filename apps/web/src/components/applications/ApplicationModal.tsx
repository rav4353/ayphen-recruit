import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { X, Upload, FileText, CheckCircle } from 'lucide-react';
import { Button, Input } from '../ui';
import { applicationsApi, storageApi, aiApi } from '../../lib/api';
import toast from 'react-hot-toast';

interface ApplicationModalProps {
    isOpen: boolean;
    onClose: () => void;
    jobId: string;
    jobTitle: string;
}

interface ApplicationFormData {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    linkedinUrl?: string;
    portfolioUrl?: string;
    resumeUrl: string;
    coverLetter?: string;
    gdprConsent: boolean;
}

export function ApplicationModal({ isOpen, onClose, jobId, jobTitle }: ApplicationModalProps) {
    const { t } = useTranslation();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const { register, handleSubmit, setValue, formState: { errors } } = useForm<ApplicationFormData>();

    if (!isOpen) return null;

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsParsing(true);
        const toastId = toast.loading(t('applications.parsingResume', 'Parsing resume...'));

        try {
            // Upload
            const uploadResponse = await storageApi.upload(file);
            setValue('resumeUrl', uploadResponse.data.data.url);

            // Parse
            const parseResponse = await aiApi.parseResume(file);
            const data = parseResponse.data.data;

            if (data.firstName) setValue('firstName', data.firstName);
            if (data.lastName) setValue('lastName', data.lastName);
            if (data.email) setValue('email', data.email);
            if (data.phone) setValue('phone', data.phone);
            if (data.linkedinUrl) setValue('linkedinUrl', data.linkedinUrl);

            toast.success(t('candidates.parseSuccess', 'Resume uploaded and parsed!'), { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error(t('candidates.parseError', 'Failed to process resume'), { id: toastId });
        } finally {
            setIsParsing(false);
        }
    };

    const onSubmit = async (data: ApplicationFormData) => {
        setIsSubmitting(true);
        try {
            await applicationsApi.createPublic({
                ...data,
                jobId,
            });
            setIsSuccess(true);
        } catch (error) {
            console.error(error);
            toast.error(t('applications.submitError', 'Failed to submit application. Please try again.'));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl w-full max-w-md p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">{t('applications.successTitle', 'Application Sent!')}</h2>
                    <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                        {t('applications.successMessage', { jobTitle, defaultValue: `Thank you for applying to ${jobTitle}. We have received your application and will review it shortly.` })}
                    </p>
                    <Button onClick={onClose} className="w-full">
                        {t('common.close', 'Close')}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl w-full max-w-2xl my-8">
                <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
                    <div>
                        <h2 className="text-xl font-bold text-neutral-900 dark:text-white">{t('applications.applyFor', { jobTitle, defaultValue: `Apply for ${jobTitle}` })}</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{t('applications.fillForm', 'Please fill out the form below')}</p>
                    </div>
                    <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                    {/* Resume Upload */}
                    <div className="border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors relative">
                        <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3">
                            {isParsing ? <FileText className="animate-pulse" /> : <Upload />}
                        </div>
                        <p className="text-sm font-medium text-neutral-900 dark:text-white">
                            {isParsing ? t('applications.parsingResume', 'Parsing resume...') : t('applications.uploadResume', 'Upload Resume (Auto-fill)')}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                            PDF, DOCX up to 5MB
                        </p>
                        <input
                            type="file"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            accept=".pdf,.docx,.doc"
                            onChange={handleFileUpload}
                            disabled={isParsing}
                        />
                        <input type="hidden" {...register('resumeUrl', { required: t('applications.resumeRequired', 'Resume is required') })} />
                    </div>
                    {errors.resumeUrl && <p className="text-sm text-red-500 text-center">{t('applications.resumeRequired', 'Please upload a resume')}</p>}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label={t('candidates.fields.firstName', 'First Name')}
                            {...register('firstName', { required: t('common.required', 'First name is required') })}
                            error={errors.firstName?.message}
                        />
                        <Input
                            label={t('candidates.fields.lastName', 'Last Name')}
                            {...register('lastName', { required: t('common.required', 'Last name is required') })}
                            error={errors.lastName?.message}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label={t('candidates.fields.email', 'Email')}
                            type="email"
                            {...register('email', { required: t('common.required', 'Email is required') })}
                            error={errors.email?.message}
                        />
                        <Input
                            label={t('candidates.fields.phone', 'Phone')}
                            {...register('phone')}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label={t('candidates.fields.linkedinUrl', 'LinkedIn URL')}
                            {...register('linkedinUrl')}
                        />
                        <Input
                            label={t('candidates.fields.portfolioUrl', 'Portfolio URL')}
                            {...register('portfolioUrl')}
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">{t('applications.coverLetter', 'Cover Letter')}</label>
                        <textarea
                            className="mt-1 w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white min-h-[120px] focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500"
                            {...register('coverLetter')}
                        />
                    </div>

                    <div className="flex items-start gap-2">
                        <input
                            type="checkbox"
                            id="gdpr"
                            className="mt-1 w-4 h-4 text-blue-600 border-neutral-300 rounded focus:ring-blue-500"
                            {...register('gdprConsent', { required: t('common.required', 'You must agree to the privacy policy') })}
                        />
                        <label htmlFor="gdpr" className="text-sm text-neutral-600 dark:text-neutral-400">
                            {t('applications.gdprConsent', 'I agree to the processing of my personal data for recruitment purposes.')}
                        </label>
                    </div>
                    {errors.gdprConsent && <p className="text-sm text-red-500">{errors.gdprConsent.message}</p>}

                    <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                        <Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel', 'Cancel')}</Button>
                        <Button type="submit" isLoading={isSubmitting} disabled={isParsing}>{t('applications.submit', 'Submit Application')}</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
