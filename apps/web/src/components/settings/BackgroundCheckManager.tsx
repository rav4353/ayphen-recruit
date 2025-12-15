'use client';

import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Settings,
  User,
  ExternalLink,
  Search,
} from 'lucide-react';
import { bgvApi } from '../../lib/api';

type BGVStatus = 'PENDING' | 'INITIATED' | 'IN_PROGRESS' | 'COMPLETED' | 'CLEAR' | 'CONSIDER' | 'FAILED' | 'CANCELLED';

interface BGVCheck {
  id: string;
  provider: string;
  status: BGVStatus;
  packageType: string;
  checkTypes: string[];
  externalId?: string;
  reportUrl?: string;
  result?: any;
  initiatedAt: string;
  completedAt?: string;
  candidate: {
    firstName: string;
    lastName: string;
    email: string;
  };
  application?: {
    job: {
      title: string;
    };
  };
  initiatedBy?: {
    firstName: string;
    lastName: string;
  };
}

interface BGVSettings {
  id?: string;
  provider?: string;
  isConfigured?: boolean;
  sandboxMode?: boolean;
}

interface BGVDashboard {
  total: number;
  pending: number;
  inProgress: number;
  clear: number;
  consider: number;
  clearRate: number;
}

const statusConfig: Record<BGVStatus, { icon: typeof CheckCircle; color: string; label: string }> = {
  PENDING: { icon: Clock, color: 'text-gray-500', label: 'Pending' },
  INITIATED: { icon: Clock, color: 'text-blue-500', label: 'Initiated' },
  IN_PROGRESS: { icon: RefreshCw, color: 'text-yellow-500', label: 'In Progress' },
  COMPLETED: { icon: CheckCircle, color: 'text-green-500', label: 'Completed' },
  CLEAR: { icon: CheckCircle, color: 'text-green-600', label: 'Clear' },
  CONSIDER: { icon: AlertTriangle, color: 'text-orange-500', label: 'Consider' },
  FAILED: { icon: XCircle, color: 'text-red-500', label: 'Failed' },
  CANCELLED: { icon: XCircle, color: 'text-gray-400', label: 'Cancelled' },
};

export function BackgroundCheckManager() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('view') as 'dashboard' | 'checks' | 'settings') || 'dashboard';

  const setActiveTab = (tab: 'dashboard' | 'checks' | 'settings') => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('view', tab);
      return newParams;
    });
  };
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Queries
  const { data: settings } = useQuery({
    queryKey: ['bgv-settings'],
    queryFn: async () => {
      const res = await bgvApi.getSettings();
      return res.data?.data as BGVSettings;
    },
  });

  const { data: dashboard } = useQuery({
    queryKey: ['bgv-dashboard'],
    queryFn: async () => {
      const res = await bgvApi.getDashboard();
      return res.data?.data as BGVDashboard;
    },
  });

  const { data: checks, isLoading: checksLoading } = useQuery({
    queryKey: ['bgv-checks', statusFilter],
    queryFn: async () => {
      const res = await bgvApi.getChecks({ status: statusFilter || undefined });
      return res.data?.data as BGVCheck[];
    },
  });

  const { data: packages } = useQuery({
    queryKey: ['bgv-packages'],
    queryFn: async () => {
      const res = await bgvApi.getPackages();
      return res.data?.data as { id: string; name: string; description?: string; checks?: string[] }[];
    },
  });

  // Mutations
  const syncMutation = useMutation({
    mutationFn: (checkId: string) => bgvApi.syncStatus(checkId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bgv-checks'] });
      queryClient.invalidateQueries({ queryKey: ['bgv-dashboard'] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (checkId: string) => bgvApi.cancel(checkId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bgv-checks'] });
      queryClient.invalidateQueries({ queryKey: ['bgv-dashboard'] });
    },
  });

  const filteredChecks = checks?.filter(check => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      check.candidate.firstName.toLowerCase().includes(query) ||
      check.candidate.lastName.toLowerCase().includes(query) ||
      check.candidate.email.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Background Checks</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Manage candidate background verification with Checkr
          </p>
        </div>
        <button
          onClick={() => setShowConfigModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700"
        >
          <Settings size={16} />
          Configure
        </button>
      </div>

      {/* Configuration Status */}
      {!settings?.isConfigured && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-yellow-600 dark:text-yellow-400" size={20} />
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                Background check provider not configured
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Configure Checkr API credentials to enable background verification.
              </p>
            </div>
            <button
              onClick={() => setShowConfigModal(true)}
              className="ml-auto px-3 py-1.5 text-sm font-medium text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900"
            >
              Configure Now
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-neutral-200 dark:border-neutral-700">
        {(['dashboard', 'checks', 'settings'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && dashboard && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Shield className="text-blue-600 dark:text-blue-400" size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white">{dashboard.total}</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Total Checks</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <Clock className="text-yellow-600 dark:text-yellow-400" size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                    {dashboard.pending + dashboard.inProgress}
                  </p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">In Progress</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <CheckCircle className="text-green-600 dark:text-green-400" size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white">{dashboard.clear}</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Clear</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <AlertTriangle className="text-orange-600 dark:text-orange-400" size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white">{dashboard.consider}</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Consider</p>
                </div>
              </div>
            </div>
          </div>

          {/* Clear Rate */}
          <div className="p-6 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg">
            <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-4">Clear Rate</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-4 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${dashboard.clearRate}%` }}
                />
              </div>
              <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                {dashboard.clearRate}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Checks Tab */}
      {activeTab === 'checks' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search candidates..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="INITIATED">Initiated</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="CLEAR">Clear</option>
              <option value="CONSIDER">Consider</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Checks List */}
          {checksLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="animate-spin text-neutral-400" size={24} />
            </div>
          ) : filteredChecks?.length === 0 ? (
            <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
              <Shield size={48} className="mx-auto mb-4 opacity-50" />
              <p>No background checks found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredChecks?.map(check => {
                const StatusIcon = statusConfig[check.status].icon;
                return (
                  <div
                    key={check.id}
                    className="p-4 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-neutral-100 dark:bg-neutral-700 rounded-full">
                          <User className="text-neutral-600 dark:text-neutral-400" size={20} />
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900 dark:text-white">
                            {check.candidate.firstName} {check.candidate.lastName}
                          </p>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            {check.candidate.email}
                          </p>
                          {check.application && (
                            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                              Applied for: {check.application.job.title}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className={`flex items-center gap-1.5 ${statusConfig[check.status].color}`}>
                            <StatusIcon size={16} />
                            <span className="text-sm font-medium">{statusConfig[check.status].label}</span>
                          </div>
                          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                            {check.packageType}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {check.reportUrl && (
                            <a
                              href={check.reportUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-neutral-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                              title="View Report"
                            >
                              <ExternalLink size={16} />
                            </a>
                          )}
                          {['INITIATED', 'IN_PROGRESS'].includes(check.status) && (
                            <button
                              onClick={() => syncMutation.mutate(check.id)}
                              disabled={syncMutation.isPending}
                              className="p-2 text-neutral-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg disabled:opacity-50"
                              title="Sync Status"
                            >
                              <RefreshCw size={16} className={syncMutation.isPending ? 'animate-spin' : ''} />
                            </button>
                          )}
                          {['PENDING', 'INITIATED'].includes(check.status) && (
                            <button
                              onClick={() => cancelMutation.mutate(check.id)}
                              disabled={cancelMutation.isPending}
                              className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-50"
                              title="Cancel"
                            >
                              <XCircle size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Provider Info */}
          <div className="p-6 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg">
            <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-4">Provider Configuration</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-neutral-100 dark:border-neutral-700">
                <span className="text-neutral-600 dark:text-neutral-400">Provider</span>
                <span className="font-medium text-neutral-900 dark:text-white">
                  {settings?.provider || 'Not configured'}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-neutral-100 dark:border-neutral-700">
                <span className="text-neutral-600 dark:text-neutral-400">Status</span>
                <span className={`font-medium ${settings?.isConfigured ? 'text-green-600' : 'text-red-600'}`}>
                  {settings?.isConfigured ? 'Connected' : 'Not Connected'}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-neutral-600 dark:text-neutral-400">Environment</span>
                <span className="font-medium text-neutral-900 dark:text-white">
                  {settings?.sandboxMode ? 'Sandbox' : 'Production'}
                </span>
              </div>
            </div>
          </div>

          {/* Available Packages */}
          <div className="p-6 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg">
            <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-4">Available Packages</h3>
            <div className="space-y-3">
              {packages?.map(pkg => (
                <div
                  key={pkg.id}
                  className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-neutral-900 dark:text-white">{pkg.name}</p>
                      {pkg.description && (
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">{pkg.description}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {pkg.checks?.map(check => (
                        <span
                          key={check}
                          className="px-2 py-0.5 text-xs bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 rounded"
                        >
                          {check}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Configuration Modal */}
      {showConfigModal && (
        <ConfigurationModal onClose={() => setShowConfigModal(false)} />
      )}
    </div>
  );
}

function ConfigurationModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [provider, setProvider] = useState<'CHECKR' | 'MANUAL'>('CHECKR');
  const [apiKey, setApiKey] = useState('');
  const [sandboxMode, setSandboxMode] = useState(true);

  const configureMutation = useMutation({
    mutationFn: () => bgvApi.configure({ provider, apiKey, sandboxMode }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bgv-settings'] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md bg-white dark:bg-neutral-800 rounded-xl shadow-xl">
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Configure Background Check Provider</h3>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Provider
            </label>
            <select
              value={provider}
              onChange={e => setProvider(e.target.value as 'CHECKR' | 'MANUAL')}
              className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
            >
              <option value="CHECKR">Checkr</option>
              <option value="MANUAL">Manual</option>
            </select>
          </div>

          {provider === 'CHECKR' && (
            <>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="Enter your Checkr API key"
                  className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
                />
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Get your API key from the{' '}
                  <a href="https://dashboard.checkr.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    Checkr Dashboard
                  </a>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="sandboxMode"
                  checked={sandboxMode}
                  onChange={e => setSandboxMode(e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="sandboxMode" className="text-sm text-neutral-700 dark:text-neutral-300">
                  Use Sandbox Mode (for testing)
                </label>
              </div>
            </>
          )}
        </div>

        <div className="p-6 border-t border-neutral-200 dark:border-neutral-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={() => configureMutation.mutate()}
            disabled={provider === 'CHECKR' && !apiKey}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
          >
            {configureMutation.isPending ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
}
