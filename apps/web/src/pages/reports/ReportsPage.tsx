import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { reportsApi, analyticsApi, jobsApi } from '../../lib/api';
import toast from 'react-hot-toast';
import {
    BarChart3, TrendingUp, Users, Briefcase, Clock, Target, Printer,
    FileSpreadsheet, Activity, Calendar, Filter,
    ArrowUpRight, ArrowDownRight, Minus,
    LayoutGrid, Zap, Award, UserCheck, XCircle, CheckCircle2, Timer
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart as RechartsPieChart, Pie, Cell, AreaChart, Area,
    Legend
} from 'recharts';
import { Download, FileText } from 'lucide-react';
import { Card, Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui';
import { ColumnSelector, ExportColumn } from '../../components/common';
import { convertToCSV, downloadCSV, CsvColumn } from '../../lib/csv-utils';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';

// Chart colors
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];
const GRADIENT_COLORS = {
    blue: ['#3B82F6', '#1D4ED8'],
    green: ['#10B981', '#059669'],
    purple: ['#8B5CF6', '#7C3AED'],
    orange: ['#F59E0B', '#D97706'],
    red: ['#EF4444', '#DC2626'],
    cyan: ['#06B6D4', '#0891B2'],
};

type ReportType = 'overview' | 'pipeline' | 'sourcing' | 'time' | 'team';
type DatePreset = 'today' | '7days' | '30days' | '90days' | 'thisMonth' | 'lastMonth' | 'custom';

interface MetricCardProps {
    title: string;
    value: string | number;
    change?: number;
    icon: React.ReactNode;
    color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'cyan';
    subtitle?: string;
    loading?: boolean;
}

function MetricCard({ title, value, change, icon, color, subtitle, loading }: MetricCardProps) {
    const colorClasses = {
        blue: 'from-blue-500 to-blue-600 shadow-blue-500/25',
        green: 'from-emerald-500 to-emerald-600 shadow-emerald-500/25',
        purple: 'from-purple-500 to-purple-600 shadow-purple-500/25',
        orange: 'from-amber-500 to-amber-600 shadow-amber-500/25',
        red: 'from-red-500 to-red-600 shadow-red-500/25',
        cyan: 'from-cyan-500 to-cyan-600 shadow-cyan-500/25',
    };

    const bgClasses = {
        blue: 'bg-blue-50 dark:bg-blue-900/20',
        green: 'bg-emerald-50 dark:bg-emerald-900/20',
        purple: 'bg-purple-50 dark:bg-purple-900/20',
        orange: 'bg-amber-50 dark:bg-amber-900/20',
        red: 'bg-red-50 dark:bg-red-900/20',
        cyan: 'bg-cyan-50 dark:bg-cyan-900/20',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative group"
        >
            <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl blur-xl -z-10"
                style={{ background: `linear-gradient(135deg, ${GRADIENT_COLORS[color][0]}20, ${GRADIENT_COLORS[color][1]}10)` }} />
            <Card className="relative overflow-hidden border-0 shadow-lg shadow-neutral-200/50 dark:shadow-neutral-900/50 hover:shadow-xl transition-all duration-300">
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colorClasses[color]} opacity-5 rounded-full -translate-y-1/2 translate-x-1/2`} />
                <div className="p-6">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                                {title}
                            </p>
                            {loading ? (
                                <div className="h-9 w-24 bg-neutral-200 dark:bg-neutral-700 animate-pulse rounded-lg" />
                            ) : (
                                <h3 className="text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">
                                    {value}
                                </h3>
                            )}
                            {subtitle && (
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{subtitle}</p>
                            )}
                        </div>
                        <div className={`p-3 rounded-xl ${bgClasses[color]}`}>
                            <div className={`bg-gradient-to-br ${colorClasses[color]} p-2 rounded-lg text-white shadow-lg`}>
                                {icon}
                            </div>
                        </div>
                    </div>
                    {typeof change !== 'undefined' && (
                        <div className="mt-4 flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 text-sm font-semibold ${change > 0 ? 'text-emerald-600 dark:text-emerald-400' : change < 0 ? 'text-red-600 dark:text-red-400' : 'text-neutral-500'
                                }`}>
                                {change > 0 ? <ArrowUpRight size={16} /> : change < 0 ? <ArrowDownRight size={16} /> : <Minus size={16} />}
                                {Math.abs(change)}%
                            </span>
                            <span className="text-xs text-neutral-500">vs last period</span>
                        </div>
                    )}
                </div>
            </Card>
        </motion.div>
    );
}

function ChartCard({ title, subtitle, children, actions }: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    actions?: React.ReactNode;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
        >
            <Card className="overflow-hidden border-0 shadow-lg shadow-neutral-200/50 dark:shadow-neutral-900/50">
                <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-gradient-to-r from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-900/50 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">{title}</h3>
                        {subtitle && <p className="text-xs text-neutral-500 mt-0.5">{subtitle}</p>}
                    </div>
                    {actions && <div className="flex items-center gap-2">{actions}</div>}
                </div>
                <div className="p-6">{children}</div>
            </Card>
        </motion.div>
    );
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-neutral-800 px-4 py-3 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-700">
                <p className="text-sm font-semibold text-neutral-900 dark:text-white mb-1">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={index} className="text-sm" style={{ color: entry.color }}>
                        {entry.name}: <span className="font-semibold">{entry.value}</span>
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export function ReportsPage() {
    const { tenantId } = useParams<{ tenantId: string }>();
    useTranslation();
    const [activeTab, setActiveTab] = useState<ReportType>('overview');
    const [datePreset, setDatePreset] = useState<DatePreset>('30days');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [selectedJobId, setSelectedJobId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [jobs, setJobs] = useState<any[]>([]);
    const [showColumnSelector, setShowColumnSelector] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);

    // Report data states
    const [summaryStats, setSummaryStats] = useState<any>(null);
    const [pipelineData, setPipelineData] = useState<any>(null);
    const [funnelData, setFunnelData] = useState<any>(null);
    const [sourceData, setSourceData] = useState<any[]>([]);
    const [timeToHire, setTimeToHire] = useState<any>(null);
    const [reportData, setReportData] = useState<any>(null);
    const [userActivity, setUserActivity] = useState<any>(null);

    // Calculate date range based on preset
    const getDateRange = () => {
        const today = new Date();
        switch (datePreset) {
            case 'today':
                return { startDate: format(today, 'yyyy-MM-dd'), endDate: format(today, 'yyyy-MM-dd') };
            case '7days':
                return { startDate: format(subDays(today, 7), 'yyyy-MM-dd'), endDate: format(today, 'yyyy-MM-dd') };
            case '30days':
                return { startDate: format(subDays(today, 30), 'yyyy-MM-dd'), endDate: format(today, 'yyyy-MM-dd') };
            case '90days':
                return { startDate: format(subDays(today, 90), 'yyyy-MM-dd'), endDate: format(today, 'yyyy-MM-dd') };
            case 'thisMonth':
                return { startDate: format(startOfMonth(today), 'yyyy-MM-dd'), endDate: format(endOfMonth(today), 'yyyy-MM-dd') };
            case 'lastMonth':
                const lastMonth = subMonths(today, 1);
                return { startDate: format(startOfMonth(lastMonth), 'yyyy-MM-dd'), endDate: format(endOfMonth(lastMonth), 'yyyy-MM-dd') };
            case 'custom':
                return { startDate: customStartDate, endDate: customEndDate };
            default:
                return { startDate: '', endDate: '' };
        }
    };

    // Load initial data
    useEffect(() => {
        loadJobs();
        loadAllData();
    }, [tenantId]);

    // Reload data when filters change
    useEffect(() => {
        if (datePreset !== 'custom' || (customStartDate && customEndDate)) {
            loadAllData();
        }
    }, [datePreset, customStartDate, customEndDate, selectedJobId]);

    const loadJobs = async () => {
        try {
            const response = await jobsApi.getAll(tenantId || 'current-tenant', {});
            const data = response.data.data || response.data || [];
            setJobs(Array.isArray(data) ? data : (data.jobs || []));
        } catch (error) {
            console.error('Failed to load jobs', error);
        }
    };

    const loadAllData = async () => {
        setIsLoading(true);
        const { startDate, endDate } = getDateRange();
        const filters = { startDate, endDate, jobId: selectedJobId };

        try {
            const [summary, pipeline, funnel, sources, time, report, activity] = await Promise.allSettled([
                analyticsApi.getSummary(filters),
                analyticsApi.getPipelineHealth(filters),
                analyticsApi.getHiringFunnel(selectedJobId || undefined, { startDate, endDate }),
                analyticsApi.getSourceEffectiveness(filters),
                analyticsApi.getTimeToHire(filters),
                reportsApi.getCustomReport(filters),
                analyticsApi.getUserActivity({ startDate, endDate }),
            ]);

            if (summary.status === 'fulfilled') setSummaryStats(summary.value.data.data || summary.value.data);
            if (pipeline.status === 'fulfilled') setPipelineData(pipeline.value.data.data || pipeline.value.data);
            if (funnel.status === 'fulfilled') setFunnelData(funnel.value.data.data || funnel.value.data);
            if (sources.status === 'fulfilled') setSourceData(sources.value.data.data || sources.value.data || []);
            if (time.status === 'fulfilled') setTimeToHire(time.value.data.data || time.value.data);
            if (report.status === 'fulfilled') setReportData(report.value.data.data || report.value.data);
            if (activity.status === 'fulfilled') setUserActivity(activity.value.data.data || activity.value.data);
        } catch (error) {
            console.error('Failed to load report data', error);
            toast.error('Failed to load some report data');
        } finally {
            setIsLoading(false);
        }
    };

    // Define export columns for source data
    const exportColumns: ExportColumn[] = [
        { key: 'source', label: 'Source Name', defaultSelected: true },
        { key: 'applications', label: 'Total Applications', defaultSelected: true },
        { key: 'hired', label: 'Hired Count', defaultSelected: true },
        { key: 'hireRate', label: 'Hire Rate (%)', defaultSelected: true },
        { key: 'interviewRate', label: 'Interview Rate (%)', defaultSelected: false },
        { key: 'avgDaysToHire', label: 'Avg Days to Hire', defaultSelected: false },
    ];

    const csvColumns: CsvColumn[] = [
        { key: 'source', header: 'Source' },
        { key: 'applications', header: 'Applications' },
        { key: 'hired', header: 'Hired' },
        { key: 'hireRate', header: 'Hire Rate (%)' },
        { key: 'interviewRate', header: 'Interview Rate (%)' },
        { key: 'avgDaysToHire', header: 'Avg Days to Hire' },
    ];

    const handleExportWithColumns = (selectedColumns: string[]) => {
        if (!sourceData || sourceData.length === 0) {
            toast.error('No source data to export');
            return;
        }

        const csvContent = convertToCSV(sourceData, csvColumns, selectedColumns);
        downloadCSV(csvContent, `recruitment-report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
        toast.success('Report exported successfully');
    };

    const handleDetailedExport = async () => {
        try {
            const { startDate, endDate } = getDateRange();
            const filters = { startDate, endDate, jobId: selectedJobId };
            const response = await reportsApi.exportCsv(filters);
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `detailed_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            toast.success('Detailed report exported successfully');
            setShowExportModal(false);
        } catch (error) {
            console.error('Export failed', error);
            toast.error('Failed to export detailed report');
        }
    };

    // Prepare chart data
    const pipelineChartData = pipelineData?.map((item: any) => ({
        name: item.status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase()),
        value: item.count,
        fill: COLORS[Object.values(['APPLIED', 'SCREENING', 'PHONE_SCREEN', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED', 'WITHDRAWN']).indexOf(item.status) % COLORS.length]
    })) || [];

    const funnelChartData = funnelData?.funnel?.map((item: any, index: number) => ({
        name: item.stage,
        value: item.count,
        fill: COLORS[index % COLORS.length]
    })) || [];

    const sourceChartData = sourceData.slice(0, 8).map((item: any, index: number) => ({
        name: item.source,
        applications: item.applications,
        hired: item.hired,
        hireRate: item.hireRate,
        fill: COLORS[index % COLORS.length]
    }));

    const tabs = [
        { id: 'overview', label: 'Overview', icon: LayoutGrid },
        { id: 'pipeline', label: 'Pipeline Analytics', icon: Activity },
        { id: 'sourcing', label: 'Source Analysis', icon: Target },
        { id: 'time', label: 'Time Metrics', icon: Clock },
        { id: 'team', label: 'Team Performance', icon: Users },
    ];

    return (
        <div className="min-h-screen">
            {/* Premium Header */}
            <div className="relative overflow-hidden mb-8 rounded-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-purple-600/5 to-transparent dark:from-blue-600/10 dark:via-purple-600/10" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                <div className="relative p-6 sm:p-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl text-white shadow-lg shadow-blue-500/25">
                                    <BarChart3 size={24} />
                                </div>
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">
                                        Analytics & Reports
                                    </h1>
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                        Comprehensive recruitment insights and performance metrics
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3 flex-wrap">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setShowExportModal(true)}
                                className="gap-2 bg-white dark:bg-neutral-800 shadow-sm"
                            >
                                <Download size={16} />
                                Export
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => window.print()}
                                className="gap-2 bg-white dark:bg-neutral-800 shadow-sm"
                            >
                                <Printer size={16} />
                                Print
                            </Button>
                        </div>
                    </div>

                    {/* Filters Bar - Restructured */}
                    <div className="mt-6 p-4 bg-white dark:bg-neutral-900 rounded-2xl shadow-lg shadow-neutral-200/50 dark:shadow-neutral-900/50 border border-neutral-200/50 dark:border-neutral-800">
                        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                            {/* Filters Label */}
                            <div className="flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300 shrink-0">
                                <Filter size={16} className="text-neutral-500" />
                                Filters:
                            </div>

                            {/* Filter Controls */}
                            <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
                                {/* Date Range Select */}
                                <Select value={datePreset} onValueChange={(v) => setDatePreset(v as DatePreset)}>
                                    <SelectTrigger className="w-full sm:w-[200px] bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} className="text-neutral-500" />
                                            <SelectValue placeholder="Date Range" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="today">Today</SelectItem>
                                        <SelectItem value="7days">Last 7 Days</SelectItem>
                                        <SelectItem value="30days">Last 30 Days</SelectItem>
                                        <SelectItem value="90days">Last 90 Days</SelectItem>
                                        <SelectItem value="thisMonth">This Month</SelectItem>
                                        <SelectItem value="lastMonth">Last Month</SelectItem>
                                        <SelectItem value="custom">Custom Range</SelectItem>
                                    </SelectContent>
                                </Select>

                                {/* Job Filter Select */}
                                <Select value={selectedJobId || 'all'} onValueChange={(v) => setSelectedJobId(v === 'all' ? '' : v)}>
                                    <SelectTrigger className="w-full sm:w-[220px] bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors">
                                        <div className="flex items-center gap-2">
                                            <Briefcase size={14} className="text-neutral-500" />
                                            <SelectValue placeholder="All Jobs" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Jobs</SelectItem>
                                        {jobs.map((job) => (
                                            <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Custom Date Range Inputs */}
                                {datePreset === 'custom' && (
                                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                        <Input
                                            type="date"
                                            value={customStartDate}
                                            onChange={(e) => setCustomStartDate(e.target.value)}
                                            placeholder="Start Date"
                                            className="w-full sm:w-[160px] bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
                                        />
                                        <span className="hidden sm:flex items-center text-neutral-400">→</span>
                                        <Input
                                            type="date"
                                            value={customEndDate}
                                            onChange={(e) => setCustomEndDate(e.target.value)}
                                            placeholder="End Date"
                                            className="w-full sm:w-[160px] bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>


                    {/* Tabs */}
                    <div className="mt-6 flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl w-fit">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as ReportType)}
                                    className={`relative px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${activeTab === tab.id
                                        ? 'text-neutral-900 dark:text-white'
                                        : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                                        }`}
                                >
                                    {activeTab === tab.id && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute inset-0 bg-white dark:bg-neutral-700 rounded-lg shadow-sm"
                                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    <span className="relative flex items-center gap-2">
                                        <Icon size={16} />
                                        {tab.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                    <motion.div
                        key="overview"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        {/* Key Metrics */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <MetricCard
                                title="Active Jobs"
                                value={summaryStats?.activeJobs || 0}
                                change={12}
                                icon={<Briefcase size={20} />}
                                color="blue"
                                loading={isLoading}
                            />
                            <MetricCard
                                title="Total Candidates"
                                value={summaryStats?.totalCandidates || 0}
                                change={8}
                                icon={<Users size={20} />}
                                color="green"
                                loading={isLoading}
                            />
                            <MetricCard
                                title="Interviews Scheduled"
                                value={summaryStats?.upcomingInterviews || 0}
                                change={-3}
                                icon={<Calendar size={20} />}
                                color="purple"
                                loading={isLoading}
                            />
                            <MetricCard
                                title="Avg. Time to Hire"
                                value={`${timeToHire?.averageDays || 0} days`}
                                change={-15}
                                icon={<Timer size={20} />}
                                color="orange"
                                subtitle="Lower is better"
                                loading={isLoading}
                            />
                        </div>

                        {/* Charts Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Pipeline Distribution */}
                            <ChartCard title="Pipeline Distribution" subtitle="Current candidate distribution across stages">
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RechartsPieChart>
                                            <Pie
                                                data={pipelineChartData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={2}
                                                dataKey="value"
                                            >
                                                {pipelineChartData.map((entry: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend
                                                verticalAlign="bottom"
                                                height={36}
                                                formatter={(value) => <span className="text-xs text-neutral-600 dark:text-neutral-400">{value}</span>}
                                            />
                                        </RechartsPieChart>
                                    </ResponsiveContainer>
                                </div>
                            </ChartCard>

                            {/* Source Performance */}
                            <ChartCard title="Source Performance" subtitle="Applications and hires by source">
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={sourceChartData} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                            <XAxis type="number" tick={{ fontSize: 12 }} />
                                            <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Bar dataKey="applications" fill="#3B82F6" name="Applications" radius={[0, 4, 4, 0]} />
                                            <Bar dataKey="hired" fill="#10B981" name="Hired" radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </ChartCard>
                        </div>

                        {/* Hiring Funnel */}
                        <ChartCard title="Hiring Funnel" subtitle="Conversion through recruitment stages">
                            <div className="h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={funnelChartData}>
                                        <defs>
                                            <linearGradient id="funnelGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                        <YAxis tick={{ fontSize: 12 }} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#3B82F6"
                                            strokeWidth={2}
                                            fill="url(#funnelGradient)"
                                            name="Candidates"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            {funnelData?.conversionRates && (
                                <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                                    <div className="flex flex-wrap gap-6">
                                        {funnelData.conversionRates.slice(0, 4).map((rate: any, index: number) => (
                                            <div key={index} className="text-center">
                                                <p className="text-2xl font-bold text-neutral-900 dark:text-white">{rate.rate}%</p>
                                                <p className="text-xs text-neutral-500">{rate.from} → {rate.to}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </ChartCard>
                    </motion.div>
                )}

                {activeTab === 'pipeline' && (
                    <motion.div
                        key="pipeline"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        {/* Pipeline Stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <MetricCard
                                title="Total Applications"
                                value={reportData?.totalApplications || 0}
                                icon={<Users size={20} />}
                                color="blue"
                                loading={isLoading}
                            />
                            <MetricCard
                                title="Hired"
                                value={reportData?.hires || 0}
                                icon={<UserCheck size={20} />}
                                color="green"
                                loading={isLoading}
                            />
                            <MetricCard
                                title="Rejected"
                                value={reportData?.rejected || 0}
                                icon={<XCircle size={20} />}
                                color="red"
                                loading={isLoading}
                            />
                            <MetricCard
                                title="Conversion Rate"
                                value={`${(reportData?.conversionRate || 0).toFixed(1)}%`}
                                icon={<TrendingUp size={20} />}
                                color="purple"
                                loading={isLoading}
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Status Distribution */}
                            <ChartCard title="Application Status Distribution">
                                <div className="h-[350px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={pipelineChartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                            <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
                                            <YAxis tick={{ fontSize: 12 }} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Bar dataKey="value" name="Count" radius={[4, 4, 0, 0]}>
                                                {pipelineChartData.map((entry: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </ChartCard>

                            {/* By Job Breakdown */}
                            <ChartCard title="Applications by Job">
                                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
                                    {reportData?.byJob && Object.entries(reportData.byJob)
                                        .sort(([, a], [, b]) => (b as number) - (a as number))
                                        .map(([job, count]) => {
                                            const percentage = ((count as number) / (reportData.totalApplications || 1)) * 100;
                                            return (
                                                <div key={job} className="group">
                                                    <div className="flex justify-between text-sm mb-2">
                                                        <span className="font-medium text-neutral-700 dark:text-neutral-200 truncate max-w-[200px]">{job}</span>
                                                        <span className="text-neutral-500 font-semibold">{count as number}</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${percentage}%` }}
                                                            transition={{ duration: 0.5, delay: 0.1 }}
                                                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    {!reportData?.byJob || Object.keys(reportData.byJob).length === 0 && (
                                        <div className="text-center py-8 text-neutral-500">No data available</div>
                                    )}
                                </div>
                            </ChartCard>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'sourcing' && (
                    <motion.div
                        key="sourcing"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        <ChartCard title="Source Effectiveness Analysis" subtitle="Compare recruitment sources by key metrics">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-neutral-200 dark:border-neutral-700">
                                            <th className="text-left py-3 px-4 font-semibold text-neutral-500 uppercase text-xs tracking-wider">Source</th>
                                            <th className="text-right py-3 px-4 font-semibold text-neutral-500 uppercase text-xs tracking-wider">Applications</th>
                                            <th className="text-right py-3 px-4 font-semibold text-neutral-500 uppercase text-xs tracking-wider">Hired</th>
                                            <th className="text-right py-3 px-4 font-semibold text-neutral-500 uppercase text-xs tracking-wider">Hire Rate</th>
                                            <th className="text-right py-3 px-4 font-semibold text-neutral-500 uppercase text-xs tracking-wider">Interview Rate</th>
                                            <th className="text-right py-3 px-4 font-semibold text-neutral-500 uppercase text-xs tracking-wider">Avg Days to Hire</th>
                                            <th className="py-3 px-4 font-semibold text-neutral-500 uppercase text-xs tracking-wider w-32">Performance</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                        {sourceData.map((source, index) => (
                                            <motion.tr
                                                key={source.source}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                                            >
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                                        <span className="font-medium text-neutral-900 dark:text-white">{source.source}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-right text-neutral-600 dark:text-neutral-300">{source.applications}</td>
                                                <td className="py-4 px-4 text-right">
                                                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                                                        <CheckCircle2 size={14} />
                                                        {source.hired}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-right">
                                                    <span className={`font-semibold ${source.hireRate >= 10 ? 'text-emerald-600' : source.hireRate >= 5 ? 'text-amber-600' : 'text-neutral-500'}`}>
                                                        {source.hireRate}%
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-right text-neutral-600 dark:text-neutral-300">{source.interviewRate}%</td>
                                                <td className="py-4 px-4 text-right text-neutral-600 dark:text-neutral-300">{source.avgDaysToHire || '-'}</td>
                                                <td className="py-4 px-4">
                                                    <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full transition-all duration-500"
                                                            style={{
                                                                width: `${Math.min(source.hireRate * 5, 100)}%`,
                                                                backgroundColor: COLORS[index % COLORS.length]
                                                            }}
                                                        />
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </ChartCard>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Source Pie Chart */}
                            <ChartCard title="Application Volume by Source">
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RechartsPieChart>
                                            <Pie
                                                data={sourceChartData}
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={100}
                                                dataKey="applications"
                                                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                                labelLine={false}
                                            >
                                                {sourceChartData.map((entry: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                        </RechartsPieChart>
                                    </ResponsiveContainer>
                                </div>
                            </ChartCard>

                            {/* Hire Rate Comparison */}
                            <ChartCard title="Hire Rate Comparison">
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={sourceChartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                            <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
                                            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Bar dataKey="hireRate" name="Hire Rate %" radius={[4, 4, 0, 0]}>
                                                {sourceChartData.map((entry: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </ChartCard>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'time' && (
                    <motion.div
                        key="time"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <MetricCard
                                title="Average Time to Hire"
                                value={`${timeToHire?.averageDays || 0} days`}
                                change={-15}
                                icon={<Clock size={20} />}
                                color="blue"
                                subtitle="From application to offer accepted"
                                loading={isLoading}
                            />
                            <MetricCard
                                title="Total Hires"
                                value={timeToHire?.totalHired || 0}
                                icon={<UserCheck size={20} />}
                                color="green"
                                loading={isLoading}
                            />
                            <MetricCard
                                title="Time to First Interview"
                                value="5 days"
                                icon={<Calendar size={20} />}
                                color="purple"
                                subtitle="Average"
                                loading={isLoading}
                            />
                            <MetricCard
                                title="Offer Accept Rate"
                                value={`${funnelData?.summary?.offerToHire || 0}%`}
                                icon={<Award size={20} />}
                                color="orange"
                                loading={isLoading}
                            />
                        </div>

                        {/* Funnel Conversion Metrics */}
                        <ChartCard title="Stage Conversion Metrics" subtitle="Time and conversion rates through each stage">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10 rounded-xl">
                                    <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">{funnelData?.summary?.applicationToScreening || 0}%</p>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">Application → Screening</p>
                                </div>
                                <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/10 rounded-xl">
                                    <p className="text-4xl font-bold text-purple-600 dark:text-purple-400">{funnelData?.summary?.screeningToInterview || 0}%</p>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">Screening → Interview</p>
                                </div>
                                <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/10 rounded-xl">
                                    <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">{funnelData?.summary?.interviewToOffer || 0}%</p>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">Interview → Offer</p>
                                </div>
                                <div className="text-center p-6 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/10 rounded-xl">
                                    <p className="text-4xl font-bold text-amber-600 dark:text-amber-400">{funnelData?.summary?.offerToHire || 0}%</p>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">Offer → Hire</p>
                                </div>
                            </div>
                        </ChartCard>
                    </motion.div>
                )}

                {activeTab === 'team' && (
                    <motion.div
                        key="team"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <MetricCard
                                title="Active Users Today"
                                value={userActivity?.activeUsersToday || 0}
                                icon={<Users size={20} />}
                                color="blue"
                                loading={isLoading}
                            />
                            <MetricCard
                                title="Total Users"
                                value={`${userActivity?.totalUsers || 0}/${userActivity?.licenseLimit || 50}`}
                                icon={<Target size={20} />}
                                color="green"
                                subtitle="License usage"
                                loading={isLoading}
                            />
                            <MetricCard
                                title="Actions Today"
                                value={userActivity?.activityTrend?.slice(-1)[0]?.count || 0}
                                icon={<Activity size={20} />}
                                color="purple"
                                loading={isLoading}
                            />
                            <MetricCard
                                title="Weekly Actions"
                                value={userActivity?.activityTrend?.reduce((sum: number, d: any) => sum + d.count, 0) || 0}
                                icon={<Zap size={20} />}
                                color="orange"
                                loading={isLoading}
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Activity Trend */}
                            <ChartCard title="Activity Trend (Last 7 Days)">
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={userActivity?.activityTrend || []}>
                                            <defs>
                                                <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => format(new Date(v), 'MMM d')} />
                                            <YAxis tick={{ fontSize: 12 }} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Area type="monotone" dataKey="count" stroke="#8B5CF6" strokeWidth={2} fill="url(#activityGradient)" name="Actions" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </ChartCard>

                            {/* Most Active Users */}
                            <ChartCard title="Top Contributors">
                                <div className="space-y-4">
                                    {userActivity?.mostActiveUsers?.map((user: any, index: number) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="flex items-center gap-4 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl"
                                        >
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${index === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
                                                index === 1 ? 'bg-gradient-to-br from-neutral-300 to-neutral-500' :
                                                    'bg-gradient-to-br from-amber-600 to-amber-800'
                                                }`}>
                                                {index + 1}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-neutral-900 dark:text-white">{user.name}</p>
                                                <p className="text-sm text-neutral-500">{user.actions} actions this month</p>
                                            </div>
                                            <Award size={20} className={index === 0 ? 'text-amber-500' : 'text-neutral-400'} />
                                        </motion.div>
                                    ))}
                                    {(!userActivity?.mostActiveUsers || userActivity.mostActiveUsers.length === 0) && (
                                        <div className="text-center py-8 text-neutral-500">No activity data available</div>
                                    )}
                                </div>
                            </ChartCard>
                        </div>

                        {/* Action Breakdown */}
                        {userActivity?.actionBreakdown && userActivity.actionBreakdown.length > 0 && (
                            <ChartCard title="Action Breakdown">
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    {userActivity.actionBreakdown.map((action: any) => (
                                        <div key={action.action} className="text-center p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl">
                                            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{action.count}</p>
                                            <p className="text-xs text-neutral-500 mt-1 truncate">{action.action.replace(/_/g, ' ').toLowerCase()}</p>
                                        </div>
                                    ))}
                                </div>
                            </ChartCard>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Column Selector Modal */}
            <ColumnSelector
                isOpen={showColumnSelector}
                onClose={() => setShowColumnSelector(false)}
                columns={exportColumns}
                onExport={handleExportWithColumns}
                title="Select Report Metrics to Export"
                description="Choose which source effectiveness metrics you want in your CSV report"
                exportButtonText="Download Report"
            />
            
            {/* Export Options Modal */}
            <AnimatePresence>
                {showExportModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
                        >
                            <div className="p-6 border-b border-neutral-100 dark:border-neutral-800">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Export Report</h3>
                                    <button onClick={() => setShowExportModal(false)} className="text-neutral-400 hover:text-neutral-500">
                                        <XCircle size={20} />
                                    </button>
                                </div>
                                <p className="text-sm text-neutral-500 mt-1">Choose the type of report you want to download</p>
                            </div>
                            
                            <div className="p-6 space-y-4">
                                <button
                                    onClick={handleDetailedExport}
                                    className="w-full flex items-start gap-4 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group text-left"
                                >
                                    <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-lg text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                        <FileText size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-neutral-900 dark:text-white">Detailed Applications Report</h4>
                                        <p className="text-sm text-neutral-500 mt-1">Full list of applications with candidate details, stages, and status history.</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => {
                                        setShowExportModal(false);
                                        setShowColumnSelector(true);
                                    }}
                                    className="w-full flex items-start gap-4 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all group text-left"
                                >
                                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                                        <FileSpreadsheet size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-neutral-900 dark:text-white">Source Effectiveness</h4>
                                        <p className="text-sm text-neutral-500 mt-1">Aggregated metrics on channel performance, hire rates, and costs.</p>
                                    </div>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
