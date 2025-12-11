import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { candidatesApi } from '../../lib/api';
import { CandidateForm, CandidateFormData } from '../../components/candidates/CandidateForm';

export function EditCandidatePage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { id, tenantId } = useParams<{ id: string; tenantId: string }>();
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState('');
    const [initialData, setInitialData] = useState<Partial<CandidateFormData>>({});

    useEffect(() => {
        if (!id) return;

        const fetchCandidate = async () => {
            try {
                const response = await candidatesApi.getById(id);
                const candidate = response.data.data; // Fix: access nested data

                setInitialData({
                    firstName: candidate.firstName,
                    lastName: candidate.lastName,
                    email: candidate.email,
                    phone: candidate.phone,
                    currentTitle: candidate.currentTitle,
                    currentCompany: candidate.currentCompany,
                    location: candidate.location,
                    linkedinUrl: candidate.linkedinUrl,
                    portfolioUrl: candidate.portfolioUrl,
                    summary: candidate.summary,
                    skills: candidate.skills?.join(', '),
                    gdprConsent: candidate.gdprConsent || false,
                });
            } catch (err) {
                console.error('Failed to fetch candidate', err);
                setError(t('candidates.fetchError', 'Failed to load candidate details'));
            } finally {
                setIsFetching(false);
            }
        };

        fetchCandidate();
    }, [id, t]);

    const onSubmit = async (data: CandidateFormData) => {
        if (!id) return;

        setIsLoading(true);
        setError('');

        try {
            const skillsArray = data.skills
                ? data.skills.split(',').map((s) => s.trim()).filter(Boolean)
                : [];

            await candidatesApi.update(id, {
                ...data,
                skills: skillsArray,
            });

            toast.success(t('candidates.updateSuccess', 'Candidate updated successfully'));
            navigate(`/${tenantId}/candidates/${id}`);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setError(error.response?.data?.message || t('candidates.updateError'));
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) {
        return <div className="flex justify-center py-12">{t('common.loading', 'Loading...')}</div>;
    }

    if (error && !initialData.email) {
        return <div className="text-center py-12 text-red-500">{error}</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                    {t('candidates.editCandidate', 'Edit Candidate')}
                </h1>
                <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                    {t('candidates.editCandidateDescription', 'Update candidate information.')}
                </p>
            </div>

            <CandidateForm
                initialData={initialData}
                onSubmit={onSubmit}
                isLoading={isLoading}
                error={error}
                submitLabel={t('common.save', 'Save Changes')}
                enableUnsavedWarning={true}
            />
        </div>
    );
}
