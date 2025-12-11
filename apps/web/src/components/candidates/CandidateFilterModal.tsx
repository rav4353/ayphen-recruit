import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Button, Input } from '../ui';

interface FilterFormData {
    location: string;
    skills: string;
    status: string;
    source: string;
}

interface CandidateFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (filters: { location?: string; skills?: string[]; status?: string; source?: string }) => void;
    initialFilters?: { location?: string; skills?: string[]; status?: string; source?: string };
}

export function CandidateFilterModal({
    isOpen,
    onClose,
    onApply,
    initialFilters,
}: CandidateFilterModalProps) {
    const { t } = useTranslation();
    const { register, handleSubmit, reset } = useForm<FilterFormData>({
        defaultValues: {
            location: initialFilters?.location || '',
            skills: initialFilters?.skills?.join(', ') || '',
            status: initialFilters?.status || '',
            source: initialFilters?.source || '',
        },
    });

    if (!isOpen) return null;

    const onSubmit = (data: FilterFormData) => {
        const skills = data.skills
            ? data.skills.split(',').map((s) => s.trim()).filter(Boolean)
            : undefined;

        onApply({
            location: data.location || undefined,
            skills,
            status: data.status || undefined,
            source: data.source || undefined,
        });
        onClose();
    };

    const handleClear = () => {
        reset({ location: '', skills: '', status: '', source: '' });
        onApply({});
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                        {t('common.filter', 'Filter Candidates')}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
                    <Input
                        label={t('candidates.fields.location', 'Location')}
                        placeholder="e.g. San Francisco"
                        {...register('location')}
                    />

                    <div>
                        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                            {t('candidates.fields.skills', 'Skills')}
                        </label>
                        <input
                            className="mt-1 w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500"
                            placeholder="e.g. React, Node.js"
                            {...register('skills')}
                        />
                        <p className="text-xs text-neutral-500 mt-1">
                            {t('candidates.skillsHelp', 'Comma separated')}
                        </p>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                            {t('candidates.fields.status', 'Application Status')}
                        </label>
                        <select
                            className="mt-1 w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500"
                            {...register('status')}
                        >
                            <option value="">{t('common.all', 'All')}</option>
                            <option value="APPLIED">Applied</option>
                            <option value="SCREENING">Screening</option>
                            <option value="INTERVIEW">Interview</option>
                            <option value="OFFER">Offer</option>
                            <option value="HIRED">Hired</option>
                            <option value="REJECTED">Rejected</option>
                            <option value="WITHDRAWN">Withdrawn</option>
                        </select>
                    </div>

                    <Input
                        label={t('candidates.fields.source', 'Source')}
                        placeholder="e.g. LinkedIn, Referral"
                        {...register('source')}
                    />

                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="secondary" onClick={handleClear} className="flex-1">
                            {t('common.clear', 'Clear')}
                        </Button>
                        <Button type="submit" className="flex-1">
                            {t('common.apply', 'Apply')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
