import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../../components/ui';
import { jobsApi } from '../../lib/api';
import { JobForm, JobFormData } from '../../components/jobs/JobForm';

export function EditJobPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { id, tenantId } = useParams<{ id: string; tenantId: string }>();
    const [isFetching, setIsFetching] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [initialData, setInitialData] = useState<JobFormData | undefined>(undefined);


    useEffect(() => {
        if (!id || !tenantId) {
            navigate(`/${tenantId}/jobs`);
            return;
        }

        const fetchJob = async () => {
            try {
                const response = await jobsApi.getById(tenantId, id);
                const jobData = response.data;
                const job = jobData.data || jobData; // Handle both response formats

                setInitialData({
                    title: job.title || '',
                    department: job.department?.name || '',
                    employmentType: job.employmentType || 'FULL_TIME',
                    workLocation: job.workLocation || 'ONSITE',
                    description: job.description || '',
                    requirements: job.requirements || '',
                    responsibilities: job.responsibilities || '',
                    experience: job.experience || '',
                    education: job.education || '',
                    benefits: job.benefits || '',
                    salaryMin: job.salaryMin ? Number(job.salaryMin) : 0,
                    salaryMax: job.salaryMax ? Number(job.salaryMax) : 0,
                    salaryCurrency: job.salaryCurrency || 'USD',
                    showSalary: job.showSalary || false,
                    skills: job.skills
                        ?.filter((s: string) => !['AI Generated', 'Parsed', 'Auto-generated'].includes(s)) || [],
                    hiringManagerId: job.hiringManagerId || '',
                    recruiterId: job.recruiterId || '',
                    pipelineId: job.pipelineId || '',
                });

                setIsFetching(false);
            } catch (error) {
                console.error('Failed to fetch job', error);
                toast.error(t('jobs.create.error'));
                navigate(`/${tenantId}/jobs`);
            }
        };

        fetchJob();
    }, [id, tenantId, navigate, t]);

    const handleSubmit = async (data: JobFormData, requestApproval: boolean) => {
        if (!id || !tenantId) return;

        setIsSubmitting(true);
        try {
            const skillsArray = data.skills || [];

            await jobsApi.update(tenantId, id, {
                ...data,
                skills: skillsArray,
                salaryMin: Number(data.salaryMin),
                salaryMax: Number(data.salaryMax),
            });

            if (requestApproval) {
                await jobsApi.submitApproval(tenantId, id);
                toast.success(t('jobs.create.messages.submittedForApproval'));
            } else {
                toast.success(t('jobs.edit.success'));
            }

            navigate(`/${tenantId}/jobs/${id}`);
        } catch (error) {
            console.error('Failed to update job', error);
            toast.error(t('jobs.edit.error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isFetching) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!tenantId) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <Button
                    variant="ghost"
                    className="mb-4 gap-2 pl-0"
                    onClick={() => navigate(`/${tenantId}/jobs/${id}`)}
                >
                    <ArrowLeft size={16} />
                    {t('common.back')}
                </Button>
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t('jobs.edit.title')}</h1>
                <p className="text-neutral-500 dark:text-neutral-400 mt-1">{t('jobs.edit.subtitle')}</p>
            </div>

            <JobForm
                mode="edit"
                initialData={initialData}
                onSubmit={handleSubmit}
                onCancel={() => navigate(`/${tenantId}/jobs/${id}`)}
                isSubmitting={isSubmitting}
            />
        </div>
    );
}
