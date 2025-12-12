import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Search, Filter, Mail, Phone, Trash2, X, ChevronDown, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { candidatesApi } from '../../lib/api';
import type { Candidate } from '../../lib/types';
import { CandidateFilterModal } from '../../components/candidates/CandidateFilterModal';
import { BulkEmailModal } from '../../components/candidates/BulkEmailModal';
import { Button, ConfirmationModal } from '../../components/ui';
import { SavedViews } from '../../components/common/SavedViews';

export function CandidatesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tenantId } = useParams<{ tenantId: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const LIMIT = 12;

  const [filters, setFilters] = useState<{ location?: string; skills?: string[]; status?: string; source?: string }>({});

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCandidates = async () => {
    setIsLoading(true);
    try {
      const response = await candidatesApi.getAll({
        page,
        take: LIMIT,
        skip: (page - 1) * LIMIT,
        search: searchQuery,
        sortBy,
        sortOrder,
        location: filters.location,
        skills: filters.skills,
        status: filters.status,
        source: filters.source,
      });
      console.log('Candidates API Response:', response);

      let data = response.data;
      // Handle wrapped response from global interceptor
      if (data && data.data) {
        data = data.data;
      }

      if (data && Array.isArray(data.candidates)) {
        console.log('Setting candidates:', data.candidates.length);
        setCandidates(data.candidates);
        setTotalCount(data.total || 0);
        setTotalPages(Math.ceil((data.total || 0) / LIMIT));
      } else {
        console.warn('Unexpected response format:', response.data);
        setCandidates([]);
        setTotalCount(0);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Failed to fetch candidates', error);
      setCandidates([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchCandidates();
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery, sortBy, sortOrder, filters, page]);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === candidates.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(candidates.map((c) => c.id));
    }
  };

  const handleBulkDeleteClick = () => {
    setShowBulkDeleteConfirm(true);
  };

  const confirmBulkDelete = async () => {
    setIsDeleting(true);
    try {
      await candidatesApi.bulkDelete(selectedIds);
      toast.success(t('candidates.bulkDeleteSuccess'));
      setSelectedIds([]);
      fetchCandidates();
    } catch (error) {
      console.error('Bulk delete error', error);
      toast.error(t('candidates.bulkDeleteError'));
    } finally {
      setIsDeleting(false);
      setShowBulkDeleteConfirm(false);
    }
  };

  const handleSendEmail = async (subject: string, message: string) => {
    try {
      const response = await candidatesApi.sendBulkEmail({
        ids: selectedIds,
        subject,
        message,
      });
      const { count } = response.data.data;
      toast.success(t('candidates.bulkEmailSuccess', { count }));
      setSelectedIds([]);
    } catch (error) {
      console.error('Bulk email error', error);
      toast.error(t('candidates.bulkEmailError'));
    }
  };

  const handleExport = async () => {
    try {
      const response = await candidatesApi.export({
        search: searchQuery,
        sortBy,
        sortOrder,
        location: filters.location,
        skills: filters.skills
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `candidates-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed', error);
      toast.error(t('candidates.exportError'));
    }
  };

  const handleApplyView = (viewFilters: Record<string, any>) => {
    if (viewFilters.search !== undefined) setSearchQuery(viewFilters.search);
    if (viewFilters.sortBy) setSortBy(viewFilters.sortBy);
    if (viewFilters.sortOrder) setSortOrder(viewFilters.sortOrder);

    const newFilters: any = {};
    if (viewFilters.location) newFilters.location = viewFilters.location;
    if (viewFilters.skills) newFilters.skills = viewFilters.skills;
    if (viewFilters.status) newFilters.status = viewFilters.status;
    if (viewFilters.source) newFilters.source = viewFilters.source;
    setFilters(newFilters);
    setPage(1); // Reset to first page on filter change
  };

  const handleResetView = () => {
    setSearchQuery('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setFilters({});
    setPage(1);
  };

  return (
    <div className="space-y-6 relative">
      {/* Bulk Actions Toolbar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-2xl rounded-2xl px-5 py-3 flex items-center gap-4 animate-in slide-in-from-bottom-4">
          <span className="text-sm font-medium text-neutral-900 dark:text-white">
            {selectedIds.length} {t('common.selected')}
          </span>
          <div className="h-5 w-px bg-neutral-200 dark:bg-neutral-700" />
          <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])} className="h-8 w-8 p-0 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800">
            <X size={16} />
          </Button>
          <Button variant="outline" size="sm" className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800" onClick={handleBulkDeleteClick}>
            <Trash2 size={14} />
            {t('common.delete')}
          </Button>
          <Button size="sm" className="gap-2" onClick={() => setIsEmailModalOpen(true)}>
            <Mail size={14} />
            {t('common.email')}
          </Button>
        </div>
      )}

      <BulkEmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        onSend={handleSendEmail}
        recipientCount={selectedIds.length}
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">{t('candidates.title')}</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{t('candidates.manageTalentPool')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleExport}
          >
            <Download size={16} />
            <span className="hidden sm:inline">{t('common.export')}</span>
          </Button>
          <Button
            className="gap-2"
            onClick={() => navigate(`/${tenantId}/candidates/new`)}
          >
            <Plus size={16} />
            <span className="hidden sm:inline">{t('candidates.addCandidate')}</span>
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
            <input
              type="text"
              placeholder={t('candidates.searchPlaceholder')}
              className="w-full h-10 pl-10 pr-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <SavedViews
              entity="CANDIDATE"
              currentFilters={{
                search: searchQuery,
                sortBy,
                sortOrder,
                ...filters
              }}
              onApplyView={handleApplyView}
              onReset={handleResetView}
            />
            <div className="relative">
              <select
                className="appearance-none h-10 pl-4 pr-10 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split('-');
                  setSortBy(newSortBy);
                  setSortOrder(newSortOrder as 'asc' | 'desc');
                }}
                value={`${sortBy}-${sortOrder}`}
              >
                <option value="createdAt-desc">{t('common.newest')}</option>
                <option value="createdAt-asc">{t('common.oldest')}</option>
                <option value="firstName-asc">{t('common.nameAsc')}</option>
                <option value="firstName-desc">{t('common.nameDesc')}</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            </div>
            <Button
              variant={Object.keys(filters).length > 0 ? 'default' : 'outline'}
              className={`gap-2 ${Object.keys(filters).length > 0 ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border-primary-200 dark:border-primary-800 hover:bg-primary-100' : ''}`}
              onClick={() => setIsFilterOpen(true)}
            >
              <Filter size={16} />
              {t('common.filter')}
              {Object.keys(filters).length > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <CandidateFilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={(newFilters) => {
          setFilters(prev => ({ ...prev, ...newFilters }));
          setPage(1);
        }}
        initialFilters={filters}
      />

      {/* Candidates grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-neutral-500">{t('common.loading')}</span>
          </div>
        </div>
      ) : candidates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-14 h-14 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            <Search size={24} className="text-neutral-400" />
          </div>
          <p className="text-neutral-600 dark:text-neutral-400 font-medium">{t('candidates.noCandidatesFound')}</p>
          <p className="text-sm text-neutral-500">Try adjusting your search or filters</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 mb-4 p-3 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg border border-neutral-200 dark:border-neutral-800">
            <input
              type="checkbox"
              checked={selectedIds.length === candidates.length && candidates.length > 0}
              onChange={toggleAll}
              className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-neutral-800 dark:bg-neutral-700 dark:border-neutral-600"
            />
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              {t('common.selectAll')} ({candidates.length})
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {candidates.map((candidate) => (
              <div
                key={candidate.id}
                className={`bg-white dark:bg-neutral-900 border rounded-xl p-5 hover:shadow-md transition-all cursor-pointer relative group ${selectedIds.includes(candidate.id)
                  ? 'border-primary-500 dark:border-primary-500 ring-2 ring-primary-500/20'
                  : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                  }`}
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest('input[type="checkbox"]')) return;
                  navigate(`/${tenantId}/candidates/${candidate.id}`);
                }}
              >
                <div className="absolute top-4 right-4 z-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(candidate.id)}
                    onChange={() => toggleSelection(candidate.id)}
                    className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-neutral-800 dark:bg-neutral-700 dark:border-neutral-600"
                  />
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                    {(candidate.firstName?.[0] || '')}{(candidate.lastName?.[0] || '')}
                  </div>
                  <div className="flex-1 min-w-0 pr-6">
                    <h3 className="text-neutral-900 dark:text-white font-semibold truncate text-sm">
                      {candidate.firstName} {candidate.lastName}
                    </h3>
                    {candidate.candidateId && (
                      <span className="inline-flex text-[10px] font-mono text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded mt-1">
                        {candidate.candidateId}
                      </span>
                    )}
                    <p className="text-neutral-600 dark:text-neutral-400 text-sm mt-1">{candidate.currentTitle || t('candidates.noTitle')}</p>
                    <p className="text-neutral-400 text-xs">{candidate.currentCompany || t('candidates.noCompany')}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 text-xs">
                    <Mail size={12} />
                    <span className="truncate">{candidate.email}</span>
                  </div>
                  {candidate.phone && (
                    <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 text-xs">
                      <Phone size={12} />
                      <span>{candidate.phone}</span>
                    </div>
                  )}
                </div>

                {candidate.skills && candidate.skills.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {candidate.skills.slice(0, 3).map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-[11px] font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                    {candidate.skills.length > 3 && (
                      <span className="px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 text-[11px]">
                        +{candidate.skills.length - 3}
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                  <span className="text-xs text-neutral-400">
                    {candidate._count?.applications || 0} {t('candidates.applicationsCount')}
                  </span>
                  <span className="text-xs font-medium text-primary-600 dark:text-primary-400 group-hover:underline">
                    {t('candidates.viewProfile')} →
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-neutral-200 dark:border-neutral-800">
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              Showing {((page - 1) * LIMIT) + 1} to {Math.min(page * LIMIT, totalCount)} of {totalCount} candidates
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                {t('common.previous')}
              </Button>
              <span className="px-3 py-1 text-sm text-neutral-600 dark:text-neutral-400">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                {t('common.next')}
              </Button>
            </div>
          </div>
        </>
      )}

      <ConfirmationModal
        isOpen={showBulkDeleteConfirm}
        onCancel={() => setShowBulkDeleteConfirm(false)}
        onConfirm={confirmBulkDelete}
        title={t('candidates.bulkDeleteTitle')}
        message={t('candidates.bulkDeleteConfirm')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  );
}
