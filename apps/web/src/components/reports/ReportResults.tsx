import { Card, CardHeader } from '../ui';
import { BarChart3, Users, XCircle, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ReportResultsProps {
    data: {
        totalApplications: number;
        hires: number;
        rejected: number;
        conversionRate: number;
        byStatus: Record<string, number>;
        byJob: Record<string, number>;
        bySource: Record<string, number>;
    } | null;
}

export function ReportResults({ data }: ReportResultsProps) {
    const { t } = useTranslation();

    if (!data) {
        return (
            <div className="text-center py-16 text-neutral-500 bg-white dark:bg-neutral-900 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 shadow-sm">
                <div className="bg-neutral-100 dark:bg-neutral-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="h-8 w-8 text-neutral-400" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">
                    Ready to Generate Report
                </h3>
                <p>{t('reports.stats.selectFilters')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-6 border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                                {t('reports.stats.totalApplications')}
                            </p>
                            <h3 className="text-3xl font-bold text-neutral-900 dark:text-white">{data.totalApplications}</h3>
                        </div>
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                            <Users size={20} />
                        </div>
                    </div>
                </Card>
                <Card className="p-6 border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                                {t('reports.stats.hired')}
                            </p>
                            <h3 className="text-3xl font-bold text-neutral-900 dark:text-white">{data.hires}</h3>
                        </div>
                        <div className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg">
                            <CheckCircle size={20} />
                        </div>
                    </div>
                </Card>
                <Card className="p-6 border-l-4 border-l-red-500 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                                {t('reports.stats.rejected')}
                            </p>
                            <h3 className="text-3xl font-bold text-neutral-900 dark:text-white">{data.rejected}</h3>
                        </div>
                        <div className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
                            <XCircle size={20} />
                        </div>
                    </div>
                </Card>
                <Card className="p-6 border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                                {t('reports.stats.conversionRate')}
                            </p>
                            <h3 className="text-3xl font-bold text-neutral-900 dark:text-white">{data.conversionRate.toFixed(1)}%</h3>
                        </div>
                        <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg">
                            <BarChart3 size={20} />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Breakdowns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pipeline Funnel / Status Breakdown */}
                <Card className="overflow-hidden">
                    <CardHeader title={t('reports.stats.byStatus')} align="left" className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-100 dark:border-neutral-800" />
                    <div className="p-6 space-y-5">
                        {Object.entries(data.byStatus)
                            .sort(([, a], [, b]) => b - a)
                            .map(([status, count]) => (
                                <div key={status} className="group">
                                    <div className="flex justify-between text-sm mb-1.5">
                                        <span className="font-medium text-neutral-700 dark:text-neutral-200 capitalize">{status.replace(/_/g, ' ').toLowerCase()}</span>
                                        <span className="text-neutral-500 font-medium">{count} <span className="text-xs text-neutral-400 font-normal">({((count / data.totalApplications) * 100).toFixed(1)}%)</span></span>
                                    </div>
                                    <div className="h-2.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500 ease-out"
                                            style={{ width: `${(count / data.totalApplications) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        {Object.keys(data.byStatus).length === 0 && (
                            <div className="text-center py-8 text-neutral-500 text-sm italic">{t('reports.stats.noData')}</div>
                        )}
                    </div>
                </Card>

                {/* Source Breakdown */}
                <Card className="overflow-hidden">
                    <CardHeader title={t('reports.stats.bySource')} align="left" className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-100 dark:border-neutral-800" />
                    <div className="p-6 space-y-5">
                        {Object.entries(data.bySource)
                            .sort(([, a], [, b]) => b - a)
                            .map(([source, count]) => (
                                <div key={source} className="group">
                                    <div className="flex justify-between text-sm mb-1.5">
                                        <span className="font-medium text-neutral-700 dark:text-neutral-200 capitalize">{source}</span>
                                        <span className="text-neutral-500 font-medium">{count}</span>
                                    </div>
                                    <div className="h-2.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
                                            style={{ width: `${(count / data.totalApplications) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        {Object.keys(data.bySource).length === 0 && (
                            <div className="text-center py-8 text-neutral-500 text-sm italic">{t('reports.stats.noData')}</div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Job Breakdown */}
            <Card className="overflow-hidden">
                <CardHeader title={t('reports.stats.byJob')} align="left" className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-100 dark:border-neutral-800" />
                <div className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-neutral-500 uppercase bg-neutral-50/50 dark:bg-neutral-800/50 border-b border-neutral-100 dark:border-neutral-800">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">{t('reports.stats.jobTitle')}</th>
                                    <th className="px-6 py-4 font-semibold text-right">{t('reports.stats.candidates')}</th>
                                    <th className="px-6 py-4 font-semibold text-right">{t('reports.stats.percentage')}</th>
                                    <th className="px-6 py-4 font-semibold text-right w-32">Visual</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {Object.entries(data.byJob)
                                    .sort(([, a], [, b]) => b - a)
                                    .map(([job, count]) => {
                                        const percentage = ((count / data.totalApplications) * 100);
                                        return (
                                            <tr key={job} className="bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-neutral-900 dark:text-white">{job}</td>
                                                <td className="px-6 py-4 text-right text-neutral-600 dark:text-neutral-300">{count}</td>
                                                <td className="px-6 py-4 text-right text-neutral-600 dark:text-neutral-300">{percentage.toFixed(1)}%</td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden ml-auto max-w-[100px]">
                                                        <div
                                                            className="h-full bg-emerald-500 rounded-full"
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                {Object.keys(data.byJob).length === 0 && (
                                    <tr><td colSpan={4} className="px-6 py-8 text-center text-neutral-500 italic">{t('reports.stats.noData')}</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Card>
        </div>
    );
}
