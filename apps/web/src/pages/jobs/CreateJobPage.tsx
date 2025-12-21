import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { jobsApi } from '../../lib/api';
import { useCreateJob } from '../../hooks/queries';
import { JobForm, JobFormData } from '../../components/jobs/JobForm';

export function CreateJobPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tenantId } = useParams<{ tenantId: string }>();
  const createJob = useCreateJob(tenantId || '');

  const handleSubmit = async (data: JobFormData, requestApproval: boolean) => {
    if (!tenantId) return;

    try {
      const skillsArray = data.skills || [];

      // Filter out invalid scorecardTemplateId values (like "new" or empty string)
      const scorecardTemplateId = data.scorecardTemplateId && data.scorecardTemplateId !== 'new'
        ? data.scorecardTemplateId
        : undefined;

      const res = await createJob.mutateAsync({
        ...data,
        skills: skillsArray,
        salaryMin: data.salaryMin ? Number(data.salaryMin) : undefined,
        salaryMax: data.salaryMax ? Number(data.salaryMax) : undefined,
        scorecardTemplateId,
      });

      if (requestApproval) {
        try {
          await jobsApi.submitApproval(tenantId, res.data.id);
          toast.success(t('jobs.create.messages.submittedForApproval'));
        } catch (approvalError) {
          console.error('Failed to submit for approval', approvalError);
          toast.error(t('jobs.create.validation.approvalSubmitError'));
        }
      }

      navigate(`/${tenantId}/jobs`);
    } catch (error) {
      console.error('Failed to create job', error);
      // Error toast is handled by useCreateJob
    }
  };

  if (!tenantId) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t('jobs.create.title')}</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1">{t('jobs.create.subtitle')}</p>
      </div>

      <JobForm
        mode="create"
        onSubmit={handleSubmit}
        onCancel={() => navigate(`/${tenantId}/jobs`)}
        isSubmitting={createJob.isPending}
      />
    </div>
  );
}
