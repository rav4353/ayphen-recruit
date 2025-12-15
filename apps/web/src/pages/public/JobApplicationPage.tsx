import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useParams, useNavigate } from 'react-router-dom';
import { jobsApi, applicationsApi, storageApi } from '../../lib/api';
import { Job } from '../../lib/types';
import { Button, Input } from '../../components/ui';
import { MapPin, Briefcase, Clock, ArrowLeft, Upload, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const applicationSchema = z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
    phone: z.string(),
    linkedinUrl: z.string().refine(
        (val) => !val || val.startsWith('http://') || val.startsWith('https://'),
        'Please enter a valid URL'
    ),
    portfolioUrl: z.string().refine(
        (val) => !val || val.startsWith('http://') || val.startsWith('https://'),
        'Please enter a valid URL'
    ),
    resume: z.any().refine(
        (files) => files && files.length > 0,
        'Resume is required'
    ),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

export function JobApplicationPage() {
    const { tenantId, jobId } = useParams<{ tenantId: string; jobId: string }>();
    const navigate = useNavigate();
    const [job, setJob] = useState<Job | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors }
    } = useForm<ApplicationFormData>({
        resolver: zodResolver(applicationSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            linkedinUrl: '',
            portfolioUrl: '',
            resume: null,
        }
    });

    const resumeFile = watch('resume');

    useEffect(() => {
        const fetchJob = async () => {
            if (!jobId || !tenantId) return;
            try {
                const response = await jobsApi.getPublic(tenantId, jobId);
                setJob(response.data.data);
            } catch (err) {
                console.error('Failed to fetch job', err);
                toast.error('Failed to load job details');
            } finally {
                setIsLoading(false);
            }
        };

        fetchJob();
    }, [jobId, tenantId]);

    const onSubmit = async (data: ApplicationFormData) => {
        if (!data.resume || data.resume.length === 0) {
            toast.error('Please upload your resume');
            return;
        }

        setIsSubmitting(true);
        try {
            // Step 1: Upload the resume file first
            const resumeFile = data.resume[0] as File;
            const uploadResponse = await storageApi.uploadPublic(resumeFile);
            const resumeUrl = uploadResponse.data?.data?.url || uploadResponse.data?.url;

            if (!resumeUrl) {
                throw new Error('Failed to upload resume');
            }

            // Step 2: Submit the application with the resume URL
            await applicationsApi.createPublic({
                jobId,
                tenantId,
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone,
                linkedinUrl: data.linkedinUrl,
                portfolioUrl: data.portfolioUrl,
                resumeUrl,
                source: 'CAREER_PAGE',
            });

            setIsSuccess(true);
            window.scrollTo(0, 0);
        } catch (error: any) {
            console.error('Application failed', error);
            if (error?.response?.data?.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error('Failed to submit application. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Job Not Found</h2>
                    <Button onClick={() => navigate(`/careers/${tenantId}`)}>Back to Careers</Button>
                </div>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900 px-4">
                <div className="max-w-md w-full bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-8 text-center">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
                        <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Application Received!</h2>
                    <p className="text-neutral-600 dark:text-neutral-400 mb-8">
                        Thanks for applying to <strong>{job.title}</strong>. We've received your application and will be in touch soon.
                    </p>
                    <Button onClick={() => navigate(`/careers/${tenantId}`)} className="w-full">
                        Back to Open Positions
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <Button
                    variant="ghost"
                    onClick={() => navigate(`/careers/${tenantId}`)}
                    className="mb-6 gap-2"
                >
                    <ArrowLeft size={16} />
                    Back to Careers
                </Button>

                <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                    {/* Job Header */}
                    <div className="p-8 border-b border-neutral-200 dark:border-neutral-700">
                        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-4">{job.title}</h1>
                        <div className="flex flex-wrap gap-6 text-neutral-500 dark:text-neutral-400">
                            {job.department && (
                                <div className="flex items-center gap-2">
                                    <Briefcase size={18} />
                                    {job.department.name}
                                </div>
                            )}
                            {job.location && (
                                <div className="flex items-center gap-2">
                                    <MapPin size={18} />
                                    {job.location.name}
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <Clock size={18} />
                                {job.employmentType?.replace('_', ' ')}
                            </div>
                        </div>
                    </div>

                    {/* Job Description */}
                    <div className="p-8 space-y-8">
                        <section>
                            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3">About the Role</h3>
                            <div className="prose dark:prose-invert max-w-none text-neutral-600 dark:text-neutral-300 whitespace-pre-line">
                                {job.description}
                            </div>
                        </section>

                        {job.requirements && (
                            <section>
                                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3">Requirements</h3>
                                <div className="prose dark:prose-invert max-w-none text-neutral-600 dark:text-neutral-300 whitespace-pre-line">
                                    {job.requirements}
                                </div>
                            </section>
                        )}

                        <hr className="border-neutral-200 dark:border-neutral-700" />

                        {/* Application Form */}
                        <section>
                            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-6">Apply for this Job</h3>
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">First Name *</label>
                                        <Input
                                            {...register('firstName')}
                                            error={errors.firstName?.message}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Last Name *</label>
                                        <Input
                                            {...register('lastName')}
                                            error={errors.lastName?.message}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Email *</label>
                                    <Input
                                        type="email"
                                        {...register('email')}
                                        error={errors.email?.message}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Phone</label>
                                    <Input
                                        type="tel"
                                        {...register('phone')}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">LinkedIn URL</label>
                                    <Input
                                        type="url"
                                        {...register('linkedinUrl')}
                                        error={errors.linkedinUrl?.message}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Portfolio URL</label>
                                    <Input
                                        type="url"
                                        {...register('portfolioUrl')}
                                        error={errors.portfolioUrl?.message}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Resume/CV *</label>
                                    <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                                        <input
                                            type="file"
                                            id="resume"
                                            className="hidden"
                                            accept=".pdf,.doc,.docx"
                                            {...register('resume')}
                                        />
                                        <label htmlFor="resume" className="cursor-pointer flex flex-col items-center gap-2">
                                            <Upload className="h-8 w-8 text-neutral-400" />
                                            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
                                                {resumeFile && resumeFile.length > 0 ? resumeFile[0].name : 'Click to upload or drag and drop'}
                                            </span>
                                            <span className="text-xs text-neutral-500">PDF, DOC, DOCX up to 10MB</span>
                                        </label>
                                    </div>
                                    {errors.resume && (
                                        <p className="text-sm text-red-500">{errors.resume.message as string}</p>
                                    )}
                                </div>

                                <div className="pt-4">
                                    <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
                                        Submit Application
                                    </Button>
                                </div>
                            </form>
                        </section>
                    </div>
                </div>
            </div>
        </div >
    );
}
