import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, Button, Input, ConfirmationModal } from '../ui';
import { Plus, Shield, Lock, Ban, CheckCircle, Trash2, MoreVertical, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { usersApi, rolesApi } from '../../lib/api';
import { Permission } from '../../lib/permissions';

export function UserManagementSettings() {
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = (searchParams.get('view') as 'users' | 'roles' | 'auth') || 'users';

    const setActiveTab = (tab: 'users' | 'roles' | 'auth') => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.set('view', tab);
            return newParams;
        });
    };

    // Users State
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isInviting, setIsInviting] = useState(false);

    // User Action States
    const [userToDelete, setUserToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [userToToggleStatus, setUserToToggleStatus] = useState<any | null>(null);
    const [isTogglingStatus, setIsTogglingStatus] = useState(false);
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

    // Invite Form State
    const [inviteForm, setInviteForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        role: '',
        employeeId: '',
        password: '',
    });

    // Role Management State
    const [rolesList, setRolesList] = useState<any[]>([]);
    const [isLoadingRoles, setIsLoadingRoles] = useState(true);
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [isSavingRole, setIsSavingRole] = useState(false);
    const [editingRole, setEditingRole] = useState<any | null>(null);
    const [roleToDelete, setRoleToDelete] = useState<string | null>(null);
    const [isDeletingRole, setIsDeletingRole] = useState(false);

    // Update default role when roles are loaded
    useEffect(() => {
        if (rolesList.length > 0 && !inviteForm.role) {
            setInviteForm(prev => ({ ...prev, role: rolesList[0].id }));
        }
    }, [rolesList, inviteForm.role]);

    const [roleForm, setRoleForm] = useState({
        name: '',
        description: '',
        permissions: [] as string[]
    });

    // Edit User State
    const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
    const [isSavingUser, setIsSavingUser] = useState(false);
    const [editingUser, setEditingUser] = useState<any | null>(null);
    const [editUserForm, setEditUserForm] = useState({
        selectedRoleId: '',
        customPermissions: [] as string[]
    });

    useEffect(() => {
        // Always fetch roles on mount so they are available for invite/edit
        fetchRoles();
    }, []);

    useEffect(() => {
        if (activeTab === 'users') {
            fetchUsers();
        } else if (activeTab === 'roles') {
            // Refresh roles when tab becomes active just in case
            fetchRoles();
        }
    }, [activeTab, searchQuery]);

    const fetchRoles = async () => {
        try {
            const res = await rolesApi.getAll();
            const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
            setRolesList(data);
        } catch (error) {
            console.error('Failed to fetch roles', error);
            if (activeTab === 'roles') toast.error('Failed to load roles');
        } finally {
            setIsLoadingRoles(false);
        }
    };

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const res = await usersApi.getAll({ search: searchQuery });
            const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
            setUsers(data);
        } catch (error) {
            console.error('Failed to fetch users', error);
            toast.error('Failed to load users');
            setUsers([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInviteUser = async () => {
        if (!inviteForm.email || !inviteForm.firstName || !inviteForm.lastName || !inviteForm.password || !inviteForm.employeeId) {
            toast.error('Please fill in all fields');
            return;
        }

        setIsInviting(true);
        try {
            // Find selected role
            const selectedRole = rolesList.find(r => r.id === inviteForm.role);

            const payload: any = {
                firstName: inviteForm.firstName,
                lastName: inviteForm.lastName,
                email: inviteForm.email,
                employeeId: inviteForm.employeeId,
                password: inviteForm.password,
            };

            if (selectedRole) {
                if (selectedRole.isSystem) {
                    payload.role = selectedRole.id.startsWith('SYS_') ? selectedRole.id.replace('SYS_', '') : selectedRole.id;
                } else {
                    payload.role = 'RECRUITER';
                    payload.roleId = selectedRole.id;
                }
            } else {
                payload.role = inviteForm.role;
            }

            await usersApi.create(payload);
            toast.success('User invited successfully');
            setIsInviteModalOpen(false);
            setInviteForm({
                firstName: '',
                lastName: '',
                email: '',
                role: rolesList.length > 0 ? rolesList[0].id : '',
                employeeId: '',
                password: '',
            });
            fetchUsers();
        } catch (error: any) {
            console.error('Failed to invite user', error);
            const msg = error.response?.data?.message || 'Failed to invite user';
            toast.error(msg);
        } finally {
            setIsInviting(false);
        }
    };

    const handleSaveRole = async () => {
        if (!roleForm.name) {
            toast.error('Role name is required');
            return;
        }

        setIsSavingRole(true);
        try {
            if (editingRole) {
                await rolesApi.update(editingRole.id, roleForm);
                toast.success('Role updated successfully');
            } else {
                await rolesApi.create(roleForm);
                toast.success('Role created successfully');
            }
            setIsRoleModalOpen(false);
            fetchRoles();
        } catch (error) {
            console.error('Failed to save role', error);
            toast.error('Failed to save role');
        } finally {
            setIsSavingRole(false);
        }
    };

    const handleDeleteRoleClick = (id: string) => {
        setRoleToDelete(id);
    };

    const confirmDeleteRole = async () => {
        if (!roleToDelete) return;
        setIsDeletingRole(true);
        try {
            await rolesApi.delete(roleToDelete);
            toast.success('Role deleted successfully');
            fetchRoles();
        } catch (error) {
            console.error('Failed to delete role', error);
            toast.error('Failed to delete role');
        } finally {
            setIsDeletingRole(false);
            setRoleToDelete(null);
        }
    };

    const handleToggleStatusClick = (user: any) => {
        setUserToToggleStatus(user);
        setOpenDropdownId(null);
    };

    const confirmToggleStatus = async () => {
        if (!userToToggleStatus) return;

        setIsTogglingStatus(true);
        try {
            const newStatus = userToToggleStatus.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
            await usersApi.updateStatus(userToToggleStatus.id, newStatus);
            toast.success(`User ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'} successfully`);
            fetchUsers();
        } catch (error) {
            console.error('Failed to update user status', error);
            toast.error('Failed to update user status');
        } finally {
            setIsTogglingStatus(false);
            setUserToToggleStatus(null);
        }
    };

    const handleDeleteClick = (userId: string) => {
        setUserToDelete(userId);
        setOpenDropdownId(null);
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;

        setIsDeleting(true);
        try {
            await usersApi.delete(userToDelete);
            toast.success('User deleted successfully');
            fetchUsers();
        } catch (error) {
            console.error('Failed to delete user', error);
            toast.error('Failed to delete user');
        } finally {
            setIsDeleting(false);
            setUserToDelete(null);
        }
    };

    const handleResendPassword = async (userId: string) => {
        setOpenDropdownId(null);
        try {
            await usersApi.resendPassword(userId);
            toast.success('Temporary password sent successfully');
        } catch (error) {
            console.error('Failed to resend password', error);
            toast.error('Failed to resend password');
        }
    };

    const handleEditUserClick = async (user: any) => {
        setOpenDropdownId(null);
        setEditingUser(user);

        let roleIdToSelect = user.roleId;

        if (!roleIdToSelect) {
            let roles = rolesList;
            if (roles.length === 0) {
                try {
                    const res = await rolesApi.getAll();
                    roles = Array.isArray(res.data) ? res.data : (res.data?.data || []);
                    setRolesList(roles);
                } catch (e) {
                    console.error('Failed to load roles for edit', e);
                }
            }

            const systemRole = roles.find((r: any) =>
                r.isSystem && (r.id === user.role || r.id === `SYS_${user.role}`)
            );
            if (systemRole) roleIdToSelect = systemRole.id;
        }

        setEditUserForm({
            selectedRoleId: roleIdToSelect || (user.role ? `SYS_${user.role}` : ''),
            customPermissions: user.customPermissions || []
        });
        setIsEditUserModalOpen(true);
    };

    const handleSaveUserUpdate = async () => {
        if (!editingUser) return;

        setIsSavingUser(true);
        try {
            const selectedRole = rolesList.find(r => r.id === editUserForm.selectedRoleId);

            const payload: any = {
                customPermissions: editUserForm.customPermissions
            };

            if (selectedRole) {
                if (selectedRole.isSystem) {
                    payload.role = selectedRole.id.startsWith('SYS_') ? selectedRole.id.replace('SYS_', '') : selectedRole.id;
                    payload.roleId = null;
                } else {
                    payload.roleId = selectedRole.id;
                    payload.role = 'RECRUITER';
                }
            }

            await usersApi.update(editingUser.id, payload);
            toast.success('User permissions updated successfully');
            setIsEditUserModalOpen(false);
            fetchUsers();
        } catch (error) {
            console.error('Failed to update user', error);
            toast.error('Failed to update user permissions');
        } finally {
            setIsSavingUser(false);
        }
    };

    return (
        <div className="h-full min-h-0 flex flex-col gap-6">
            <div className="flex gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-1">
                <button
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'users'
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-blue-900/10'
                        : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400'
                        }`}
                    onClick={() => setActiveTab('users')}
                >
                    {t('settings.tabs.userList', 'Users')}
                </button>
                <button
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'roles'
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-blue-900/10'
                        : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400'
                        }`}
                    onClick={() => setActiveTab('roles')}
                >
                    {t('settings.tabs.roles', 'Roles & Permissions')}
                </button>
                <button
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'auth'
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-blue-900/10'
                        : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400'
                        }`}
                    onClick={() => setActiveTab('auth')}
                >
                    {t('settings.tabs.auth', 'Authentication')}
                </button>
            </div>

            {activeTab === 'users' && (
                <div className="flex flex-col flex-1 min-h-0 gap-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="relative w-full sm:w-72">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-neutral-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                                </span>
                            </div>
                            <input
                                type="text"
                                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                placeholder="Search users by name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button className="gap-2 shadow-sm" onClick={() => setIsInviteModalOpen(true)}>
                            <Plus size={16} />
                            <span>Invite User</span>
                        </Button>
                    </div>

                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-sm flex flex-col flex-1 min-h-0">
                        <div className="flex-1 overflow-auto">
                            <table className="w-full min-w-[800px]">
                                <thead className="bg-neutral-50/80 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800">
                                    <tr>
                                        <th className="text-left text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 px-6 py-3">User</th>
                                        <th className="text-left text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 px-6 py-3">Role</th>
                                        <th className="text-left text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 px-6 py-3">Status</th>
                                        <th className="text-right text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 px-6 py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-neutral-500">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                                                    <span>Loading users...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : users.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-neutral-500">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-full">
                                                        <Shield size={24} className="text-neutral-400" />
                                                    </div>
                                                    <span className="font-medium">No users found</span>
                                                    <span className="text-xs">Try adjusting your search or invite a new user.</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        users.map((user) => (
                                            <tr key={user.id} className="group hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shadow-sm ring-2 ring-white dark:ring-neutral-900 ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30' :
                                                            user.role === 'HIRING_MANAGER' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' :
                                                                'bg-blue-100 text-blue-600 dark:bg-blue-900/30'
                                                            }`}>
                                                            {user.firstName?.[0]}{user.lastName?.[0]}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-neutral-900 dark:text-white flex items-center gap-2">
                                                                {user.firstName} {user.lastName}
                                                            </div>
                                                            <div className="text-xs text-neutral-500 font-mono mt-0.5">{user.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${user.role === 'ADMIN'
                                                        ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800'
                                                        : user.role === 'HIRING_MANAGER'
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800'
                                                            : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                                                        }`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`w-2 h-2 rounded-full ${user.status === 'ACTIVE' ? 'bg-green-500' : 'bg-neutral-300 dark:bg-neutral-600'}`}></span>
                                                        <span className={`text-sm ${user.status === 'ACTIVE' ? 'text-neutral-900 dark:text-white' : 'text-neutral-500'}`}>
                                                            {user.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="relative flex justify-end">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setOpenDropdownId(openDropdownId === user.id ? null : user.id)}
                                                            className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white opacity-0 group-hover:opacity-100 transition-all data-[state=open]:opacity-100"
                                                            data-state={openDropdownId === user.id ? 'open' : 'closed'}
                                                        >
                                                            <MoreVertical size={18} />
                                                        </Button>

                                                        {openDropdownId === user.id && (
                                                            <>
                                                                <div
                                                                    className="fixed inset-0 z-10"
                                                                    onClick={() => setOpenDropdownId(null)}
                                                                />
                                                                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-neutral-100 dark:border-neutral-700 z-20 py-2 animate-in fade-in zoom-in-95 duration-100">
                                                                    <div className="px-3 py-2 border-b border-neutral-100 dark:border-neutral-700 mb-1">
                                                                        <p className="text-xs font-medium text-neutral-900 dark:text-white truncate">
                                                                            {user.firstName} {user.lastName}
                                                                        </p>
                                                                        <p className="text-[10px] text-neutral-500 truncate">{user.email}</p>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => handleResendPassword(user.id)}
                                                                        className="w-full px-4 py-2 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2 transition-colors"
                                                                    >
                                                                        <Mail size={14} className="text-neutral-400" />
                                                                        Resend Password
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleEditUserClick(user)}
                                                                        className="w-full px-4 py-2 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2 transition-colors"
                                                                    >
                                                                        <Lock size={14} className="text-neutral-400" />
                                                                        Edit Permissions
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleToggleStatusClick(user)}
                                                                        className="w-full px-4 py-2 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2 transition-colors"
                                                                    >
                                                                        {user.status === 'ACTIVE' ? (
                                                                            <>
                                                                                <Ban size={14} className="text-orange-400" />
                                                                                Deactivate User
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <CheckCircle size={14} className="text-green-400" />
                                                                                Activate User
                                                                            </>
                                                                        )}
                                                                    </button>
                                                                    <div className="border-t border-neutral-100 dark:border-neutral-700 my-1" />
                                                                    <button
                                                                        onClick={() => handleDeleteClick(user.id)}
                                                                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                        Delete User
                                                                    </button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modals for Users */}
            <ConfirmationModal
                isOpen={!!userToDelete}
                onCancel={() => setUserToDelete(null)}
                onConfirm={confirmDelete}
                title="Delete User"
                message="Are you sure you want to delete this user? This action cannot be undone."
                confirmLabel="Delete"
                cancelLabel="Cancel"
                isLoading={isDeleting}
                variant="danger"
            />

            <ConfirmationModal
                isOpen={!!userToToggleStatus}
                onCancel={() => setUserToToggleStatus(null)}
                onConfirm={confirmToggleStatus}
                title={userToToggleStatus?.status === 'ACTIVE' ? 'Deactivate User' : 'Activate User'}
                message={userToToggleStatus?.status === 'ACTIVE'
                    ? "Are you sure you want to deactivate this user? They will no longer be able to log in."
                    : "Are you sure you want to activate this user? They will be able to log in again."}
                confirmLabel={userToToggleStatus?.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                cancelLabel="Cancel"
                isLoading={isTogglingStatus}
                variant={userToToggleStatus?.status === 'ACTIVE' ? 'warning' : 'success'}
            />

            {activeTab === 'roles' && (
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="relative w-full sm:w-72">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-neutral-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                                </span>
                            </div>
                            <input
                                type="text"
                                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                placeholder="Search roles..."
                                disabled // Simple placeholder for now
                            />
                        </div>
                    </div>

                    {isLoadingRoles ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-r-transparent mb-2"></div>
                            <p className="text-neutral-500 text-sm">Loading roles...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {rolesList.map((role) => (
                                <div key={role.id} className="group bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                                    {role.isSystem && (
                                        <div className="absolute top-0 right-0 p-2 opacity-50">
                                            <Lock size={100} className="text-neutral-50 dark:text-neutral-800 -mr-8 -mt-8 rotate-12" />
                                        </div>
                                    )}

                                    <div className="relative z-10 flex flex-col h-full">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className={`p-3 rounded-xl ${role.isSystem
                                                ? 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                                                : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                                                }`}>
                                                {role.isSystem ? <Lock size={20} /> : <Shield size={20} />}
                                            </div>
                                            {role.isSystem && (
                                                <span className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 text-[10px] uppercase font-bold tracking-wider rounded border border-neutral-200 dark:border-neutral-700">
                                                    Default
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">
                                            {role.name}
                                        </h3>
                                        <p className="text-sm text-neutral-500 mb-6 flex-grow line-clamp-2">
                                            {role.description || 'No description provided.'}
                                        </p>

                                        <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-neutral-800">
                                            <div className="flex items-center gap-2">
                                                <span className="flex items-end gap-1">
                                                    <span className="text-2xl font-bold text-neutral-900 dark:text-white leading-none">
                                                        {role.permissions.length}
                                                    </span>
                                                    <span className="text-xs text-neutral-500 font-medium mb-0.5">perms</span>
                                                </span>
                                            </div>

                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => {
                                                        setEditingRole(role);
                                                        setRoleForm({
                                                            name: role.name,
                                                            description: role.description || '',
                                                            permissions: role.permissions
                                                        });
                                                        setIsRoleModalOpen(true);
                                                    }}
                                                    className={`p-2 rounded-lg transition-colors ${role.isSystem
                                                        ? 'text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                                                        : 'text-neutral-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                                                        }`}
                                                    title={role.isSystem ? "View Role Details" : "Edit Role"}
                                                >
                                                    {role.isSystem ? (
                                                        <div className="w-4 h-4"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg></div>
                                                    ) : (
                                                        <div className="w-4 h-4"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg></div>
                                                    )}
                                                </button>
                                                {!role.isSystem && (
                                                    <button
                                                        onClick={() => handleDeleteRoleClick(role.id)}
                                                        className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                        title="Delete Role"
                                                    >
                                                        <div className="w-4 h-4"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg></div>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* "Add New" Placeholder Card */}
                            <button
                                onClick={() => {
                                    setEditingRole(null);
                                    setRoleForm({ name: '', description: '', permissions: [] });
                                    setIsRoleModalOpen(true);
                                }}
                                className="group flex flex-col items-center justify-center p-8 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl hover:border-blue-500 dark:hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all gap-3 text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400"
                            >
                                <div className="p-4 rounded-full bg-neutral-50 dark:bg-neutral-800 group-hover:bg-white dark:group-hover:bg-neutral-900 shadow-sm">
                                    <Plus size={24} />
                                </div>
                                <span className="font-medium">Create Custom Role</span>
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Confirmation Modal for Role Deletion */}
            <ConfirmationModal
                isOpen={!!roleToDelete}
                onCancel={() => setRoleToDelete(null)}
                onConfirm={confirmDeleteRole}
                title="Delete Role"
                message="Are you sure you want to delete this role? This action cannot be undone."
                confirmLabel="Delete"
                cancelLabel="Cancel"
                isLoading={isDeletingRole}
                variant="danger"
            />

            {activeTab === 'auth' && (
                <div className="space-y-6">
                    <Card>
                        <CardHeader title="Single Sign-On (SSO)" description="Configure SSO providers for your organization." />
                        <div className="p-6 space-y-4">
                            <div className="flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white border border-neutral-200 rounded-lg flex items-center justify-center">
                                        <img src="https://authjs.dev/img/providers/google.svg" alt="Google" className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-neutral-900 dark:text-white">Google Workspace</h3>
                                        <p className="text-sm text-neutral-500">Allow users to sign in with Google</p>
                                    </div>
                                </div>
                                <Button variant="secondary">Configure</Button>
                            </div>

                            <div className="flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white border border-neutral-200 rounded-lg flex items-center justify-center">
                                        <img src="https://authjs.dev/img/providers/azure-ad.svg" alt="Microsoft" className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-neutral-900 dark:text-white">Microsoft Azure AD</h3>
                                        <p className="text-sm text-neutral-500">Allow users to sign in with Microsoft</p>
                                    </div>
                                </div>
                                <Button variant="secondary">Configure</Button>
                            </div>

                            <div className="flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white border border-neutral-200 rounded-lg flex items-center justify-center">
                                        <Lock size={20} className="text-neutral-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-neutral-900 dark:text-white">SAML 2.0</h3>
                                        <p className="text-sm text-neutral-500">Configure custom SAML provider (Okta, OneLogin)</p>
                                    </div>
                                </div>
                                <Button variant="secondary">Configure</Button>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <CardHeader title="Security Policies" description="Manage password and session policies." />
                        <div className="p-6 space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-medium text-neutral-900 dark:text-white">Enforce MFA</h3>
                                    <p className="text-sm text-neutral-500">Require all users to set up Two-Factor Authentication</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" />
                                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Session Timeout</label>
                                <select className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option>30 minutes</option>
                                    <option>1 hour</option>
                                    <option>4 hours</option>
                                    <option>24 hours</option>
                                    <option>7 days</option>
                                </select>
                                <p className="text-xs text-neutral-500 mt-1">Users will be logged out after inactivity.</p>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Invite User Modal */}
            {isInviteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Invite User</h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                        First Name
                                    </label>
                                    <Input
                                        value={inviteForm.firstName}
                                        onChange={(e) => setInviteForm({ ...inviteForm, firstName: e.target.value })}
                                        placeholder="Jane"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                        Last Name
                                    </label>
                                    <Input
                                        value={inviteForm.lastName}
                                        onChange={(e) => setInviteForm({ ...inviteForm, lastName: e.target.value })}
                                        placeholder="Doe"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Employee ID / Vendor ID <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    value={inviteForm.employeeId}
                                    onChange={(e) => setInviteForm({ ...inviteForm, employeeId: e.target.value })}
                                    placeholder="EMP001"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Email Address
                                </label>
                                <Input
                                    type="email"
                                    value={inviteForm.email}
                                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                                    placeholder="jane@company.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Role
                                </label>
                                <select
                                    className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={inviteForm.role}
                                    onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                                >
                                    {rolesList.length > 0 ? (
                                        rolesList.map(role => (
                                            <option key={role.id} value={role.id}>
                                                {role.name}
                                            </option>
                                        ))
                                    ) : (
                                        <option value="" disabled>Loading roles...</option>
                                    )}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Temporary Password
                                </label>
                                <Input
                                    type="password"
                                    value={inviteForm.password}
                                    onChange={(e) => setInviteForm({ ...inviteForm, password: e.target.value })}
                                    placeholder="********"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="ghost" onClick={() => setIsInviteModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleInviteUser} isLoading={isInviting}>
                                Send Invitation
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Role Modal */}
            {isRoleModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                                {editingRole ? (editingRole.isSystem ? 'View Role Details' : 'Edit Role') : 'Create New Role'}
                            </h3>
                            {editingRole?.isSystem && (
                                <span className="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-300 text-xs font-medium rounded border border-neutral-200 dark:border-neutral-600">
                                    Default (Read-only)
                                </span>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Role Name</label>
                                <Input
                                    value={roleForm.name}
                                    onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                                    placeholder="e.g. Senior Recruiter"
                                    disabled={editingRole?.isSystem}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Description</label>
                                <Input
                                    value={roleForm.description}
                                    onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                                    placeholder="Describe what this role can do..."
                                    disabled={editingRole?.isSystem}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">Permissions</label>
                                <div className="space-y-4">
                                    {Object.entries(
                                        Object.values(Permission).reduce((acc, perm) => {
                                            const category = perm.split('.')[0];
                                            if (!acc[category]) acc[category] = [];
                                            acc[category].push(perm);
                                            return acc;
                                        }, {} as Record<string, string[]>)
                                    ).map(([category, perms]) => {
                                        const isAllSelected = perms.every(p => roleForm.permissions.includes(p));
                                        const isIndeterminate = perms.some(p => roleForm.permissions.includes(p)) && !isAllSelected;

                                        return (
                                            <div key={category} className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
                                                <div className="bg-neutral-50 dark:bg-neutral-800/50 px-4 py-3 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-700">
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="checkbox"
                                                            className={`rounded border-neutral-300 text-blue-600 focus:ring-blue-500 ${isIndeterminate ? 'bg-blue-600' : ''}`}
                                                            checked={isAllSelected}
                                                            disabled={editingRole?.isSystem}
                                                            ref={input => {
                                                                if (input) input.indeterminate = isIndeterminate;
                                                            }}
                                                            onChange={(e) => {
                                                                if (editingRole?.isSystem) return;
                                                                if (e.target.checked) {
                                                                    setRoleForm(prev => ({
                                                                        ...prev,
                                                                        permissions: [...new Set([...prev.permissions, ...perms])]
                                                                    }));
                                                                } else {
                                                                    setRoleForm(prev => ({
                                                                        ...prev,
                                                                        permissions: prev.permissions.filter(p => !perms.includes(p))
                                                                    }));
                                                                }
                                                            }}
                                                        />
                                                        <span className="font-medium text-sm text-neutral-700 dark:text-neutral-200 capitalize">
                                                            {category} Management
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-neutral-500">
                                                        {perms.filter(p => roleForm.permissions.includes(p)).length} / {perms.length} selected
                                                    </span>
                                                </div>
                                                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white dark:bg-neutral-800">
                                                    {perms.map(perm => (
                                                        <label key={perm} className={`flex items-center space-x-2 p-2 rounded transition-colors ${editingRole?.isSystem ? 'opacity-75 cursor-default' : 'cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700/50'}`}>
                                                            <input
                                                                type="checkbox"
                                                                className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                                                                checked={roleForm.permissions.includes(perm)}
                                                                disabled={editingRole?.isSystem}
                                                                onChange={(e) => {
                                                                    if (editingRole?.isSystem) return;
                                                                    if (e.target.checked) {
                                                                        setRoleForm(prev => ({ ...prev, permissions: [...prev.permissions, perm] }));
                                                                    } else {
                                                                        setRoleForm(prev => ({ ...prev, permissions: prev.permissions.filter((p: string) => p !== perm) }));
                                                                    }
                                                                }}
                                                            />
                                                            <span className="text-sm text-neutral-600 dark:text-neutral-400">
                                                                {t(`permissions.${perm}`, perm.split('.')[1].replace(/_/g, ' '))}
                                                            </span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                            {editingRole?.isSystem ? (
                                <Button onClick={() => setIsRoleModalOpen(false)}>Close</Button>
                            ) : (
                                <>
                                    <Button variant="ghost" onClick={() => setIsRoleModalOpen(false)}>Cancel</Button>
                                    <Button onClick={handleSaveRole} isLoading={isSavingRole}>
                                        {editingRole ? 'Update Role' : 'Create Role'}
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {isEditUserModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Edit User Permissions</h3>
                            <button onClick={() => setIsEditUserModalOpen(false)} className="text-neutral-500 hover:text-neutral-700">
                                <Plus size={24} className="rotate-45" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Role Selection */}
                            <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                    Assigned Role
                                </label>
                                <select
                                    className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={editUserForm.selectedRoleId}
                                    onChange={(e) => {
                                        const selectedId = e.target.value;
                                        const newRole = rolesList.find(r => r.id === selectedId);
                                        // When role changes, automatically reset permissions to that role's defaults
                                        setEditUserForm({
                                            selectedRoleId: selectedId,
                                            customPermissions: newRole ? [...newRole.permissions] : []
                                        });
                                    }}
                                >
                                    <optgroup label="Default Roles">
                                        {rolesList.filter(r => r.isSystem).map(role => (
                                            <option key={role.id} value={role.id}>{role.name}</option>
                                        ))}
                                    </optgroup>
                                    <optgroup label="Custom Roles">
                                        {rolesList.filter(r => !r.isSystem).map(role => (
                                            <option key={role.id} value={role.id}>{role.name}</option>
                                        ))}
                                    </optgroup>
                                </select>
                                <p className="text-xs text-neutral-500 mt-2">
                                    Changing the role will reset permissions to the new role's defaults. You can then customize them below.
                                </p>
                            </div>

                            {/* Permissions Checklist */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                        Permissions
                                    </label>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                        onClick={() => {
                                            const role = rolesList.find(r => r.id === editUserForm.selectedRoleId);
                                            if (role) {
                                                setEditUserForm(prev => ({ ...prev, customPermissions: [...role.permissions] }));
                                                toast.success('Reset to role defaults');
                                            }
                                        }}
                                    >
                                        Reset to Role Defaults
                                    </Button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 max-h-96 overflow-y-auto">
                                    {Object.values(Permission).map((perm: string) => {
                                        const isChecked = editUserForm.customPermissions.includes(perm);

                                        return (
                                            <label key={perm} className="flex items-center space-x-2 p-2 rounded hover:bg-neutral-50 dark:hover:bg-neutral-700/50 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                                                    checked={isChecked}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setEditUserForm(prev => ({
                                                                ...prev,
                                                                customPermissions: [...prev.customPermissions, perm]
                                                            }));
                                                        } else {
                                                            setEditUserForm(prev => ({
                                                                ...prev,
                                                                customPermissions: prev.customPermissions.filter((p: string) => p !== perm)
                                                            }));
                                                        }
                                                    }}
                                                />
                                                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                                                    {t(`permissions.${perm}`, perm)}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                            <Button variant="ghost" onClick={() => setIsEditUserModalOpen(false)}>Cancel</Button>
                            <Button onClick={handleSaveUserUpdate} isLoading={isSavingUser}>
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
