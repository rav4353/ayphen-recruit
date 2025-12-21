import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useCreateCandidate } from '../../hooks/queries';
import { CandidateForm, CandidateFormData } from '../../components/candidates/CandidateForm';

export function AddCandidatePage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { tenantId } = useParams<{ tenantId: string }>();
    const [error, setError] = useState('');
    const createCandidate = useCreateCandidate();

    const onSubmit = async (data: CandidateFormData) => {
        setError('');

        try {
            const skillsArray = data.skills
                ? data.skills.split(',').map((s) => s.trim()).filter(Boolean)
                : [];

            await createCandidate.mutateAsync({
                ...data,
                skills: skillsArray,
            });

            navigate(`/${tenantId}/candidates`);
        } catch (err: unknown) {
            const error = err as { response?: { status?: number; data?: { message?: string } } };
            if (error.response?.status === 409) {
                setError(t('candidates.duplicateError', 'A candidate with this email already exists.'));
            } else {
                setError(error.response?.data?.message || t('candidates.createError'));
            }
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
                isLoading={createCandidate.isPending}
                submitLabel={t('common.create', 'Create')}
                error={error}
                enableUnsavedWarning={true}
            />
        </div>
    );
}
