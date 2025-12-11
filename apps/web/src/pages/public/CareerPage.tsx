import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { jobsApi } from '../../lib/api';
import { MapPin, Briefcase, Clock, ArrowRight } from 'lucide-react';
import { Job } from '../../lib/types';

export function CareerPage() {
    const { tenantId } = useParams<{ tenantId: string }>();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const response = await jobsApi.getPublicAll(tenantId!);
                setJobs(response.data.data);
            } catch (err) {
                console.error('Failed to fetch jobs', err);
                setError('Failed to load open positions');
            } finally {
                setIsLoading(false);
            }
        };

        if (tenantId) {
            fetchJobs();
        }
    }, [tenantId]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Oops!</h2>
                    <p className="text-neutral-600 dark:text-neutral-400">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
            {/* Hero Section */}
            <div className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                <div className="max-w-5xl mx-auto px-4 py-16 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl font-extrabold text-neutral-900 dark:text-white sm:text-5xl sm:tracking-tight lg:text-6xl">
                        Join Our Team
                    </h1>
                    <p className="mt-5 max-w-xl mx-auto text-xl text-neutral-500 dark:text-neutral-400">
                        We're looking for talented individuals to help us build the future. Check out our open positions below.
                    </p>
                </div>
            </div>

            {/* Job List */}
            <div className="max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
                <div className="space-y-4">
                    {jobs.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-lg text-neutral-500">No open positions at the moment. Check back later!</p>
                        </div>
                    ) : (
                        jobs.map((job) => (
                            <Link
                                key={job.id}
                                to={`/careers/${tenantId}/jobs/${job.id}`}
                                className="block bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 hover:shadow-md transition-shadow p-6"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
                                            {job.title}
                                        </h3>
                                        <div className="flex flex-wrap gap-4 text-sm text-neutral-500 dark:text-neutral-400">
                                            {job.department && (
                                                <div className="flex items-center gap-1">
                                                    <Briefcase size={16} />
                                                    {job.department.name}
                                                </div>
                                            )}
                                            {job.location && (
                                                <div className="flex items-center gap-1">
                                                    <MapPin size={16} />
                                                    {job.location.name}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1">
                                                <Clock size={16} />
                                                {job.employmentType?.replace('_', ' ')}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="hidden sm:block text-blue-600 dark:text-blue-400">
                                        <ArrowRight size={24} />
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
