import { useState } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Trash2, Briefcase, GraduationCap } from 'lucide-react';
import { Button, Input, Card, CardHeader, Alert } from '../ui';
import { PhoneInput } from '../ui/PhoneInput';
import { ResumeUpload } from './ResumeUpload';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';

export interface Experience {
    title: string;
    company: string;
    startDate?: string;
    endDate?: string;
    current?: boolean;
    description?: string;
}

export interface Education {
    degree: string;
    institution: string;
    year?: string;
}

export interface CandidateFormData {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    currentTitle?: string;
    currentCompany?: string;
    location?: string;
    linkedinUrl?: string;
    portfolioUrl?: string;
    summary?: string;
    skills?: string; // Comma separated for input
    gdprConsent: boolean;
    resumeUrl?: string;
    experience: Experience[];
    education: Education[];
}

interface CandidateFormProps {
    initialData?: Partial<CandidateFormData>;
    onSubmit: (data: CandidateFormData) => Promise<void>;
    isLoading?: boolean;
    submitLabel?: string;
    error?: string;
    enableUnsavedWarning?: boolean;
}

export function CandidateForm({
    initialData,
    onSubmit,
    isLoading = false,
    submitLabel,
    error,
    enableUnsavedWarning = false,
}: CandidateFormProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { tenantId } = useParams<{ tenantId: string }>();

    const {
        register,
        handleSubmit,
        setValue,
        control,
        formState: { errors, isDirty },
    } = useForm<CandidateFormData>({
        defaultValues: {
            experience: [],
            education: [],
            ...initialData
        }
    });

    const { fields: experienceFields, append: appendExperience, remove: removeExperience } = useFieldArray({
        control,
        name: "experience"
    });

    const { fields: educationFields, append: appendEducation, remove: removeEducation } = useFieldArray({
        control,
        name: "education"
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Warn about unsaved changes
    useUnsavedChanges({
        when: enableUnsavedWarning && isDirty && !isSubmitting,
        message: 'You have unsaved changes to this candidate. Are you sure you want to leave?',
    });



    return (
        <div className="space-y-6">
            <Card>
                <CardHeader
                    title={t('candidates.resumeUpload', 'Upload Resume')}
                    description={t('candidates.resumeUploadDescription', 'Upload a resume to auto-fill the form.')}
                />
                <div className="p-6 pt-0">
                    <ResumeUpload
                        onUploadSuccess={(url: string) => setValue('resumeUrl', url)}
                        onParseSuccess={(data: any) => {
                            const options = { shouldValidate: true, shouldDirty: true };
                            let fieldsFound = 0;

                            if (data.firstName) { setValue('firstName', data.firstName, options); fieldsFound++; }
                            if (data.lastName) { setValue('lastName', data.lastName, options); fieldsFound++; }
                            if (data.email) { setValue('email', data.email, options); fieldsFound++; }
                            if (data.phone) { setValue('phone', data.phone, options); fieldsFound++; }
                            if (data.summary) { setValue('summary', data.summary, options); fieldsFound++; }
                            if (data.skills && data.skills.length > 0) {
                                setValue('skills', data.skills.join(', '), options);
                                fieldsFound++;
                            }

                            // Populate Experience
                            if (data.experience && Array.isArray(data.experience)) {
                                removeExperience();
                                data.experience.forEach((exp: any) => {
                                    appendExperience({
                                        title: exp.title || exp.role || '',
                                        company: exp.company || exp.organization || '',
                                        startDate: exp.startDate || exp.start_date || '',
                                        endDate: exp.endDate || exp.end_date || '',
                                        current: exp.current || (!exp.endDate && !exp.end_date) || false,
                                        description: exp.description || exp.summary || ''
                                    });
                                });

                                if (data.experience.length > 0) {
                                    const current = data.experience[0];
                                    const title = current.title || current.role;
                                    const company = current.company || current.organization;
                                    if (title) setValue('currentTitle', title, options);
                                    if (company) setValue('currentCompany', company, options);
                                    fieldsFound++;
                                }
                            }

                            // Populate Education
                            if (data.education && Array.isArray(data.education)) {
                                removeEducation();
                                data.education.forEach((edu: any) => {
                                    // Combine degree and field (major) if available
                                    let degree = edu.degree || '';
                                    if (edu.field && !degree.toLowerCase().includes(edu.field.toLowerCase())) {
                                        degree = degree ? `${degree} in ${edu.field}` : edu.field;
                                    }

                                    appendEducation({
                                        degree: degree,
                                        institution: edu.institution || edu.school || '',
                                        year: edu.year || edu.graduationYear || edu.endDate || ''
                                    });
                                });
                                if (data.education.length > 0) fieldsFound++;
                            }

                            if (fieldsFound > 0) {
                                toast.success(`Extracted ${fieldsFound} fields from resume.`);
                            } else {
                                toast.error('Could not extract any fields. Please check the resume format.');
                            }
                        }}
                        disabled={isSubmitting}
                    />
                </div>
            </Card>

            <form onSubmit={handleSubmit(async (data) => {
                setIsSubmitting(true);
                await onSubmit(data);
                setIsSubmitting(false);
            })} className="space-y-6">
                <Card>
                    <CardHeader
                        title={t('candidates.basicInfo', 'Basic Information')}
                        description={t('candidates.basicInfoDescription', 'Contact details and current role.')}
                    />

                    <div className="p-6 pt-0 space-y-6">
                        {error && <Alert variant="error">{error}</Alert>}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label={t('candidates.fields.firstName', 'First Name')}
                                error={errors.firstName?.message}
                                {...register('firstName', { required: 'First name is required' })}
                            />
                            <Input
                                label={t('candidates.fields.lastName', 'Last Name')}
                                error={errors.lastName?.message}
                                {...register('lastName', { required: 'Last name is required' })}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label={t('candidates.fields.email', 'Email')}
                                type="email"
                                error={errors.email?.message}
                                {...register('email', {
                                    required: 'Email is required',
                                    pattern: {
                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                        message: 'Invalid email address'
                                    }
                                })}
                            />
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-1">
                                    {t('candidates.fields.phone', 'Phone')}
                                </label>
                                <Controller
                                    name="phone"
                                    control={control}
                                    render={({ field }) => (
                                        <PhoneInput
                                            value={field.value || ''}
                                            onChange={field.onChange}
                                            error={errors.phone?.message}
                                        />
                                    )}
                                />
                                {errors.phone && (
                                    <p className="mt-1 text-sm text-red-500">{errors.phone.message}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label={t('candidates.fields.currentTitle', 'Current Title')}
                                {...register('currentTitle')}
                            />
                            <Input
                                label={t('candidates.fields.currentCompany', 'Current Company')}
                                {...register('currentCompany')}
                            />
                        </div>

                        <Input
                            label={t('candidates.fields.location', 'Location')}
                            {...register('location')}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label={t('candidates.fields.linkedinUrl', 'LinkedIn URL')}
                                error={errors.linkedinUrl?.message}
                                {...register('linkedinUrl', {
                                    pattern: {
                                        value: /^(https?:\/\/)?(www\.)?linkedin\.com\/.*$/i,
                                        message: 'Invalid LinkedIn URL'
                                    }
                                })}
                            />
                            <Input
                                label={t('candidates.fields.portfolioUrl', 'Portfolio URL')}
                                error={errors.portfolioUrl?.message}
                                {...register('portfolioUrl', {
                                    pattern: {
                                        value: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
                                        message: 'Invalid URL format'
                                    }
                                })}
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                                {t('candidates.fields.skills', 'Skills (comma separated)')}
                            </label>
                            <input
                                className="mt-1 w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white"
                                placeholder="React, Node.js, TypeScript"
                                {...register('skills')}
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                                {t('candidates.fields.summary', 'Summary')}
                            </label>
                            <textarea
                                className="mt-1 w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white min-h-[100px]"
                                {...register('summary')}
                            />
                        </div>
                    </div>
                </Card>

                {/* Experience Section */}
                <Card>
                    <CardHeader
                        title={t('candidates.experience', 'Experience')}
                        description={t('candidates.experienceDescription', 'Work history and past roles.')}
                        action={
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => appendExperience({ title: '', company: '' })}
                                className="gap-2"
                            >
                                <Plus size={16} />
                                {t('common.add', 'Add')}
                            </Button>
                        }
                    />
                    <div className="p-6 pt-0 space-y-6">
                        {experienceFields.map((field, index) => (
                            <div key={field.id} className="relative p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700">
                                <button
                                    type="button"
                                    onClick={() => removeExperience(index)}
                                    className="absolute top-4 right-4 text-neutral-400 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <Input
                                        label={t('candidates.fields.title', 'Job Title')}
                                        {...register(`experience.${index}.title` as const, { required: true })}
                                        error={errors.experience?.[index]?.title?.message}
                                    />
                                    <Input
                                        label={t('candidates.fields.company', 'Company')}
                                        {...register(`experience.${index}.company` as const, { required: true })}
                                        error={errors.experience?.[index]?.company?.message}
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <Input
                                        label={t('candidates.fields.startDate', 'Start Date')}
                                        placeholder="MM/YYYY"
                                        {...register(`experience.${index}.startDate` as const)}
                                    />
                                    <Input
                                        label={t('candidates.fields.endDate', 'End Date')}
                                        placeholder="MM/YYYY or Present"
                                        {...register(`experience.${index}.endDate` as const)}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                                        {t('candidates.fields.description', 'Description')}
                                    </label>
                                    <textarea
                                        className="mt-1 w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white min-h-[80px]"
                                        {...register(`experience.${index}.description` as const)}
                                    />
                                </div>
                            </div>
                        ))}
                        {experienceFields.length === 0 && (
                            <div className="text-center py-8 text-neutral-500 dark:text-neutral-400 border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-lg">
                                <Briefcase className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                <p>{t('candidates.noExperienceAdded', 'No experience added yet')}</p>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Education Section */}
                <Card>
                    <CardHeader
                        title={t('candidates.education', 'Education')}
                        description={t('candidates.educationDescription', 'Academic background.')}
                        action={
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => appendEducation({ degree: '', institution: '' })}
                                className="gap-2"
                            >
                                <Plus size={16} />
                                {t('common.add', 'Add')}
                            </Button>
                        }
                    />
                    <div className="p-6 pt-0 space-y-6">
                        {educationFields.map((field, index) => (
                            <div key={field.id} className="relative p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700">
                                <button
                                    type="button"
                                    onClick={() => removeEducation(index)}
                                    className="absolute top-4 right-4 text-neutral-400 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <Input
                                        label={t('candidates.fields.degree', 'Degree')}
                                        {...register(`education.${index}.degree` as const, { required: true })}
                                        error={errors.education?.[index]?.degree?.message}
                                    />
                                    <Input
                                        label={t('candidates.fields.institution', 'Institution')}
                                        {...register(`education.${index}.institution` as const, { required: true })}
                                        error={errors.education?.[index]?.institution?.message}
                                    />
                                </div>
                                <div>
                                    <Input
                                        label={t('candidates.fields.year', 'Year')}
                                        {...register(`education.${index}.year` as const)}
                                    />
                                </div>
                            </div>
                        ))}
                        {educationFields.length === 0 && (
                            <div className="text-center py-8 text-neutral-500 dark:text-neutral-400 border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-lg">
                                <GraduationCap className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                <p>{t('candidates.noEducationAdded', 'No education added yet')}</p>
                            </div>
                        )}
                    </div>
                </Card>

                <Card>
                    <div className="p-6">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="gdprConsent"
                                className="w-4 h-4 text-blue-600 border-neutral-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-neutral-800 dark:bg-neutral-700 dark:border-neutral-600"
                                {...register('gdprConsent', { required: 'GDPR consent is required' })}
                            />
                            <label htmlFor="gdprConsent" className="text-sm text-neutral-700 dark:text-neutral-200">
                                {t('candidates.gdprConsent', 'I confirm that I have obtained consent from this candidate to process their personal data.')}
                            </label>
                        </div>
                        {errors.gdprConsent && (
                            <p className="text-sm text-red-500 mt-1">{errors.gdprConsent.message}</p>
                        )}
                    </div>
                </Card>

                <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="secondary" onClick={() => navigate(`/${tenantId}/candidates`)}>
                        {t('common.cancel', 'Cancel')}
                    </Button>
                    <Button type="submit" isLoading={isLoading}>
                        {submitLabel || t('common.save', 'Save')}
                    </Button>
                </div>
            </form>
        </div>
    );
}
