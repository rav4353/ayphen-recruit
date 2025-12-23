import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jobsApi, applicationsApi } from '../../lib/api';
import { Job } from '../../lib/types';
import { Button } from '../../components/ui';
import { MapPin, Briefcase, Clock, ArrowLeft, CheckCircle } from 'lucide-react';
import { CandidateForm, CandidateFormData } from '../../components/candidates/CandidateForm';
import toast from 'react-hot-toast';

export function JobApplicationPage() {
    const { tenantId, jobId } = useParams<{ tenantId: string; jobId: string }>();
    const navigate = useNavigate();
    const [job, setJob] = useState<Job | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

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

    const handleSubmit = async (data: CandidateFormData) => {
        if (!data.resumeUrl) {
            toast.error('Please upload your resume');
            return;
        }

        setIsSubmitting(true);
        try {
            // Submit the application with all candidate data including custom fields
            await applicationsApi.createPublic({
                jobId,
                tenantId,
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone,
                currentTitle: data.currentTitle,
                currentCompany: data.currentCompany,
                location: data.location,
                linkedinUrl: data.linkedinUrl,
                portfolioUrl: data.portfolioUrl,
                summary: data.summary,
                skills: data.skills,
                resumeUrl: data.resumeUrl,
                experience: data.experience,
                education: data.education,
                customFields: data.customFields, // Include custom fields
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
            <div className="max-w-4xl mx-auto">
                <Button
                    variant="ghost"
                    onClick={() => navigate(`/careers/${tenantId}`)}
                    className="mb-6 gap-2"
                >
                    <ArrowLeft size={16} />
                    Back to Careers
                </Button>

                <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden mb-8">
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
                            {job.locations?.[0] && (
                                <div className="flex items-center gap-2">
                                    <MapPin size={18} />
                                    {job.locations[0].name}
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

                        {job.responsibilities && (
                            <section>
                                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3">Responsibilities</h3>
                                <div className="prose dark:prose-invert max-w-none text-neutral-600 dark:text-neutral-300 whitespace-pre-line">
                                    {job.responsibilities}
                                </div>
                            </section>
                        )}

                        {job.benefits && (
                            <section>
                                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3">Benefits</h3>
                                <div className="prose dark:prose-invert max-w-none text-neutral-600 dark:text-neutral-300 whitespace-pre-line">
                                    {job.benefits}
                                </div>
                            </section>
                        )}
                    </div>
                </div>

                {/* Application Form - Using CandidateForm component */}
                <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-8">
                    <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">Apply for this Position</h2>
                    <p className="text-neutral-600 dark:text-neutral-400 mb-8">
                        Fill out the form below to submit your application. All fields marked with * are required.
                    </p>

                    <CandidateForm
                        onSubmit={handleSubmit}
                        isLoading={isSubmitting}
                        submitLabel="Submit Application"
                        publicTenantId={tenantId} // Pass tenantId for public API access
                        initialData={{
                            gdprConsent: true, // Auto-consent for public applications
                            experience: [],
                            education: []
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
