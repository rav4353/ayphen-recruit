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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t('jobs.title')}</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">{t('jobs.manageJobs')}</p>
        </div>
        <div className="flex items-center gap-3">
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

          <button
            type="button"
            className="btn-secondary flex items-center gap-2"
            onClick={() => handleExport()}
          >
            <Download size={18} />
            {t('common.export', 'Export')}
          </button>
          <Button
            variant="primary"
            className="flex items-center gap-2"
            onClick={() => navigate(`/${tenantId}/jobs/new`)}
          >
            <Plus size={18} />
            {t('jobs.createJob')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <form className="flex flex-col sm:flex-row gap-4" onSubmit={(event) => event.preventDefault()}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
          <input
            type="text"
            placeholder={t('jobs.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 rounded-lg font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 transition-colors"
          onClick={() => setIsFilterOpen((open) => !open)}
        >
          <Filter size={18} />
          {t('common.filter')}
        </button>
      </form>

      {isFilterOpen && (
        <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-4 py-3 text-sm">
          <span className="text-neutral-600 dark:text-neutral-300">
            {t('jobs.filters.statusLabel')}
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`px-3 py-1 rounded-full border text-xs font-medium transition-colors ${!statusFilter
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white'
                : 'bg-transparent text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700'
                }`}
              onClick={() => setStatusFilter('')}
            >
              {t('jobs.filters.allStatuses')}
            </button>
            {JOB_STATUSES.map((statusKey) => (
              <button
                key={statusKey}
                type="button"
                className={`px-3 py-1 rounded-full border text-xs font-medium transition-colors ${statusFilter === statusKey
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white'
                  : 'bg-transparent text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700'
                  }`}
                onClick={() => setStatusFilter(statusKey)}
              >
                {statusKey.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          {/* Department filter */}
          {departmentOptions.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-neutral-600 dark:text-neutral-300">
                {t('jobs.filters.departmentLabel')}
              </span>
              <select
                className="mt-1 px-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-neutral-900 dark:text-white"
                value={departmentFilter}
                onChange={(event) => setDepartmentFilter(event.target.value)}
              >
                <option value="">
                  {t('jobs.filters.allDepartments')}
                </option>
                {departmentOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Location filter */}
          {locationOptions.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-neutral-600 dark:text-neutral-300">
                {t('jobs.filters.locationLabel')}
              </span>
              <select
                className="mt-1 px-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-neutral-900 dark:text-white"
                value={locationFilter}
                onChange={(event) => setLocationFilter(event.target.value)}
              >
                <option value="">
                  {t('jobs.filters.allLocations')}
                </option>
                {locationOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Employment type filter */}
          {employmentTypeOptions.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-neutral-600 dark:text-neutral-300">
                {t('jobs.filters.employmentTypeLabel')}
              </span>
              <select
                className="mt-1 px-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-neutral-900 dark:text-white"
                value={employmentTypeFilter}
                onChange={(event) => setEmploymentTypeFilter(event.target.value)}
              >
                <option value="">
                  {t('jobs.filters.allEmploymentTypes')}
                </option>
                {employmentTypeOptions.map((value) => (
                  <option key={value} value={value}>
                    {value.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Jobs table */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
        {selectedJobIds.length > 0 && (
          <div className="flex items-center justify-between px-6 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/60 text-sm text-neutral-700 dark:text-neutral-200">
            <span>
              {t('jobs.bulk.selectedCount', {
                count: selectedJobIds.length,
              })}
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:underline"
                onClick={() => setSelectedJobIds([])}
              >
                {t('jobs.bulk.clearSelection')}
              </button>
              <button
                type="button"
                className="px-3 py-1.5 rounded-md bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 text-neutral-700 dark:text-neutral-200 text-xs font-medium hover:bg-neutral-50 dark:hover:bg-neutral-600"
                onClick={() => handleExport(selectedJobIds)}
              >
                {t('jobs.bulk.exportSelected')}
              </button>
              <button
                type="button"
                className="px-3 py-1.5 rounded-md bg-red-600 text-white text-xs font-medium hover:bg-red-700"
                onClick={handleBulkClose}
              >
                {t('jobs.bulk.closeSelected')}
              </button>
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                <th className="px-4 py-4 w-10">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    aria-label={t('jobs.bulk.selectAll')}
                  />
                </th>
                <th
                  className="text-left text-neutral-600 dark:text-neutral-400 text-sm font-medium px-6 py-4 cursor-pointer select-none"
                  onClick={() => toggleSort('title')}
                >
                  {t('jobs.table.jobTitle')}
                  {sortBy === 'title' && (
                    <span className="ml-1 text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th className="text-left text-neutral-600 dark:text-neutral-400 text-sm font-medium px-6 py-4">Job ID</th>
                <th className="text-left text-neutral-600 dark:text-neutral-400 text-sm font-medium px-6 py-4">{t('jobs.table.department')}</th>
                <th className="text-left text-neutral-600 dark:text-neutral-400 text-sm font-medium px-6 py-4">{t('jobs.table.location')}</th>
                <th className="text-left text-neutral-600 dark:text-neutral-400 text-sm font-medium px-6 py-4">{t('jobs.table.status')}</th>
                <th className="text-left text-neutral-600 dark:text-neutral-400 text-sm font-medium px-6 py-4">{t('jobs.table.applicants')}</th>
                <th className="text-left text-neutral-600 dark:text-neutral-400 text-sm font-medium px-6 py-4">Hiring Manager</th>
                <th className="text-left text-neutral-600 dark:text-neutral-400 text-sm font-medium px-6 py-4">Recruiter</th>
                <th
                  className="text-left text-neutral-600 dark:text-neutral-400 text-sm font-medium px-6 py-4 cursor-pointer select-none"
                  onClick={() => toggleSort('createdAt')}
                >
                  {t('jobs.table.created')}
                  {sortBy === 'createdAt' && (
                    <span className="ml-1 text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th className="px-6 py-4" />
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
                  <td className="px-6 py-4">
                    <button
                      onClick={() => navigate(`/${tenantId}/jobs/${job.id}`)}
                      className="text-neutral-900 dark:text-white font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left"
                    >
                      {job.title}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400">
                    {job.jobCode && (
                      <span className="text-xs font-medium bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-2 py-0.5 rounded text-neutral-600 dark:text-neutral-400">
                        {job.jobCode}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400">
                    {job.department?.name || ''}
                  </td>
                  <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400">
                    {job.location?.name || ''}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge statusInfo={job.statusInfo} />
                  </td>
                  <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400">
                    {job._count?.applications ?? 0}
                  </td>
                  <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400">
                    {job.hiringManager && (
                      <div className="flex flex-col">
                        <span>{job.hiringManager.firstName} {job.hiringManager.lastName}</span>
                        {job.hiringManager.employeeId && (
                          <span className="text-xs text-neutral-500">{job.hiringManager.employeeId}</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400">
                    {job.recruiter && (
                      <div className="flex flex-col">
                        <span>{job.recruiter.firstName} {job.recruiter.lastName}</span>
                        {job.recruiter.employeeId && (
                          <span className="text-xs text-neutral-500">{job.recruiter.employeeId}</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400">
                    {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : ''}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {job.status === 'DRAFT' && (
                        <button
                          type="button"
                          className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                          onClick={() => handleSubmitApproval(job.id)}
                        >
                          {t('jobs.actions.sendForApproval')}
                        </button>
                      )}
                      <div className="relative group">
                        <button
                          type="button"
                          className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        >
                          <MoreVertical size={16} className="text-neutral-500 dark:text-neutral-400" />
                        </button>
                        <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                          <button
                            type="button"
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors first:rounded-t-lg"
                            onClick={() => handleClone(job.id)}
                          >
                            <Copy size={14} />
                            {t('jobs.actions.clone')}
                          </button>
                          {job.status === 'OPEN' && (
                            <button
                              type="button"
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors last:rounded-b-lg"
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
                  <td
                    className="px-6 py-8 text-center text-neutral-500 dark:text-neutral-400"
                    colSpan={8}
                  >
                    {t('jobs.emptyState')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 text-sm text-neutral-600 dark:text-neutral-400">
            <span>
              {t('common.pagination.summary', {
                page: meta.page,
                totalPages: meta.totalPages,
              })}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="px-3 py-1 rounded border border-neutral-200 dark:border-neutral-700 disabled:opacity-50"
                disabled={!meta.hasPrevPage}
                onClick={() => meta?.hasPrevPage && fetchJobs(meta.page - 1)}
              >
                {t('common.pagination.prev')}
              </button>
              <button
                type="button"
                className="px-3 py-1 rounded border border-neutral-200 dark:border-neutral-700 disabled:opacity-50"
                disabled={!meta.hasNextPage}
                onClick={() => meta?.hasNextPage && fetchJobs(meta.page + 1)}
              >
                {t('common.pagination.next')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
