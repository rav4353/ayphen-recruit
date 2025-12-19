import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Search,
  Plus,
  MoreVertical,
  Eye,
  Pause,
  Play,
  Trash2,
  Users,
  Briefcase,
  ChevronDown,
  ExternalLink,
  RefreshCw,
  UserSquare2,
} from 'lucide-react';
import { superAdminTenantsApi } from '../../lib/superAdminApi';
import { Button, ConfirmationModal } from '../../components/ui';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../stores/auth';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  plan: string;
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  _count: {
    users: number;
    jobs: number;
  };
  subscription?: {
    plan: string;
    status: string;
    expiresAt: string;
  };
  createdAt: string;
}

export function TenantsPage() {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [planFilter, setPlanFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Action states
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchTenants();
  }, [searchQuery, statusFilter, planFilter, page]);

  const fetchTenants = async () => {
    setIsLoading(true);
    try {
      const response = await superAdminTenantsApi.getAll({
        page,
        search: searchQuery || undefined,
        status: statusFilter || undefined,
        plan: planFilter || undefined,
      });
      setTenants(response.data.data || []);
      setTotalPages(response.data.meta?.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch tenants', error);
      toast.error('Failed to fetch organizations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImpersonate = async (tenant: Tenant) => {
    if (!tenant.owner?.id) {
      toast.error('Organization has no owner to impersonate');
      return;
    }

    const loadingToast = toast.loading('Generating impersonation session...');
    try {
      const response = await superAdminTenantsApi.impersonate(tenant.id, tenant.owner.id);
      const { accessToken, refreshToken, user } = response.data.data;

      // Log into the main app store
      useAuthStore.getState().setAuth(user, accessToken, refreshToken);

      toast.success(`Now impersonating ${user.firstName} from ${tenant.name}`, { id: loadingToast });

      // Open the portal in a new tab
      window.open('/dashboard', '_blank');
    } catch (error) {
      toast.error('Failed to impersonate user', { id: loadingToast });
    }
  };

  const handleSuspend = async () => {
    if (!selectedTenant) return;
    setActionLoading(true);
    try {
      await superAdminTenantsApi.suspend(selectedTenant.id, 'Suspended by admin');
      toast.success(`${selectedTenant.name} has been suspended`);
      fetchTenants();
    } catch (error) {
      toast.error('Failed to suspend tenant');
    } finally {
      setActionLoading(false);
      setShowSuspendModal(false);
      setSelectedTenant(null);
    }
  };

  const handleActivate = async (tenant: Tenant) => {
    try {
      await superAdminTenantsApi.activate(tenant.id);
      toast.success(`${tenant.name} has been activated`);
      fetchTenants();
    } catch (error) {
      toast.error('Failed to activate tenant');
    }
  };

  const handleDelete = async () => {
    if (!selectedTenant) return;
    setActionLoading(true);
    try {
      await superAdminTenantsApi.delete(selectedTenant.id);
      toast.success(`${selectedTenant.name} has been deleted`);
      fetchTenants();
    } catch (error) {
      toast.error('Failed to delete tenant');
    } finally {
      setActionLoading(false);
      setShowDeleteModal(false);
      setSelectedTenant(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      ACTIVE: 'bg-green-500/10 text-green-600 dark:text-green-500 border-green-500/20',
      SUSPENDED: 'bg-red-500/10 text-red-600 dark:text-red-500 border-red-500/20',
      PENDING: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border-yellow-500/20',
    };
    return styles[status as keyof typeof styles] || 'bg-neutral-500/10 text-neutral-500';
  };

  const getPlanBadge = (plan: string) => {
    const styles = {
      STARTER: 'bg-blue-500/10 text-blue-600 dark:text-blue-500',
      PROFESSIONAL: 'bg-purple-500/10 text-purple-600 dark:text-purple-500',
      ENTERPRISE: 'bg-orange-500/10 text-orange-600 dark:text-orange-500',
    };
    return styles[plan as keyof typeof styles] || 'bg-neutral-500/10 text-neutral-500';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white transition-colors">Organizations</h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1 transition-colors">
            Manage all tenant organizations on the platform
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all font-medium"
            onClick={fetchTenants}
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </Button>
          <Button
            className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 shadow-md shadow-red-500/20 font-bold"
            onClick={() => navigate('/super-admin/tenants/new')}
          >
            <Plus size={16} className="mr-2" />
            Add Organization
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
          <input
            type="text"
            placeholder="Search organizations..."
            className="w-full h-11 pl-10 pr-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <select
              className="appearance-none h-11 pl-4 pr-10 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 cursor-pointer shadow-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="PENDING">Pending</option>
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              className="appearance-none h-11 pl-4 pr-10 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 cursor-pointer shadow-sm"
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
            >
              <option value="">All Plans</option>
              <option value="STARTER">Starter</option>
              <option value="PROFESSIONAL">Professional</option>
              <option value="ENTERPRISE">Enterprise</option>
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm transition-all animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30 transition-colors">
                <th className="text-left text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 px-6 py-4">Organization</th>
                <th className="text-left text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 px-6 py-4">Owner</th>
                <th className="text-left text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 px-6 py-4">Plan</th>
                <th className="text-left text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 px-6 py-4">Status</th>
                <th className="text-left text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 px-6 py-4">Usage</th>
                <th className="text-left text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 px-6 py-4">Created</th>
                <th className="px-6 py-4 w-12 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm text-neutral-500 font-medium">Loading organizations...</span>
                    </div>
                  </td>
                </tr>
              ) : tenants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                        <Building2 size={32} className="text-neutral-400" />
                      </div>
                      <p className="text-neutral-900 dark:text-white font-bold">No organizations found</p>
                      <p className="text-sm text-neutral-500">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                tenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/20 transition-all font-medium group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-blue-600 dark:text-purple-400 font-bold border border-blue-500/10">
                          {tenant.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-neutral-900 dark:text-white">{tenant.name}</p>
                          <p className="text-xs text-neutral-500 font-mono tracking-tight">{tenant.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {tenant.owner ? (
                        <>
                          <p className="text-sm text-neutral-800 dark:text-neutral-200">{tenant.owner.firstName} {tenant.owner.lastName}</p>
                          <p className="text-xs text-neutral-500">{tenant.owner.email}</p>
                        </>
                      ) : (
                        <p className="text-sm text-neutral-500 italic">No owner assigned</p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ring-1 ring-inset ${getPlanBadge(tenant.plan)} ring-current/20`}>
                        {tenant.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(tenant.status)} transition-colors`}>
                        {tenant.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-4 text-xs font-bold text-neutral-600 dark:text-neutral-400">
                        <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                          <Users size={14} />
                          {tenant._count.users}
                        </span>
                        <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                          <Briefcase size={14} />
                          {tenant._count.jobs}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs font-medium text-neutral-500 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(tenant.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="relative group/menu inline-block">
                        <button className="p-2 rounded-xl text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700">
                          <MoreVertical size={18} />
                        </button>
                        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10 py-2 animate-slide-in">
                          <button
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                            onClick={() => navigate(`/super-admin/tenants/${tenant.id}`)}
                          >
                            <Eye size={18} className="text-neutral-400" />
                            View Org Profile
                          </button>
                          <button
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 transition-colors"
                            onClick={() => handleImpersonate(tenant)}
                          >
                            <UserSquare2 size={18} />
                            Impersonate Owner
                          </button>
                          <a
                            href={`/${tenant.id}/dashboard`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                          >
                            <ExternalLink size={18} className="text-neutral-400" />
                            Visit Employee Portal
                          </a>
                          <div className="my-1 border-t border-neutral-100 dark:border-neutral-800" />
                          {tenant.status === 'ACTIVE' ? (
                            <button
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-amber-600 dark:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
                              onClick={() => {
                                setSelectedTenant(tenant);
                                setShowSuspendModal(true);
                              }}
                            >
                              <Pause size={18} />
                              Suspend Account
                            </button>
                          ) : (
                            <button
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-emerald-600 dark:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                              onClick={() => handleActivate(tenant)}
                            >
                              <Play size={18} />
                              Activate Account
                            </button>
                          )}
                          <button
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-extrabold text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                            onClick={() => {
                              setSelectedTenant(tenant);
                              setShowDeleteModal(true);
                            }}
                          >
                            <Trash2 size={18} />
                            Delete Permanent
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/30 dark:bg-transparent">
            <span className="text-sm font-bold text-neutral-500 uppercase tracking-tighter">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-neutral-200 dark:border-neutral-700 rounded-xl font-bold"
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-neutral-200 dark:border-neutral-700 rounded-xl font-bold"
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Suspend Modal */}
      <ConfirmationModal
        isOpen={showSuspendModal}
        onCancel={() => {
          setShowSuspendModal(false);
          setSelectedTenant(null);
        }}
        onConfirm={handleSuspend}
        title="Suspend Organization"
        message={`Are you sure you want to suspend "${selectedTenant?.name}"? All users will lose access until reactivated.`}
        confirmLabel="Suspend"
        cancelLabel="Cancel"
        isLoading={actionLoading}
        variant="danger"
      />

      {/* Delete Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onCancel={() => {
          setShowDeleteModal(false);
          setSelectedTenant(null);
        }}
        onConfirm={handleDelete}
        title="Delete Organization"
        message={`Are you sure you want to permanently delete "${selectedTenant?.name}"? This action cannot be undone and all data will be lost.`}
        confirmLabel="Delete Forever"
        cancelLabel="Cancel"
        isLoading={actionLoading}
        variant="danger"
      />
    </div>
  );
}

// Add this at the end of the file for usage in other components if needed
const Clock = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
