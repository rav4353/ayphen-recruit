'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  History,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  User,
  RefreshCw,
  Clock,
  Activity,
  Eye,
  X,
} from 'lucide-react';
import { auditLogApi } from '../../lib/api';

interface AuditLog {
  id: string;
  action: string;
  description?: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  user?: {
    email: string;
    firstName: string;
    lastName: string;
  };
  applicationId?: string;
  candidateId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

const DATE_PRESETS = [
  { label: 'Today', value: 'today' },
  { label: '7 days', value: 'week' },
  { label: '30 days', value: 'month' },
  { label: '90 days', value: 'quarter' },
];

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function getDateRange(preset: string): { startDate?: string; endDate?: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case 'today':
      return { startDate: today.toISOString(), endDate: now.toISOString() };
    case 'week': {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return { startDate: weekAgo.toISOString(), endDate: now.toISOString() };
    }
    case 'month': {
      const monthAgo = new Date(today);
      monthAgo.setDate(monthAgo.getDate() - 30);
      return { startDate: monthAgo.toISOString(), endDate: now.toISOString() };
    }
    case 'quarter': {
      const quarterAgo = new Date(today);
      quarterAgo.setDate(quarterAgo.getDate() - 90);
      return { startDate: quarterAgo.toISOString(), endDate: now.toISOString() };
    }
    default:
      return {};
  }
}

function getActionBadgeClass(action: string): string {
  const upper = action?.toUpperCase() || '';
  if (upper.includes('CREATE') || upper.includes('ADD')) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800';
  }
  if (upper.includes('UPDATE') || upper.includes('EDIT') || upper.includes('CHANGE')) {
    return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
  }
  if (upper.includes('DELETE') || upper.includes('REMOVE')) {
    return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
  }
  if (upper.includes('LOGIN') || upper.includes('AUTH')) {
    return 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-800';
  }
  return 'bg-neutral-50 text-neutral-700 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700';
}

export function AuditLogViewer() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [datePreset, setDatePreset] = useState<string>('month');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Fetch logs with error handling
  const { data: logsResponse, isLoading, isError, refetch } = useQuery({
    queryKey: ['audit-logs', page, datePreset, searchQuery],
    queryFn: async () => {
      const dateRange = getDateRange(datePreset);
      const response = await auditLogApi.getLogs({
        ...dateRange,
        search: searchQuery || undefined,
        page,
        limit: 20,
      });
      return response.data;
    },
  });

  // Extract data safely (supports both plain and ApiResponse-wrapped payloads)
  const payload: any = (logsResponse as any)?.data ?? logsResponse;
  const pagePayload: any = payload?.data ?? payload;

  const logs: AuditLog[] = Array.isArray(pagePayload)
    ? pagePayload
    : Array.isArray(pagePayload?.data)
      ? pagePayload.data
      : Array.isArray(payload?.logs)
        ? payload.logs
        : [];

  const total =
    typeof pagePayload?.total === 'number'
      ? pagePayload.total
      : typeof payload?.total === 'number'
        ? payload.total
        : 0;

  const totalPages =
    typeof pagePayload?.totalPages === 'number'
      ? pagePayload.totalPages
      : typeof payload?.totalPages === 'number'
        ? payload.totalPages
        : Math.max(1, Math.ceil(total / 20));

  const handleExport = async () => {
    try {
      const dateRange = getDateRange(datePreset);
      const response = await auditLogApi.exportLogs(dateRange);
      const blob = new Blob([response.data as BlobPart], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const getUserName = (log: AuditLog): string => {
    if (log.userName) return log.userName;
    if (log.user) {
      return `${log.user.firstName || ''} ${log.user.lastName || ''}`.trim() || log.user.email;
    }
    return 'System';
  };

  const getUserEmail = (log: AuditLog): string | undefined => {
    return log.userEmail || log.user?.email;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
            <History className="h-5 w-5 text-blue-600" />
            Audit Logs
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Track all activity and changes in your system
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Date Presets */}
          <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
            {DATE_PRESETS.map(preset => (
              <button
                key={preset.value}
                onClick={() => {
                  setDatePreset(preset.value);
                  setPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  datePreset === preset.value
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
          {total > 0 ? (
            <>Showing {((page - 1) * 20) + 1} - {Math.min(page * 20, total)} of {total} results</>
          ) : (
            <>No results</>
          )}
        </div>
      </div>

      {/* Logs List */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="mt-3 text-sm text-neutral-500">Loading audit logs...</p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
              <X className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="font-medium text-neutral-900 dark:text-white mb-1">Failed to load logs</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
              There was an error loading the audit logs
            </p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              Try again
            </button>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
              <History className="h-6 w-6 text-neutral-400" />
            </div>
            <h3 className="font-medium text-neutral-900 dark:text-white mb-1">No audit logs found</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Try adjusting your filters or date range
            </p>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              <div className="col-span-3">Timestamp</div>
              <div className="col-span-2">Action</div>
              <div className="col-span-3">User</div>
              <div className="col-span-3">Description</div>
              <div className="col-span-1 text-right">Details</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {logs.map(log => (
                <div
                  key={log.id}
                  className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors items-center"
                >
                  <div className="col-span-3 flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
                    <Clock className="h-4 w-4 text-neutral-400 flex-shrink-0" />
                    <span className="truncate">{formatDate(log.createdAt)}</span>
                  </div>
                  <div className="col-span-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-md border ${getActionBadgeClass(log.action)}`}>
                      {log.action?.replace(/_/g, ' ') || 'Unknown'}
                    </span>
                  </div>
                  <div className="col-span-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center flex-shrink-0">
                        <User className="h-3.5 w-3.5 text-neutral-500 dark:text-neutral-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                          {getUserName(log)}
                        </p>
                        {getUserEmail(log) && (
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                            {getUserEmail(log)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="col-span-3">
                    <p className="text-sm text-neutral-600 dark:text-neutral-300 truncate">
                      {log.description || '-'}
                    </p>
                  </div>
                  <div className="col-span-1 text-right">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="p-1.5 text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="View details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200 dark:border-neutral-700">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                <span className="text-sm text-neutral-500 dark:text-neutral-400">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedLog(null)}
          />
          <div className="relative w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Activity Details
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Action</p>
                  <p className="font-medium text-neutral-900 dark:text-white">{selectedLog.action?.replace(/_/g, ' ')}</p>
                </div>
                <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Timestamp</p>
                  <p className="font-medium text-neutral-900 dark:text-white">{formatDate(selectedLog.createdAt)}</p>
                </div>
              </div>

              <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">User</p>
                <p className="font-medium text-neutral-900 dark:text-white">{getUserName(selectedLog)}</p>
                {getUserEmail(selectedLog) && (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">{getUserEmail(selectedLog)}</p>
                )}
              </div>

              {selectedLog.description && (
                <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Description</p>
                  <p className="text-neutral-900 dark:text-white">{selectedLog.description}</p>
                </div>
              )}

              {(selectedLog.applicationId || selectedLog.candidateId) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedLog.applicationId && (
                    <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3">
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Application ID</p>
                      <p className="font-mono text-sm text-neutral-900 dark:text-white truncate">{selectedLog.applicationId}</p>
                    </div>
                  )}
                  {selectedLog.candidateId && (
                    <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3">
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Candidate ID</p>
                      <p className="font-mono text-sm text-neutral-900 dark:text-white truncate">{selectedLog.candidateId}</p>
                    </div>
                  )}
                </div>
              )}

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">Metadata</p>
                  <pre className="p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-neutral-700 dark:text-neutral-300 overflow-auto max-h-40">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
