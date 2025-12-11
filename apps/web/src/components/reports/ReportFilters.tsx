import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Select, Button, Input } from '../ui';
import { jobsApi } from '../../lib/api';
import { Search, Download, Printer } from 'lucide-react';

interface ReportFiltersProps {
    onFilterChange: (filters: any) => void;
    onExport: () => void;
    isLoading?: boolean;
}

export function ReportFilters({ onFilterChange, onExport, isLoading }: ReportFiltersProps) {
    const { t } = useTranslation();
    const [jobs, setJobs] = useState<any[]>([]);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        jobId: '',
    });

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                // Fetch basic job list
                const response = await jobsApi.getAll('current-tenant', { status: 'OPEN' }); // Tenant ID isn't strictly needed if API handles it, but kept consistent
                const data = response.data.data || response.data || [];
                const jobsList = Array.isArray(data) ? data : (data.jobs || []);
                setJobs(jobsList);
            } catch (error) {
                console.error('Failed to fetch jobs for filter', error);
            }
        };
        fetchJobs();
    }, []);

    const handleChange = (field: string, value: string) => {
        const newFilters = { ...filters, [field]: value };
        setFilters(newFilters);
    };

    const handleApply = () => {
        onFilterChange(filters);
    };

    return (
        <Card className="mb-6 overflow-hidden border-none ring-1 ring-neutral-200 dark:ring-neutral-800 shadow-xl shadow-neutral-100/50 dark:shadow-neutral-900/50">
            <div className="bg-neutral-50/50 dark:bg-neutral-900/50 border-b border-neutral-100 dark:border-neutral-800 px-6 py-3 flex items-center gap-2">
                <div className="p-1.5 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md">
                    <Search size={14} strokeWidth={2.5} />
                </div>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider">Report Configuration</h3>
            </div>
            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                    <div className="w-full">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">
                            {t('reports.filters.startDate')}
                        </label>
                        <Input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => handleChange('startDate', e.target.value)}
                            className="bg-white dark:bg-neutral-950 focus:ring-blue-500/10 transition-all font-medium"
                        />
                    </div>
                    <div className="w-full">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">
                            {t('reports.filters.endDate')}
                        </label>
                        <Input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => handleChange('endDate', e.target.value)}
                            className="bg-white dark:bg-neutral-950 focus:ring-blue-500/10 transition-all font-medium"
                        />
                    </div>
                    <div className="w-full">
                        <div className="mb-2">
                            <span className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                {t('reports.filters.job')}
                            </span>
                        </div>
                        <Select
                            value={filters.jobId}
                            onChange={(e) => handleChange('jobId', e.target.value)}
                            options={[
                                { value: '', label: t('reports.filters.allJobs') },
                                ...jobs.map(j => ({ value: j.id, label: j.title }))
                            ]}
                            className="bg-white dark:bg-neutral-950 focus:ring-blue-500/10 transition-all font-medium"
                        />
                    </div>
                    <div className="w-full flex gap-3">
                        <Button
                            variant="primary"
                            className="flex-1 shadow-lg shadow-blue-500/20"
                            onClick={handleApply}
                            isLoading={isLoading}
                        >
                            <Search size={16} className="mr-2" strokeWidth={2.5} />
                            {t('reports.filters.generate')}
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={onExport}
                            disabled={isLoading}
                            title={t('reports.filters.exportCsv')}
                            className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                        >
                            <Download size={18} className="text-neutral-500 dark:text-neutral-400" />
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => window.print()}
                            title={t('reports.filters.print', 'Print')}
                            className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                        >
                            <Printer size={18} className="text-neutral-500 dark:text-neutral-400" />
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    );
}
