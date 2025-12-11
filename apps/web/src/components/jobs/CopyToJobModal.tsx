import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Search } from 'lucide-react';
import { jobsApi } from '../../lib/api';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

interface CopyToJobModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCopy: (targetJobId: string) => Promise<void>;
    isCopying: boolean;
    count: number;
}

export function CopyToJobModal({ isOpen, onClose, onCopy, isCopying, count }: CopyToJobModalProps) {
    const { t } = useTranslation();
    const { tenantId } = useParams<{ tenantId: string }>();
    const [search, setSearch] = useState('');
    const [jobs, setJobs] = useState<any[]>([]);
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && tenantId) {
            fetchJobs();
        }
    }, [isOpen, tenantId]);

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const res = await jobsApi.getAll(tenantId!, { limit: 100 });
            setJobs(res.data.data);
        } catch (err) {
            console.error('Failed to fetch jobs', err);
            toast.error('Failed to load jobs');
        } finally {
            setLoading(false);
        }
    };

    const filteredJobs = jobs.filter(job =>
        job.title.toLowerCase().includes(search.toLowerCase()) ||
        job.jobCode?.toLowerCase().includes(search.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                        Copy Candidates to Job
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 overflow-y-auto flex-1">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                        Select a job to copy {count} selected candidate(s) to. They will be added as new applicants.
                    </p>

                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search jobs..."
                            className="w-full pl-9 pr-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm bg-neutral-50 dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        {loading ? (
                            <div className="text-center py-4 text-sm text-neutral-500">Loading jobs...</div>
                        ) : filteredJobs.length === 0 ? (
                            <div className="text-center py-4 text-sm text-neutral-500">No jobs found</div>
                        ) : (

                            filteredJobs.map((job) => {
                                const isOpenJob = job.status === 'OPEN';
                                return (
                                    <div
                                        key={job.id}
                                        className={`
                                            p-3 rounded-md border transition-colors
                                            ${isOpenJob ? 'cursor-pointer' : 'cursor-not-allowed opacity-60 bg-neutral-50 dark:bg-neutral-800/50'}
                                            ${selectedJobId === job.id
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-neutral-200 dark:border-neutral-700'
                                            }
                                            ${isOpenJob && selectedJobId !== job.id ? 'hover:bg-neutral-50 dark:hover:bg-neutral-800' : ''}
                                        `}
                                        onClick={() => isOpenJob && setSelectedJobId(job.id)}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm font-medium ${selectedJobId === job.id ? 'text-blue-700 dark:text-blue-300' : 'text-neutral-900 dark:text-white'}`}>
                                                    {job.title}
                                                </span>
                                                {!isOpenJob && (
                                                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400">
                                                        {job.status.replace('_', ' ')}
                                                    </span>
                                                )}
                                            </div>
                                            {job.jobCode && (
                                                <span className="text-xs text-neutral-500 bg-white dark:bg-neutral-700 px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-600">
                                                    {job.jobCode}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                        disabled={isCopying}
                    >
                        {t('common.cancel', 'Cancel')}
                    </button>
                    <button
                        onClick={() => selectedJobId && onCopy(selectedJobId)}
                        disabled={isCopying || !selectedJobId}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isCopying ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Copying...
                            </>
                        ) : (
                            'Copy Candidates'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
