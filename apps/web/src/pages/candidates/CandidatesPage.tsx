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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-xl rounded-full px-6 py-3 flex items-center gap-4 animate-in slide-in-from-bottom-4">
          <span className="text-sm font-medium text-neutral-900 dark:text-white">
            {selectedIds.length} {t('common.selected')}
          </span>
          <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-700" />
          <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])} className="h-8 w-8 p-0 rounded-full">
            <X size={16} />
          </Button>
          <Button variant="secondary" size="sm" className="gap-2 text-red-600 hover:text-red-700" onClick={handleBulkDeleteClick}>
            <Trash2 size={16} />
            {t('common.delete')}
          </Button>
          <Button variant="primary" size="sm" className="gap-2" onClick={() => setIsEmailModalOpen(true)}>
            <Mail size={16} />
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

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t('candidates.title')}</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">{t('candidates.manageTalentPool')}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="flex items-center gap-2"
            onClick={handleExport}
          >
            <Download size={18} />
            {t('common.export')}
          </Button>
          <Button
            variant="primary"
            className="flex items-center gap-2"
            onClick={() => navigate(`/${tenantId}/candidates/new`)}
          >
            <Plus size={18} />
            {t('candidates.addCandidate')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
          <input
            type="text"
            placeholder={t('candidates.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
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
              className="appearance-none pl-4 pr-10 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none cursor-pointer"
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
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
          </div>
          <button
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium border transition-colors ${Object.keys(filters).length > 0
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 border-neutral-200 dark:border-neutral-700'
              }`}
            onClick={() => setIsFilterOpen(true)}
          >
            <Filter size={18} />
            {t('common.filter')}
            {Object.keys(filters).length > 0 && (
              <span className="ml-1 w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
            )}
          </button>
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
        <div className="text-center py-12 text-neutral-500">{t('common.loading')}</div>
      ) : candidates.length === 0 ? (
        <div className="text-center py-12 text-neutral-500">{t('candidates.noCandidatesFound')}</div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              checked={selectedIds.length === candidates.length && candidates.length > 0}
              onChange={toggleAll}
              className="w-4 h-4 text-blue-600 border-neutral-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-neutral-800 dark:bg-neutral-700 dark:border-neutral-600"
            />
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              {t('common.selectAll')}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {candidates.map((candidate) => (
              <div
                key={candidate.id}
                className={`bg-white dark:bg-neutral-900 border rounded-xl p-6 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors cursor-pointer relative group ${selectedIds.includes(candidate.id)
                  ? 'border-blue-500 dark:border-blue-500 ring-1 ring-blue-500'
                  : 'border-neutral-200 dark:border-neutral-800'
                  }`}
                onClick={(e) => {
                  // Don't navigate if clicking checkbox
                  if ((e.target as HTMLElement).closest('input[type="checkbox"]')) return;
                  navigate(`/${tenantId}/candidates/${candidate.id}`);
                }}
              >
                <div className="absolute top-4 right-4 z-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(candidate.id)}
                    onChange={() => toggleSelection(candidate.id)}
                    className="w-5 h-5 text-blue-600 border-neutral-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-neutral-800 dark:bg-neutral-700 dark:border-neutral-600"
                  />
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                    {(candidate.firstName?.[0] || '')}{(candidate.lastName?.[0] || '')}
                  </div>
                  <div className="flex-1 min-w-0 pr-8">
                    <h3 className="text-neutral-900 dark:text-white font-semibold truncate flex items-center gap-2">
                      {candidate.firstName} {candidate.lastName}
                      {candidate.candidateId && (
                        <span className="text-xs font-normal text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
                          {candidate.candidateId}
                        </span>
                      )}
                    </h3>
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm">{candidate.currentTitle || t('candidates.noTitle')}</p>
                    <p className="text-neutral-400 text-sm">{candidate.currentCompany || t('candidates.noCompany')}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 text-sm">
                    <Mail size={14} />
                    <span className="truncate">{candidate.email}</span>
                  </div>
                  {candidate.phone && (
                    <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 text-sm">
                      <Phone size={14} />
                      <span>{candidate.phone}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {candidate.skills?.slice(0, 3).map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs"
                    >
                      {skill}
                    </span>
                  ))}
                  {candidate.skills && candidate.skills.length > 3 && (
                    <span className="px-2 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs">
                      +{candidate.skills.length - 3}
                    </span>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                  <span className="text-neutral-400 text-sm">
                    {candidate._count?.applications || 0} {t('candidates.applicationsCount')}
                  </span>
                  <button className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:text-blue-700 dark:hover:text-blue-300">
                    {t('candidates.viewProfile')}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between border-t border-neutral-200 dark:border-neutral-700 pt-4">
            <div className="text-sm text-neutral-500 dark:text-neutral-400">
              {t('common.showing')} {((page - 1) * LIMIT) + 1} {t('common.to')} {Math.min(page * LIMIT, totalCount)} {t('common.of')} {totalCount} {t('common.results')}
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                {t('common.previous')}
              </Button>
              <Button
                variant="secondary"
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
