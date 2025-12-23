import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Search, Filter, Download, MoreVertical, Copy, XCircle, Briefcase, Sparkles } from 'lucide-react';
import { StatusBadge, Button, PageHeader } from '../../components/ui';
import { SavedViews, ColumnSelector, ExportColumn } from '../../components/common';
import { useJobs, useUpdateJobStatus, useCloneJob, useSubmitJobApproval, useBulkUpdateJobStatus } from '../../hooks/queries';
import { logger } from '../../lib/logger';
import { convertToCSV, downloadCSV, CSV_TRANSFORMERS, CsvColumn } from '../../lib/csv-utils';

const log = logger.component('JobsPage');

const JOB_STATUSES = ['OPEN', 'DRAFT', 'CLOSED', 'PENDING_APPROVAL', 'APPROVED', 'ON_HOLD', 'CANCELLED'];

export function JobsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tenantId } = useParams<{ tenantId: string }>();
  const [searchParams] = useSearchParams();

  // Filter state
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') ?? '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>(() => searchParams.get('status') ?? '');
  const [departmentFilter, setDepartmentFilter] = useState<string>(
    () => searchParams.get('department') ?? ''
  );
  const [locationFilter, setLocationFilter] = useState<string>(
    () => searchParams.get('location') ?? ''
  );
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState<string>(
    () => searchParams.get('employmentType') ?? ''
  );
  const [sortBy, setSortBy] = useState<string>(() => searchParams.get('sortBy') ?? '');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(
    () => (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc'
  );
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [showColumnSelector, setShowColumnSelector] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // React Query hooks
  const {
    data: jobsData,
    isLoading,
    error: queryError,
  } = useJobs({
    tenantId: tenantId || '',
    page,
    search: debouncedSearch,
    status: statusFilter,
    department: departmentFilter,
    location: locationFilter,
    employmentType: employmentTypeFilter,
    sortBy,
    sortOrder,
  });

  const updateStatusMutation = useUpdateJobStatus(tenantId || '');
  const cloneMutation = useCloneJob(tenantId || '');
  const submitApprovalMutation = useSubmitJobApproval(tenantId || '');
  const bulkUpdateMutation = useBulkUpdateJobStatus(tenantId || '');

  // Derived state
  const jobs = jobsData?.data || [];
  const meta = jobsData?.meta || null;
  const error = queryError ? (queryError as Error).message : '';

  const handleApplyView = (viewFilters: Record<string, unknown>) => {
    setSearchQuery((viewFilters.search as string) || '');
    setDebouncedSearch((viewFilters.search as string) || '');
    setStatusFilter((viewFilters.status as string) || '');
    setDepartmentFilter((viewFilters.department as string) || '');
    setLocationFilter((viewFilters.location as string) || '');
    setEmploymentTypeFilter((viewFilters.employmentType as string) || '');
    setSortBy((viewFilters.sortBy as string) || '');
    setSortOrder((viewFilters.sortOrder as 'asc' | 'desc') || 'asc');
    setPage(1);
    toast.success(t('jobs.savedViews.applySuccess'));
  };

  const handleResetView = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setStatusFilter('');
    setDepartmentFilter('');
    setLocationFilter('');
    setEmploymentTypeFilter('');
    setSortBy('');
    setSortOrder('asc');
    setPage(1);
  };

  const handleUpdateStatus = (jobId: string, status: string) => {
    log.info('Updating job status', { jobId, status });
    updateStatusMutation.mutate({ jobId, status });
  };

  const handleSubmitApproval = (jobId: string) => {
    log.info('Submitting job for approval', { jobId });
    submitApprovalMutation.mutate({ jobId });
  };

  const handleClone = (jobId: string) => {
    log.info('Cloning job', { jobId });
    cloneMutation.mutate(jobId);
  };

  // Define export columns
  const exportColumns: ExportColumn[] = [
    { key: 'jobCode', label: 'Job ID', defaultSelected: true },
    { key: 'title', label: 'Job Title', defaultSelected: true },
    { key: 'department', label: 'Department', defaultSelected: true },
    { key: 'location', label: 'Location', defaultSelected: true },
    { key: 'status', label: 'Status', defaultSelected: true },
    { key: 'employmentType', label: 'Employment Type', defaultSelected: false },
    { key: 'applicants', label: 'Number of Applicants', defaultSelected: true },
    { key: 'hiringManager', label: 'Hiring Manager', defaultSelected: false },
    { key: 'recruiter', label: 'Recruiter', defaultSelected: false },
    { key: 'salaryMin', label: 'Minimum Salary', defaultSelected: false },
    { key: 'salaryMax', label: 'Maximum Salary', defaultSelected: false },
    { key: 'createdAt', label: 'Created Date', defaultSelected: true },
    { key: 'publishedAt', label: 'Published Date', defaultSelected: false },
  ];

  // Define CSV column transformations
  const csvColumns: CsvColumn[] = [
    { key: 'jobCode', header: 'Job ID' },
    { key: 'title', header: 'Job Title' },
    {
      key: 'department',
      header: 'Department',
      transform: (_val, row) => row.department?.name || ''
    },
    {
      key: 'location',
      header: 'Location',
      transform: (_val, row) => row.locations?.map((l: any) => l.name).join('; ') || (row.workLocation === 'REMOTE' ? 'Remote' : '')
    },
    { key: 'status', header: 'Status' },
    { key: 'employmentType', header: 'Employment Type' },
    {
      key: 'applicants',
      header: 'Number of Applicants',
      transform: (_val, row) => row._count?.applications || 0
    },
    {
      key: 'hiringManager',
      header: 'Hiring Manager',
      transform: (_val, row) => row.hiringManager
        ? `${row.hiringManager.firstName} ${row.hiringManager.lastName}`
        : ''
    },
    {
      key: 'recruiter',
      header: 'Recruiter',
      transform: (_val, row) => row.recruiter
        ? `${row.recruiter.firstName} ${row.recruiter.lastName}`
        : ''
    },
    {
      key: 'salaryMin',
      header: 'Minimum Salary',
      transform: CSV_TRANSFORMERS.currency
    },
    {
      key: 'salaryMax',
      header: 'Maximum Salary',
      transform: CSV_TRANSFORMERS.currency
    },
    {
      key: 'createdAt',
      header: 'Created Date',
      transform: CSV_TRANSFORMERS.date
    },
    {
      key: 'publishedAt',
      header: 'Published Date',
      transform: CSV_TRANSFORMERS.date
    },
  ];

  const handleExportWithColumns = (selectedColumns: string[]) => {
    const dataToExport = selectedJobIds.length > 0
      ? jobs.filter(job => selectedJobIds.includes(job.id))
      : jobs;

    const csvContent = convertToCSV(dataToExport, csvColumns, selectedColumns);
    downloadCSV(csvContent, `jobs_export_${new Date().toISOString().split('T')[0]}.csv`);
    toast.success(t('jobs.exportSuccess'));
  };

  // Memoized filter options from current jobs data
  const departmentOptions = useMemo(() =>
    Array.from(new Set(jobs.map((job) => job.department?.name).filter((name): name is string => Boolean(name)))),
    [jobs]
  );

  const locationOptions = useMemo(() =>
    Array.from(new Set(jobs.flatMap((job) => job.locations?.map(l => l.name) || []).filter((name): name is string => Boolean(name)))),
    [jobs]
  );

  const employmentTypeOptions = useMemo(() =>
    Array.from(new Set(jobs.map((job) => job.employmentType).filter((value) => Boolean(value)))) as string[],
    [jobs]
  );

  const toggleSort = (column: string) => {
    if (sortBy !== column) {
      // New column: start with ascending
      setSortBy(column);
      setSortOrder('asc');
    } else if (sortOrder === 'asc') {
      // Same column, was asc: switch to desc
      setSortOrder('desc');
    } else {
      // Same column, was desc: reset to original (no sort)
      setSortBy('');
      setSortOrder('asc');
    }
  };

  const toggleJobSelection = (jobId: string) => {
    setSelectedJobIds((current) =>
      current.includes(jobId) ? current.filter((id) => id !== jobId) : [...current, jobId]
    );
  };

  const isAllSelected = jobs.length > 0 && selectedJobIds.length === jobs.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedJobIds([]);
    } else {
      setSelectedJobIds(jobs.map((job) => job.id));
    }
  };

  const handleBulkClose = () => {
    if (selectedJobIds.length === 0 || !tenantId) return;
    log.info('Bulk closing jobs', { count: selectedJobIds.length });
    bulkUpdateMutation.mutate(
      { jobIds: selectedJobIds, status: 'CLOSED' },
      { onSuccess: () => setSelectedJobIds([]) }
    );
  };

  // Check if any mutation is in progress
  const isMutating = updateStatusMutation.isPending ||
    cloneMutation.isPending ||
    submitApprovalMutation.isPending ||
    bulkUpdateMutation.isPending;

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      {/* Premium Page Header */}
      <PageHeader
        title={t('jobs.title')}
        subtitle={t('jobs.manageJobs')}
        icon={Briefcase}
        iconColor="blue"
        badge={{ text: 'AI-Powered', icon: Sparkles }}
        actions={
          <>
            <SavedViews
              entity="JOB"
              currentFilters={{
                search: searchQuery,
                status: statusFilter,
                department: departmentFilter,
                location: locationFilter,
                employmentType: employmentTypeFilter,
                sortBy,
                sortOrder,
              }}
              onApplyView={handleApplyView}
              onReset={handleResetView}
            />
            <Button
              variant="outline"
              size="sm"
              className="gap-2 bg-white dark:bg-neutral-800 shadow-sm"
              onClick={() => setShowColumnSelector(true)}
            >
              <Download size={16} />
              <span className="hidden sm:inline">{t('common.export', 'Export')}</span>
            </Button>
            <Button
              size="sm"
              className="gap-2 shadow-lg shadow-blue-500/25"
              onClick={() => navigate(`/${tenantId}/jobs/new`)}
            >
              <Plus size={16} />
              <span className="hidden sm:inline">{t('jobs.createJob')}</span>
            </Button>
          </>
        }
      />

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
          <input
            type="text"
            placeholder={t('jobs.searchPlaceholder')}
            className="w-full h-10 pl-10 pr-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          className="gap-2 shrink-0"
          onClick={() => setIsFilterOpen((open) => !open)}
        >
          <Filter size={16} />
          {t('common.filter')}
          {isFilterOpen && <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />}
        </Button>
      </div>

      {isFilterOpen && (
        <div className="bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 space-y-4">
          {/* Status Filter */}
          <div className="space-y-2">
            <span className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              {t('jobs.filters.statusLabel')}
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${!statusFilter
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
                  : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                  }`}
                onClick={() => setStatusFilter('')}
              >
                {t('jobs.filters.allStatuses')}
              </button>
              {JOB_STATUSES.map((statusKey) => (
                <button
                  key={statusKey}
                  type="button"
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === statusKey
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
                    : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                    }`}
                  onClick={() => setStatusFilter(statusKey)}
                >
                  {statusKey.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Other Filters */}
          <div className="flex flex-wrap gap-4">
            {/* Department filter */}
            {departmentOptions.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  {t('jobs.filters.departmentLabel')}
                </span>
                <select
                  className="block h-9 px-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={departmentFilter}
                  onChange={(event) => setDepartmentFilter(event.target.value)}
                >
                  <option value="">{t('jobs.filters.allDepartments')}</option>
                  {departmentOptions.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Location filter */}
            {locationOptions.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  {t('jobs.filters.locationLabel')}
                </span>
                <select
                  className="block h-9 px-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={locationFilter}
                  onChange={(event) => setLocationFilter(event.target.value)}
                >
                  <option value="">{t('jobs.filters.allLocations')}</option>
                  {locationOptions.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Employment type filter */}
            {employmentTypeOptions.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  {t('jobs.filters.employmentTypeLabel')}
                </span>
                <select
                  className="block h-9 px-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={employmentTypeFilter}
                  onChange={(event) => setEmploymentTypeFilter(event.target.value)}
                >
                  <option value="">{t('jobs.filters.allEmploymentTypes')}</option>
                  {employmentTypeOptions.map((value) => (
                    <option key={value} value={value}>{value.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
          <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
          {error}
        </div>
      )}

      {/* Jobs table */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-sm flex-1 min-h-0 flex flex-col">
        {selectedJobIds.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-primary-50 dark:bg-primary-900/20">
            <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
              {t('jobs.bulk.selectedCount', { count: selectedJobIds.length })}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedJobIds([])}
              >
                {t('jobs.bulk.clearSelection')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setShowColumnSelector(true)}
              >
                <Download size={14} />
                {t('jobs.bulk.exportSelected')}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkClose}
                disabled={isMutating}
              >
                {t('jobs.bulk.closeSelected')}
              </Button>
            </div>
          </div>
        )}
        <div className="flex-1 min-h-0 overflow-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-800/30">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    aria-label={t('jobs.bulk.selectAll')}
                  />
                </th>
                <th
                  className="text-left text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 px-4 py-3 cursor-pointer select-none hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                  onClick={() => toggleSort('title')}
                >
                  <span className="flex items-center gap-1">
                    {t('jobs.table.jobTitle')}
                    {sortBy === 'title' && <span className="text-primary-500">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                  </span>
                </th>
                <th className="text-left text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 px-4 py-3">Job ID</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 px-4 py-3">{t('jobs.table.department')}</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 px-4 py-3">{t('jobs.table.location')}</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 px-4 py-3">{t('jobs.table.status')}</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 px-4 py-3">{t('jobs.table.applicants')}</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 px-4 py-3">Hiring Manager</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 px-4 py-3">Recruiter</th>
                <th
                  className="text-left text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 px-4 py-3 cursor-pointer select-none hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                  onClick={() => toggleSort('createdAt')}
                >
                  <span className="flex items-center gap-1">
                    {t('jobs.table.created')}
                    {sortBy === 'createdAt' && <span className="text-primary-500">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                  </span>
                </th>
                <th className="px-4 py-3 w-12" />
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr
                  key={job.id}
                  className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                >
                  <td className="px-4 py-4 w-10">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900"
                      checked={selectedJobIds.includes(job.id)}
                      onChange={() => toggleJobSelection(job.id)}
                      aria-label={t('jobs.bulk.selectJob')}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => navigate(`/${tenantId}/jobs/${job.id}`)}
                      className="text-sm font-medium text-neutral-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-left"
                    >
                      {job.title}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    {job.jobCode && (
                      <span className="inline-flex text-xs font-mono bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-md text-neutral-600 dark:text-neutral-400">
                        {job.jobCode}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400">
                    {job.department?.name || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400">
                    {job.locations?.length ? job.locations.map(l => l.name).join(', ') : (job.workLocation === 'REMOTE' ? 'Remote' : '—')}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge statusInfo={job.statusInfo} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 text-sm font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-full">
                      {job._count?.applications ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {job.hiringManager ? (
                      <div className="text-sm">
                        <span className="text-neutral-900 dark:text-white">{job.hiringManager.firstName} {job.hiringManager.lastName}</span>
                        {job.hiringManager.employeeId && (
                          <span className="block text-xs text-neutral-500">{job.hiringManager.employeeId}</span>
                        )}
                      </div>
                    ) : <span className="text-sm text-neutral-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {job.recruiter ? (
                      <div className="text-sm">
                        <span className="text-neutral-900 dark:text-white">{job.recruiter.firstName} {job.recruiter.lastName}</span>
                        {job.recruiter.employeeId && (
                          <span className="block text-xs text-neutral-500">{job.recruiter.employeeId}</span>
                        )}
                      </div>
                    ) : <span className="text-sm text-neutral-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-500 dark:text-neutral-400">
                    {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {job.status === 'DRAFT' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-8 gap-1.5 border-primary-200 dark:border-primary-800 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                          onClick={() => handleSubmitApproval(job.id)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                          {t('jobs.actions.sendForApproval')}
                        </Button>
                      )}
                      <div className="relative group">
                        <button
                          type="button"
                          className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        >
                          <MoreVertical size={16} className="text-neutral-400" />
                        </button>
                        <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 py-1">
                          <button
                            type="button"
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors"
                            onClick={() => handleClone(job.id)}
                          >
                            <Copy size={14} className="text-neutral-400" />
                            {t('jobs.actions.clone')}
                          </button>
                          {job.status === 'OPEN' && (
                            <button
                              type="button"
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              onClick={() => handleUpdateStatus(job.id, 'CLOSED')}
                            >
                              <XCircle size={14} />
                              {t('jobs.actions.close')}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {jobs.length === 0 && !isLoading && (
                <tr>
                  <td className="px-6 py-16 text-center" colSpan={11}>
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                        <Search size={20} className="text-neutral-400" />
                      </div>
                      <p className="text-neutral-600 dark:text-neutral-400 font-medium">{t('jobs.emptyState')}</p>
                      <p className="text-sm text-neutral-500">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {meta && meta.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/20">
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              Page {meta.page} of {meta.totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!meta.hasPrevPage || isLoading}
                onClick={() => meta?.hasPrevPage && setPage(meta.page - 1)}
              >
                {t('common.pagination.prev')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!meta.hasNextPage || isLoading}
                onClick={() => meta?.hasNextPage && setPage(meta.page + 1)}
              >
                {t('common.pagination.next')}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Column Selector Modal */}
      <ColumnSelector
        isOpen={showColumnSelector}
        onClose={() => setShowColumnSelector(false)}
        columns={exportColumns}
        onExport={handleExportWithColumns}
        title="Select Job Fields to Export"
        description="Choose which job details you want in your CSV download"
        exportButtonText="Download CSV"
      />
    </div>
  );
}
