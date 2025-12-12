import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Search, Filter, Download, MoreVertical, Copy, XCircle } from 'lucide-react';
import { jobsApi } from '../../lib/api';
import type { ApiResponse, Job, PaginationMeta } from '../../lib/types';
import { StatusBadge, Button } from '../../components/ui';
import { SavedViews } from '../../components/common/SavedViews';

const JOB_STATUSES = ['OPEN', 'DRAFT', 'CLOSED', 'PENDING_APPROVAL', 'APPROVED', 'ON_HOLD', 'CANCELLED'];

export function JobsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tenantId } = useParams<{ tenantId: string }>();
  const [searchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') ?? '');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
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

  const fetchJobs = async (page = 1) => {
    if (!tenantId) return;
    setIsLoading(true);
    setError('');

    try {
      const response = await jobsApi.getAll(tenantId, {
        page,
        search: searchQuery || undefined,
        status: statusFilter || undefined,
        department: departmentFilter || undefined,
        location: locationFilter || undefined,
        employmentType: employmentTypeFilter || undefined,
        sortBy: sortBy || undefined,
        sortOrder: sortBy ? sortOrder : undefined,
      });

      const apiResponse = response.data as ApiResponse<Job[]>;
      setJobs(apiResponse.data || []);
      if (apiResponse.meta) {
        setMeta(apiResponse.meta);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to load jobs. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyView = (viewFilters: Record<string, any>) => {
    setSearchQuery(viewFilters.search || '');
    setStatusFilter(viewFilters.status || '');
    setDepartmentFilter(viewFilters.department || '');
    setLocationFilter(viewFilters.location || '');
    setEmploymentTypeFilter(viewFilters.employmentType || '');
    setSortBy(viewFilters.sortBy || '');
    setSortOrder(viewFilters.sortOrder || 'asc');
    toast.success(t('jobs.savedViews.applySuccess'));
  };

  const handleResetView = () => {
    setSearchQuery('');
    setStatusFilter('');
    setDepartmentFilter('');
    setLocationFilter('');
    setEmploymentTypeFilter('');
    setSortBy('');
    setSortOrder('asc');
  };

  const handleUpdateStatus = async (jobId: string, status: string) => {
    if (!tenantId) return;
    setError('');
    try {
      await jobsApi.updateStatus(tenantId, jobId, status);
      await fetchJobs(meta?.page || 1);
      await fetchJobs(meta?.page || 1);
      const message = t('jobs.statusUpdateSuccess');
      toast.success(message);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to update job status. Please try again.');
    }
  };

  const handleSubmitApproval = async (jobId: string) => {
    if (!tenantId) return;
    setError('');
    try {
      await jobsApi.submitApproval(tenantId, jobId);
      await fetchJobs(meta?.page || 1);
      toast.success(t('jobs.create.messages.submittedForApproval'));
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to submit for approval. Please try again.');
    }
  };

  const handleClone = async (jobId: string) => {
    if (!tenantId) return;
    setError('');
    try {
      await jobsApi.clone(tenantId, jobId);
      await fetchJobs(meta?.page || 1);
      await fetchJobs(meta?.page || 1);
      const message = t('jobs.cloneSuccess');
      toast.success(message);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to clone job. Please try again.');
    }
  };

  const handleExport = async (ids?: string[]) => {
    if (!tenantId) return;
    try {
      const response = await jobsApi.export(tenantId, {
        search: searchQuery || undefined,
        status: statusFilter || undefined,
        department: departmentFilter || undefined,
        location: locationFilter || undefined,
        employmentType: employmentTypeFilter || undefined,
        sortBy: sortBy || undefined,
        sortOrder: sortBy ? sortOrder : undefined,
        ids: ids,
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `jobs_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(t('jobs.exportSuccess'));
    } catch (err) {
      console.error(err);
      toast.error(t('jobs.exportError'));
    }
  };

  useEffect(() => {
    if (tenantId) {
      fetchJobs(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (tenantId) {
        fetchJobs(1);
      }
    }, 400);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, statusFilter, departmentFilter, locationFilter, employmentTypeFilter, sortBy, sortOrder, tenantId]);

  const departmentOptions = Array.from(
    new Set((jobs || []).map((job) => job.department?.name).filter((name): name is string => Boolean(name)))
  );

  const locationOptions = Array.from(
    new Set((jobs || []).map((job) => job.location?.name).filter((name): name is string => Boolean(name)))
  );

  const employmentTypeOptions = Array.from(
    new Set((jobs || []).map((job) => job.employmentType).filter((value) => Boolean(value)))
  ) as string[];

  const toggleSort = (column: string) => {
    setSortBy((current) => {
      if (current !== column) {
        setSortOrder('asc');
        return column;
      }

      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return current;
    });
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

  const handleBulkClose = async () => {
    if (selectedJobIds.length === 0 || !tenantId) return;

    setError('');
    try {
      await Promise.all(selectedJobIds.map((jobId) => jobsApi.updateStatus(tenantId, jobId, 'CLOSED')));
      setSelectedJobIds([]);
      await fetchJobs(meta?.page || 1);
      await fetchJobs(meta?.page || 1);
      toast.success(t('jobs.bulkCloseSuccess'));
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to update some jobs. Please try again.');
    }
  };

  return (
    <div className="h-full min-h-0 flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">{t('jobs.title')}</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{t('jobs.manageJobs')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
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
            className="gap-2"
            onClick={() => handleExport()}
          >
            <Download size={16} />
            <span className="hidden sm:inline">{t('common.export', 'Export')}</span>
          </Button>
          <Button
            className="gap-2"
            onClick={() => navigate(`/${tenantId}/jobs/new`)}
          >
            <Plus size={16} />
            <span className="hidden sm:inline">{t('jobs.createJob')}</span>
          </Button>
        </div>
      </div>

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
                onClick={() => handleExport(selectedJobIds)}
              >
                <Download size={14} />
                {t('jobs.bulk.exportSelected')}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkClose}
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
                    {job.location?.name || '—'}
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
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => handleSubmitApproval(job.id)}
                        >
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
                disabled={!meta.hasPrevPage}
                onClick={() => meta?.hasPrevPage && fetchJobs(meta.page - 1)}
              >
                {t('common.pagination.prev')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!meta.hasNextPage}
                onClick={() => meta?.hasNextPage && fetchJobs(meta.page + 1)}
              >
                {t('common.pagination.next')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
