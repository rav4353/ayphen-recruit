import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ReportFilters } from '../../components/reports/ReportFilters';
import { ReportResults } from '../../components/reports/ReportResults';
import { reportsApi } from '../../lib/api';
import toast from 'react-hot-toast';

export function ReportsPage() {
    const { t } = useTranslation();
    const [reportData, setReportData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [currentFilters, setCurrentFilters] = useState<any>({});

    const handleGenerateReport = async (filters: any) => {
        setIsLoading(true);
        setCurrentFilters(filters);
        try {
            const response = await reportsApi.getCustomReport(filters);
            setReportData(response.data.data || response.data);
            toast.success('Report generated successfully');
        } catch (error) {
            console.error('Failed to generate report', error);
            toast.error('Failed to generate report');
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportCsv = async () => {
        try {
            toast.loading('Exporting report...', { id: 'export' });
            const response = await reportsApi.exportCsv(currentFilters);

            // Create a blob from the CSV string (assuming API returns string or blob)
            const blob = new Blob([response.data], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `report-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success('Report exported successfully', { id: 'export' });
        } catch (error) {
            console.error('Failed to export report', error);
            toast.error('Failed to export report', { id: 'export' });
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                    {t('reports.title', 'Custom Reports')}
                </h1>
                <p className="text-neutral-500 dark:text-neutral-400 mt-1 no-print">
                    {t('reports.subtitle', 'Generate insights from recruitment data.')}
                </p>

                {/* Print Only Summary */}
                <div className="hidden print-only mt-4 space-y-1 border-b border-neutral-200 pb-4 mb-4">
                    <p className="text-sm text-neutral-600">
                        Generated on: {new Date().toLocaleDateString()}
                    </p>
                    {(currentFilters.startDate || currentFilters.endDate) && (
                        <p className="text-sm text-neutral-600">
                            Period: {currentFilters.startDate || 'Start'} to {currentFilters.endDate || 'Present'}
                        </p>
                    )}
                </div>
            </div>

            <div className="no-print">
                <ReportFilters
                    onFilterChange={handleGenerateReport}
                    onExport={handleExportCsv}
                    isLoading={isLoading}
                />
            </div>

            <ReportResults data={reportData} />
        </div>
    );
}
