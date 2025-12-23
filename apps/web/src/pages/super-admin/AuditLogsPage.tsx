import { useState, useEffect } from 'react';
import {
  Search,
  ChevronDown,
  RefreshCw,
  Download,
  Calendar,
  User,
  Activity,
  Shield,
  AlertTriangle,
  CheckCircle,
  Info,
  Building2,
  Filter,
  Zap,
  Globe,
  Database,
  Terminal as TerminalIcon,
} from 'lucide-react';
import { superAdminAuditApi } from '../../lib/superAdminApi';
import { Button } from '../../components/ui';
import { ColumnSelector, ExportColumn } from '../../components/common';
import { convertToCSV, downloadCSV, CSV_TRANSFORMERS, CsvColumn } from '../../lib/csv-utils';
import toast from 'react-hot-toast';
import { cn } from '../../lib/utils';

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId?: string;
  userId?: string;
  userName?: string;
  tenantId?: string;
  tenantName?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

const ACTION_TYPES = [
  'LOGIN',
  'LOGOUT',
  'CREATE',
  'UPDATE',
  'DELETE',
  'SUSPEND',
  'ACTIVATE',
  'PASSWORD_CHANGE',
  'SETTINGS_UPDATE',
  'EXPORT',
];

const ENTITY_TYPES = [
  'USER',
  'TENANT',
  'JOB',
  'CANDIDATE',
  'APPLICATION',
  'SUBSCRIPTION',
  'SETTINGS',
];

export function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('');
  const [entityFilter, setEntityFilter] = useState<string>('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [showColumnSelector, setShowColumnSelector] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [searchQuery, actionFilter, entityFilter, dateRange, page]);

  useEffect(() => {
    console.log('Modal state changed:', showColumnSelector);
  }, [showColumnSelector]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const response = await superAdminAuditApi.getAll({
        page,
        action: actionFilter || undefined,
        entityType: entityFilter || undefined,
        startDate: dateRange.start || undefined,
        endDate: dateRange.end || undefined,
      });
      setLogs(response.data.data || []);
      setTotalPages(response.data.meta?.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch audit logs', error);
      toast.error('Failed to fetch audit logs');
    } finally {
      setIsLoading(false);
    }
  };

  // Define export columns
  const exportColumns: ExportColumn[] = [
    { key: 'id', label: 'Log ID', defaultSelected: false },
    { key: 'createdAt', label: 'Timestamp', defaultSelected: true },
    { key: 'action', label: 'Action', defaultSelected: true },
    { key: 'entityType', label: 'Entity Type', defaultSelected: true },
    { key: 'entityId', label: 'Entity ID', defaultSelected: false },
    { key: 'userName', label: 'User Name', defaultSelected: true },
    { key: 'userId', label: 'User ID', defaultSelected: false },
    { key: 'tenantName', label: 'Tenant Name', defaultSelected: true },
    { key: 'tenantId', label: 'Tenant ID', defaultSelected: false },
    { key: 'ipAddress', label: 'IP Address', defaultSelected: true },
    { key: 'userAgent', label: 'User Agent', defaultSelected: false },
    { key: 'details', label: 'Details (JSON)', defaultSelected: false },
  ];

  // Define CSV column transformations
  const csvColumns: CsvColumn[] = [
    { key: 'id', header: 'Log ID' },
    {
      key: 'createdAt',
      header: 'Timestamp',
      transform: CSV_TRANSFORMERS.datetime,
    },
    { key: 'action', header: 'Action' },
    { key: 'entityType', header: 'Entity Type' },
    { key: 'entityId', header: 'Entity ID' },
    { key: 'userName', header: 'User Name' },
    { key: 'userId', header: 'User ID' },
    { key: 'tenantName', header: 'Tenant Name' },
    { key: 'tenantId', header: 'Tenant ID' },
    { key: 'ipAddress', header: 'IP Address' },
    { key: 'userAgent', header: 'User Agent' },
    {
      key: 'details',
      header: 'Details',
      transform: CSV_TRANSFORMERS.json,
    },
  ];

  const handleExportWithColumns = (selectedColumns: string[]) => {
    console.log('Export called with columns:', selectedColumns);
    console.log('Logs data:', logs);

    if (!logs || logs.length === 0) {
      toast.error('No audit logs to export');
      return;
    }

    const csvContent = convertToCSV(logs, csvColumns, selectedColumns);
    downloadCSV(csvContent, `audit-logs_${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Audit logs exported successfully');
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'LOGIN':
      case 'LOGOUT':
        return <User size={14} />;
      case 'CREATE':
        return <CheckCircle size={14} />;
      case 'UPDATE':
        return <Activity size={14} />;
      case 'DELETE':
        return <AlertTriangle size={14} />;
      case 'SUSPEND':
        return <Shield size={14} />;
      case 'ACTIVATE':
        return <CheckCircle size={14} />;
      default:
        return <Info size={14} />;
    }
  };

  const getActionBadge = (action: string) => {
    const styles: Record<string, string> = {
      LOGIN: 'bg-blue-500/10 text-blue-600 dark:text-blue-500 border-blue-500/20',
      LOGOUT: 'bg-blue-500/10 text-blue-600 dark:text-blue-500 border-blue-500/20',
      CREATE: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-500/20',
      UPDATE: 'bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-500/20',
      DELETE: 'bg-red-500/10 text-red-600 dark:text-red-500 border-red-500/20',
      SUSPEND: 'bg-orange-500/10 text-orange-600 dark:text-orange-500 border-orange-500/20',
      ACTIVATE: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-500/20',
      PASSWORD_CHANGE: 'bg-purple-500/10 text-purple-600 dark:text-purple-500 border-purple-500/20',
      SETTINGS_UPDATE: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-500 border-cyan-500/20',
      EXPORT: 'bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-500/20',
    };
    return styles[action] || 'bg-neutral-500/10 text-neutral-500 border-neutral-500/20';
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return then.toLocaleDateString();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight uppercase">Immutable Audit Trail</h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1 font-medium transition-colors">
            Cryptographic system activity verification and historical telemetry
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 h-11 px-5 rounded-xl font-bold transition-all active:scale-95"
            onClick={() => {
              console.log('Archive Dump clicked, opening modal');
              setShowColumnSelector(true);
            }}
          >
            <Download size={18} className="mr-2 text-blue-500" />
            Archive Dump
          </Button>
          <Button
            variant="outline"
            className="border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 h-11 px-4 rounded-xl transition-all active:scale-95"
            onClick={fetchLogs}
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      {/* Quick Stats Block */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Event Broadcasts (24h)', value: logs.filter(l => new Date(l.createdAt).toDateString() === new Date().toDateString()).length, icon: Activity, color: 'blue' },
          { label: 'Auth Handshakes', value: logs.filter(l => l.action === 'LOGIN').length, icon: User, color: 'emerald' },
          { label: 'Hard Deletions', value: logs.filter(l => l.action === 'DELETE').length, icon: AlertTriangle, color: 'red' },
          { label: 'Trust Violations', value: logs.filter(l => l.action === 'SUSPEND').length, icon: Shield, color: 'orange' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
            <div className={cn("absolute -right-4 -top-4 w-24 h-24 blur-3xl opacity-5 transition-opacity group-hover:opacity-10", `bg-${stat.color}-500`)} />
            <div className="flex items-center gap-4 relative z-10">
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shadow-inner transition-transform group-hover:scale-110", `bg-${stat.color === 'emerald' ? 'emerald' : stat.color}-500/10 text-${stat.color === 'emerald' ? 'emerald' : stat.color}-600 dark:text-${stat.color === 'emerald' ? 'emerald' : stat.color}-400`)}>
                <stat.icon size={22} />
              </div>
              <div>
                <p className="text-2xl font-black text-neutral-900 dark:text-white leading-none tabular-nums">{stat.value}</p>
                <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mt-2">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Terminal Filter Interface */}
      <div className="space-y-4 bg-white dark:bg-neutral-900 p-6 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-800 shadow-sm transition-all">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
            <input
              type="text"
              placeholder="Filter by user signature, entity ID, or telemetry details..."
              className="w-full h-14 pl-12 pr-6 bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 rounded-2xl text-base text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none focus:ring-4 focus:ring-red-500/5 focus:border-red-500 transition-all font-medium shadow-inner"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[160px]">
              <select
                className="appearance-none w-full h-14 pl-5 pr-12 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl text-xs font-black uppercase tracking-widest text-neutral-900 dark:text-neutral-300 focus:ring-4 focus:ring-red-500/5 transition-all outline-none cursor-pointer"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
              >
                <option value="">Channel: ALL</option>
                {ACTION_TYPES.map(action => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            </div>
            <div className="relative min-w-[160px]">
              <select
                className="appearance-none w-full h-14 pl-5 pr-12 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl text-xs font-black uppercase tracking-widest text-neutral-900 dark:text-neutral-300 focus:ring-4 focus:ring-red-500/5 transition-all outline-none cursor-pointer"
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
              >
                <option value="">Entity: ALL</option>
                {ENTITY_TYPES.map(entity => (
                  <option key={entity} value={entity}>{entity}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            </div>
            <Button
              variant="outline"
              className={cn(
                "h-14 w-14 rounded-2xl border-neutral-200 dark:border-neutral-700 transition-all active:scale-95",
                showFilters ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900" : "text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800"
              )}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={20} />
            </Button>
          </div>
        </div>

        {/* Temporal Matrix Expansion */}
        {showFilters && (
          <div className="flex flex-wrap items-center gap-6 p-6 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800/50 rounded-3xl animate-slide-in shadow-inner">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-neutral-500">
                <Calendar size={16} />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Temporal Window:</span>
                <input
                  type="date"
                  className="h-10 px-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-bold text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-red-500/20"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                />
                <span className="text-neutral-400 text-xs font-black">→</span>
                <input
                  type="date"
                  className="h-10 px-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-bold text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-red-500/20"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                />
              </div>
            </div>
            <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-700 mx-2" />
            <Button
              variant="ghost"
              size="sm"
              className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/5 rounded-lg px-4"
              onClick={() => setDateRange({ start: '', end: '' })}
            >
              Clear Time Slice
            </Button>
          </div>
        )}
      </div>

      {/* Main Terminal Feed */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[2.5rem] overflow-hidden shadow-sm transition-all group/feed">
        <div className="px-8 py-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-900 dark:bg-white flex items-center justify-center text-white dark:text-neutral-900 shadow-lg">
              <TerminalIcon size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-neutral-900 dark:text-white uppercase tracking-tighter tabular-nums">Broadcast Stream</h2>
              <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Historical Telemetry Logs</p>
            </div>
          </div>
          {isLoading && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/5 border border-red-500/10">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">Streaming...</span>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="bg-neutral-50/50 dark:bg-neutral-800/10 border-b border-neutral-100 dark:border-neutral-800">
                <th className="text-left text-[10px] font-black uppercase tracking-widest text-neutral-500 px-8 py-5">Absolute Time</th>
                <th className="text-left text-[10px] font-black uppercase tracking-widest text-neutral-500 px-8 py-5">Protocol / Action</th>
                <th className="text-left text-[10px] font-black uppercase tracking-widest text-neutral-500 px-8 py-5">Vector Entity</th>
                <th className="text-left text-[10px] font-black uppercase tracking-widest text-neutral-500 px-8 py-5">Subject Identity</th>
                <th className="text-left text-[10px] font-black uppercase tracking-widest text-neutral-500 px-8 py-5">Cluster Node</th>
                <th className="text-left text-[10px] font-black uppercase tracking-widest text-neutral-500 px-8 py-5">Payload Preview</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800">
              {isLoading && logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs font-black text-neutral-400 uppercase tracking-widest">Reconstructing historical artifacts...</p>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center gap-4 max-w-xs mx-auto">
                      <div className="w-20 h-20 rounded-[2rem] bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center text-neutral-300">
                        <Database size={40} />
                      </div>
                      <p className="text-lg font-black text-neutral-900 dark:text-white uppercase tracking-tight">Zero Artifacts Detected</p>
                      <p className="text-xs text-neutral-500 font-medium leading-relaxed">No audit logs matched the current search vectors. Verify your temporal and channel filters.</p>
                      <Button variant="ghost" className="mt-4 font-black text-[10px] uppercase tracking-widest text-red-500" onClick={() => { setSearchQuery(''); setActionFilter(''); setEntityFilter(''); }}>
                        Reset Signal
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/10 transition-colors group/row">
                    <td className="px-8 py-6">
                      <div>
                        <p className="text-xs font-black text-neutral-900 dark:text-white tabular-nums uppercase">{formatTimeAgo(log.createdAt)}</p>
                        <p className="text-[10px] font-mono font-bold text-neutral-400 mt-1">
                          {new Date(log.createdAt).toLocaleTimeString([], { hour12: false })}.{(new Date(log.createdAt).getMilliseconds()).toString().padStart(3, '0')}
                        </p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all group-hover/row:scale-105 shadow-sm border", getActionBadge(log.action))}>
                        {getActionIcon(log.action)}
                        {log.action}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 border border-neutral-200 dark:border-neutral-700">
                          <Zap size={14} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-neutral-900 dark:text-white uppercase tracking-tight">{log.entityType}</p>
                          {log.entityId && (
                            <p className="text-[9px] font-mono text-neutral-400 font-bold tracking-tighter uppercase mt-0.5">{log.entityId.slice(0, 16)}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-800 flex items-center justify-center text-xs font-black text-neutral-600 dark:text-neutral-400 border border-neutral-300 dark:border-neutral-600">
                          {log.userName?.[0] || 'S'}
                        </div>
                        <div>
                          <p className="text-xs font-black text-neutral-900 dark:text-white uppercase tracking-tight tabular-nums">{log.userName || 'Root Node'}</p>
                          {log.ipAddress && (
                            <p className="text-[9px] font-mono text-neutral-400 font-bold uppercase flex items-center gap-1 mt-0.5">
                              <Globe size={10} />
                              {log.ipAddress}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {log.tenantName ? (
                        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 w-fit transition-all group-hover/row:border-neutral-400">
                          <Building2 size={12} className="text-neutral-400" />
                          <span className="text-[10px] font-black text-neutral-600 dark:text-neutral-400 uppercase tracking-widest">{log.tenantName}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-black text-neutral-300 dark:text-neutral-700 uppercase tracking-widest">Global Vector</span>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      {log.details ? (
                        <div className="max-w-[200px] overflow-hidden">
                          <code className="text-[9px] font-mono font-bold text-neutral-500 bg-neutral-50 dark:bg-neutral-800 px-2 py-1 rounded-lg border border-neutral-100 dark:border-neutral-700 block truncate hover:text-red-500 transition-colors cursor-pointer">
                            {JSON.stringify(log.details)}
                          </code>
                        </div>
                      ) : (
                        <span className="text-xs text-neutral-300 dark:text-neutral-600">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Global Pagination Terminal */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-8 py-6 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/30">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
              <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                Cursor: Sector {page} of {totalPages}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-4 sm:mt-0">
              <Button
                variant="outline"
                size="sm"
                className="h-10 px-6 rounded-xl border-neutral-200 dark:border-neutral-700 font-black uppercase text-[10px] tracking-widest hover:bg-neutral-900 hover:text-white dark:hover:bg-white dark:hover:text-black transition-all active:scale-95 disabled:opacity-30"
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Previous Step
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-10 px-6 rounded-xl border-neutral-200 dark:border-neutral-700 font-black uppercase text-[10px] tracking-widest hover:bg-neutral-900 hover:text-white dark:hover:bg-white dark:hover:text-black transition-all active:scale-95 disabled:opacity-30"
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                Next Step
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
        title="Select Audit Log Fields to Export"
        description="Choose which audit trail details you want in your CSV archive"
        exportButtonText="Download Archive"
      />
    </div>
  );
}
