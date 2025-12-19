import { useState, useEffect } from 'react';
import {
  Users as UsersIcon,
  Search,
  ChevronDown,
  RefreshCw,
  MoreVertical,
  Eye,
  Ban,
  CheckCircle,
  Key,
  Trash2,
  Mail,
  Shield,
  Building2,
  UserSquare2,
} from 'lucide-react';
import { superAdminUsersApi, superAdminTenantsApi } from '../../lib/superAdminApi';
import { Button, ConfirmationModal } from '../../components/ui';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../stores/auth';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING';
  tenantId: string;
  tenantName: string;
  lastLoginAt?: string;
  createdAt: string;
}

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [searchQuery, statusFilter, roleFilter, page]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await superAdminUsersApi.getAll({
        page,
        search: searchQuery || undefined,
        role: roleFilter || undefined,
      });
      setUsers(response.data.data || []);
      setTotalPages(response.data.meta?.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch users', error);
      toast.error('Failed to fetch users. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImpersonate = async (user: User) => {
    const loadingToast = toast.loading('Generating impersonation session...');
    try {
      const response = await superAdminTenantsApi.impersonate(user.tenantId, user.id);
      const { accessToken, refreshToken, user: impersonatedUser } = response.data.data;

      // Log into the main app store
      useAuthStore.getState().setAuth(impersonatedUser, accessToken, refreshToken);

      toast.success(`Now impersonating ${impersonatedUser.firstName}`, { id: loadingToast });

      // Open the portal in a new tab
      window.open('/dashboard', '_blank');
    } catch (error) {
      toast.error('Failed to impersonate user', { id: loadingToast });
    }
  };

  const handleSuspend = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await superAdminUsersApi.suspend(selectedUser.id, 'Suspended by super admin');
      toast.success(`${selectedUser.firstName} ${selectedUser.lastName} has been suspended`);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to suspend user');
    } finally {
      setActionLoading(false);
      setShowSuspendModal(false);
      setSelectedUser(null);
    }
  };

  const handleActivate = async (user: User) => {
    try {
      await superAdminUsersApi.activate(user.id);
      toast.success(`${user.firstName} ${user.lastName} has been activated`);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to activate user');
    }
  };

  const handleResetPassword = async (user: User) => {
    try {
      await superAdminUsersApi.resetPassword(user.id);
      toast.success(`Password reset email sent to ${user.email}`);
    } catch (error) {
      toast.error('Failed to reset password');
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await superAdminUsersApi.delete(selectedUser.id);
      toast.success(`${selectedUser.firstName} ${selectedUser.lastName} has been deleted`);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to delete user');
    } finally {
      setActionLoading(false);
      setShowDeleteModal(false);
      setSelectedUser(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      ACTIVE: 'bg-green-500/10 text-green-600 dark:text-green-500 border-green-500/20',
      INACTIVE: 'bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-500/20',
      SUSPENDED: 'bg-red-500/10 text-red-600 dark:text-red-500 border-red-500/20',
      PENDING: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border-yellow-500/20',
    };
    return styles[status as keyof typeof styles] || 'bg-neutral-500/10 text-neutral-500';
  };

  const getRoleBadge = (role: string) => {
    const styles = {
      ADMIN: 'bg-purple-500/10 text-purple-600 dark:text-purple-500',
      RECRUITER: 'bg-blue-500/10 text-blue-600 dark:text-blue-500',
      HIRING_MANAGER: 'bg-orange-500/10 text-orange-600 dark:text-orange-500',
      INTERVIEWER: 'bg-teal-500/10 text-teal-600 dark:text-teal-500',
    };
    return styles[role as keyof typeof styles] || 'bg-neutral-500/10 text-neutral-500';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight">System Users</h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1 transition-colors font-medium">
            Manage and monitor user accounts across all platform organizations
          </p>
        </div>
        <Button
          variant="outline"
          className="border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all rounded-xl h-11"
          onClick={fetchUsers}
        >
          <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: users.length, icon: UsersIcon, color: 'blue' },
          { label: 'Active', value: users.filter(u => u.status === 'ACTIVE').length, icon: CheckCircle, color: 'green' },
          { label: 'Admins', value: users.filter(u => u.role === 'ADMIN').length, icon: Shield, color: 'purple' },
          { label: 'Suspended', value: users.filter(u => u.status === 'SUSPENDED').length, icon: Ban, color: 'red' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl bg-${stat.color}-500/10 flex items-center justify-center text-${stat.color}-600 dark:text-${stat.color}-400`}>
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-2xl font-black text-neutral-900 dark:text-white leading-none">{stat.value}</p>
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mt-1.5">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters Area */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
          <input
            type="text"
            placeholder="Search by name, email or ID..."
            className="w-full h-12 pl-12 pr-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-4 focus:ring-red-500/5 focus:border-red-500 transition-all font-medium shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <div className="relative min-w-[140px]">
            <select
              className="appearance-none w-full h-12 pl-4 pr-10 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-sm font-bold text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-4 focus:ring-red-500/5 cursor-pointer shadow-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="PENDING">Pending</option>
              <option value="INACTIVE">Inactive</option>
            </select>
            <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
          </div>
          <div className="relative min-w-[140px]">
            <select
              className="appearance-none w-full h-12 pl-4 pr-10 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-sm font-bold text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-4 focus:ring-red-500/5 cursor-pointer shadow-sm"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="RECRUITER">Recruiter</option>
              <option value="HIRING_MANAGER">Hiring Manager</option>
              <option value="INTERVIEWER">Interviewer</option>
            </select>
            <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-xl shadow-neutral-200/20 dark:shadow-none transition-all">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/20 transition-colors">
                <th className="text-left text-xs font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400 px-6 py-5">User Account</th>
                <th className="text-left text-xs font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400 px-6 py-5">Organization</th>
                <th className="text-left text-xs font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400 px-6 py-5">Role</th>
                <th className="text-left text-xs font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400 px-6 py-5">Status</th>
                <th className="text-left text-xs font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400 px-6 py-5">Activity</th>
                <th className="px-6 py-5 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-neutral-500 font-bold uppercase tracking-widest">Querying User Directory...</p>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-3xl bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center border border-neutral-100 dark:border-neutral-700">
                        <UsersIcon size={32} className="text-neutral-300" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-neutral-900 dark:text-white font-black text-lg">No Users Found</p>
                        <p className="text-sm text-neutral-500 font-medium max-w-xs mx-auto">We couldn't find any users matching your criteria. Try some broader filters.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="group hover:bg-neutral-50/50 dark:hover:bg-neutral-800/10 transition-all">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500/10 to-orange-500/10 flex items-center justify-center text-red-600 dark:text-orange-400 font-black text-lg border border-red-500/10">
                            {user.firstName[0]}{user.lastName[0]}
                          </div>
                          {user.status === 'ACTIVE' && (
                            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white dark:border-neutral-900 shadow-sm" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-extrabold text-neutral-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-xs text-neutral-500 flex items-center gap-1.5 mt-0.5 font-medium">
                            <Mail size={12} className="text-neutral-400" />
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className="text-sm text-neutral-700 dark:text-neutral-300 font-bold flex items-center gap-2">
                        <Building2 size={16} className="text-neutral-400" />
                        {user.tenantName}
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getRoleBadge(user.role)} ring-1 ring-inset ring-current/10`}>
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusBadge(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div>
                        <p className="text-xs font-bold text-neutral-900 dark:text-neutral-200">
                          {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                        </p>
                        <p className="text-[10px] text-neutral-500 font-medium mt-0.5">Last login attempt</p>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="relative group/menu inline-block">
                        <button className="p-2.5 rounded-xl text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700">
                          <MoreVertical size={18} />
                        </button>
                        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-20 py-2 animate-slide-in">
                          <button 
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                            onClick={() => {
                              toast(`User: ${user.firstName} ${user.lastName}\nEmail: ${user.email}\nRole: ${user.role}\nOrg: ${user.tenantName}\nStatus: ${user.status}\nLast Login: ${user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}`, { duration: 5000, icon: '👤' });
                            }}
                          >
                            <Eye size={18} className="text-neutral-400" />
                            View Full Profile
                          </button>
                          <button
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-black text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 transition-colors"
                            onClick={() => handleImpersonate(user)}
                          >
                            <UserSquare2 size={18} />
                            Impersonate Account
                          </button>
                          <button
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                            onClick={() => handleResetPassword(user)}
                          >
                            <Key size={18} className="text-neutral-400" />
                            Reset Password
                          </button>
                          <div className="my-1 border-t border-neutral-100 dark:border-neutral-800" />
                          {user.status === 'ACTIVE' ? (
                            <button
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-amber-600 dark:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
                              onClick={() => {
                                setSelectedUser(user);
                                setShowSuspendModal(true);
                              }}
                            >
                              <Ban size={18} />
                              Suspend Access
                            </button>
                          ) : (
                            <button
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-emerald-600 dark:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                              onClick={() => handleActivate(user)}
                            >
                              <CheckCircle size={18} />
                              Activate Account
                            </button>
                          )}
                          <button
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-black text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowDeleteModal(true);
                            }}
                          >
                            <Trash2 size={18} />
                            Purge User Data
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

        {/* Pagination Block */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-5 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/30 dark:bg-transparent">
            <span className="text-xs font-black text-neutral-500 uppercase tracking-widest">
              Listing {users.length} of global distribution
            </span>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="border-neutral-200 dark:border-neutral-700 rounded-xl font-black text-xs uppercase opacity-80"
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Prev
              </Button>
              <div className="px-3 py-1 bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg text-xs font-black">
                {page}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-neutral-200 dark:border-neutral-700 rounded-xl font-black text-xs uppercase opacity-80"
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Security Modals */}
      <ConfirmationModal
        isOpen={showSuspendModal}
        onCancel={() => {
          setShowSuspendModal(false);
          setSelectedUser(null);
        }}
        onConfirm={handleSuspend}
        title="Suspend Access"
        message={`Force immediate logout and revocation for "${selectedUser?.firstName} ${selectedUser?.lastName}"? This will terminate all active sessions.`}
        confirmLabel="Confirm Suspension"
        cancelLabel="Discard"
        isLoading={actionLoading}
        variant="danger"
      />

      <ConfirmationModal
        isOpen={showDeleteModal}
        onCancel={() => {
          setShowDeleteModal(false);
          setSelectedUser(null);
        }}
        onConfirm={handleDelete}
        title="Purge User Account"
        message={`Are you absolutely sure you want to permanently delete "${selectedUser?.firstName} ${selectedUser?.lastName}"? This operation is irreversible and all associated history will be anonymized.`}
        confirmLabel="Purge Permanently"
        cancelLabel="Discard"
        isLoading={actionLoading}
        variant="danger"
      />
    </div>
  );
}
