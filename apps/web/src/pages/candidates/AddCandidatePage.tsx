import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { candidatesApi } from '../../lib/api';
import { CandidateForm, CandidateFormData } from '../../components/candidates/CandidateForm';

export function AddCandidatePage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { tenantId } = useParams<{ tenantId: string }>();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const onSubmit = async (data: CandidateFormData) => {
        setIsLoading(true);
        setError('');

        try {
            const skillsArray = data.skills
                ? data.skills.split(',').map((s) => s.trim()).filter(Boolean)
                : [];

            await candidatesApi.create({
                ...data,
                skills: skillsArray,
            });

            toast.success(t('candidates.createSuccess', 'Candidate created successfully'));
            navigate(`/${tenantId}/candidates`);
        } catch (err: unknown) {
            const error = err as { response?: { status?: number; data?: { message?: string } } };
            if (error.response?.status === 409) {
                setError(t('candidates.duplicateError', 'A candidate with this email already exists.'));
            } else {
                setError(error.response?.data?.message || t('candidates.createError'));
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                    {t('candidates.addCandidate')}
                </h1>
                <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                    {t('candidates.addCandidateDescription', 'Manually add a new candidate to your talent pool.')}
                </p>
            </div>

            <CandidateForm
                onSubmit={onSubmit}
                isLoading={isLoading}
                submitLabel={t('common.create', 'Create')}
                error={error}
                enableUnsavedWarning={true}
            />
        </div>
    );
}
