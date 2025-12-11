import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { MapPin, Briefcase, Users, Calendar, ArrowRight } from 'lucide-react';
import { jobsApi, referenceApi } from '../../lib/api';
import { Button } from '../../components/ui';
import { ApplicationModal } from '../../components/applications/ApplicationModal';
import type { Job, ApiResponse } from '../../lib/types';

export function PublicJobPage() {
    const { t } = useTranslation();
    const { id, tenantId } = useParams<{ id: string; tenantId: string }>();
    const [job, setJob] = useState<Job | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currencies, setCurrencies] = useState<any[]>([]);
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

    useEffect(() => {
        const fetchJob = async () => {
            if (!id || !tenantId) return;
            try {
                const res = await jobsApi.getPublic(tenantId, id);
                setJob((res.data as ApiResponse<Job>).data);
            } catch (err) {
                setError(t('careers.jobNotFound'));
            } finally {
                setIsLoading(false);
            }
        };

        fetchJob();
    }, [id, tenantId]);

    useEffect(() => {
        const fetchCurrencies = async () => {
            try {
                const res = await referenceApi.getCurrencies();
                setCurrencies(res.data.data);
            } catch (err) {
                console.error('Failed to fetch currencies', err);
            }
        };
        fetchCurrencies();
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error || !job) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-900 p-4">
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">{t('careers.oops')}</h1>
                <p className="text-neutral-600 dark:text-neutral-400">{error || t('careers.jobNotFound')}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto space-y-8">
                {/* Header */}
                <div className="bg-white dark:bg-neutral-800 rounded-2xl p-8 shadow-sm border border-neutral-200 dark:border-neutral-700">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div>
                            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-4">{job.title}</h1>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-500 dark:text-neutral-400">
                                {job.department && (
                                    <div className="flex items-center gap-1.5">
                                        <Briefcase size={16} />
                                        {job.department.name}
                                    </div>
                                )}
                                <div className="flex items-center gap-1.5">
                                    <MapPin size={16} />
                                    {job.location?.name || job.workLocation}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Users size={16} />
                                    {job.employmentType}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Calendar size={16} />
                                    {t('careers.posted')} {new Date(job.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                        <Button size="lg" className="gap-2 shadow-lg shadow-blue-500/20" onClick={() => setIsApplyModalOpen(true)}>
                            {t('careers.applyNow')}
                            <ArrowRight size={18} />
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-8">
                        <section className="bg-white dark:bg-neutral-800 rounded-2xl p-8 shadow-sm border border-neutral-200 dark:border-neutral-700">
                            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">{t('careers.aboutRole')}</h2>
                            <div className="prose dark:prose-invert max-w-none text-neutral-600 dark:text-neutral-300 whitespace-pre-wrap">
                                {job.description}
                            </div>
                        </section>

                        {job.requirements && (
                            <section className="bg-white dark:bg-neutral-800 rounded-2xl p-8 shadow-sm border border-neutral-200 dark:border-neutral-700">
                                <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">{t('careers.requirements')}</h2>
                                <div className="prose dark:prose-invert max-w-none text-neutral-600 dark:text-neutral-300 whitespace-pre-wrap">
                                    {job.requirements}
                                </div>
                            </section>
                        )}

                        {job.responsibilities && (
                            <section className="bg-white dark:bg-neutral-800 rounded-2xl p-8 shadow-sm border border-neutral-200 dark:border-neutral-700">
                                <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">{t('careers.responsibilities')}</h2>
                                <div className="prose dark:prose-invert max-w-none text-neutral-600 dark:text-neutral-300 whitespace-pre-wrap">
                                    {job.responsibilities}
                                </div>
                            </section>
                        )}

                        {job.benefits && (
                            <section className="bg-white dark:bg-neutral-800 rounded-2xl p-8 shadow-sm border border-neutral-200 dark:border-neutral-700">
                                <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">{t('careers.benefits')}</h2>
                                <div className="prose dark:prose-invert max-w-none text-neutral-600 dark:text-neutral-300 whitespace-pre-wrap">
                                    {job.benefits}
                                </div>
                            </section>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-700 sticky top-6">
                            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider mb-4">
                                {t('careers.jobOverview')}
                            </h3>
                            <div className="space-y-4">
                                {(job.salaryMin || job.salaryMax) && (
                                    <div>
                                        <span className="text-sm text-neutral-500 dark:text-neutral-400 block mb-1">{t('careers.salaryRange')}</span>
                                        <div className="flex items-center gap-2 text-neutral-900 dark:text-white font-medium">
                                            <span>
                                                {currencies.find(c => c.code === job.salaryCurrency)?.symbol || job.salaryCurrency}
                                            </span>
                                            {job.salaryMin?.toLocaleString()} - {job.salaryMax?.toLocaleString()}
                                        </div>
                                    </div>
                                )}

                                {job.skills.length > 0 && (
                                    <div>
                                        <span className="text-sm text-neutral-500 dark:text-neutral-400 block mb-2">{t('careers.skills')}</span>
                                        <div className="flex flex-wrap gap-2">
                                            {job.skills
                                                .filter(skill => !['AI Generated', 'Parsed', 'Auto-generated'].includes(skill))
                                                .map((skill) => (
                                                    <span
                                                        key={skill}
                                                        className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded text-xs"
                                                    >
                                                        {skill}
                                                    </span>
                                                ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700">
                                <Button className="w-full gap-2" size="lg" onClick={() => setIsApplyModalOpen(true)}>
                                    {t('careers.applyNow')}
                                    <ArrowRight size={18} />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ApplicationModal
                isOpen={isApplyModalOpen}
                onClose={() => setIsApplyModalOpen(false)}
                jobId={job.id}
                jobTitle={job.title}
            />
        </div>
    );
}
