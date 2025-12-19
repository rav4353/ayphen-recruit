import axios from 'axios';
import { useSuperAdminStore } from '../stores/superAdmin';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Create axios instance for super admin
const superAdminApi = axios.create({
  baseURL: `${API_BASE_URL}/api/v1/super-admin`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
superAdminApi.interceptors.request.use(
  (config) => {
    const { accessToken, updateActivity, isSessionValid } = useSuperAdminStore.getState();

    if (accessToken) {
      // Update activity FIRST, before checking session validity
      updateActivity();

      // Then check if session is valid
      if (!isSessionValid()) {
        useSuperAdminStore.getState().logout();
        window.location.href = '/super-admin/login';
        return Promise.reject(new Error('Session expired'));
      }

      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
superAdminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useSuperAdminStore.getState().logout();
      window.location.href = '/super-admin/login';
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH ====================
export const superAdminAuthApi = {
  login: (email: string, password: string) =>
    superAdminApi.post('/auth/login', { email, password }),

  forceChangePassword: (email: string, currentPassword: string, newPassword: string) =>
    superAdminApi.post('/auth/force-change-password', { email, currentPassword, newPassword }),

  logout: () =>
    superAdminApi.post('/auth/logout'),

  changePassword: (currentPassword: string, newPassword: string) =>
    superAdminApi.post('/auth/change-password', { currentPassword, newPassword }),

  getProfile: () =>
    superAdminApi.get('/auth/profile'),

  setup: (email: string, password: string, name: string, setupKey: string) =>
    superAdminApi.post('/auth/setup', { email, password, name, setupKey }),
};

// ==================== DASHBOARD ====================
export const superAdminDashboardApi = {
  getStats: () =>
    superAdminApi.get('/dashboard/stats'),

  getRecentActivity: (limit?: number) =>
    superAdminApi.get('/dashboard/activity', { params: { limit } }),

  getSystemHealth: () =>
    superAdminApi.get('/dashboard/health'),

  getRevenue: (period?: 'day' | 'week' | 'month' | 'year') =>
    superAdminApi.get('/dashboard/revenue', { params: { period } }),
};

// ==================== TENANTS ====================
export const superAdminTenantsApi = {
  getAll: (params?: { page?: number; search?: string; status?: string; plan?: string }) =>
    superAdminApi.get('/tenants', { params }),

  getById: (id: string) =>
    superAdminApi.get(`/tenants/${id}`),

  create: (data: {
    name: string;
    slug: string;
    ownerEmail: string;
    ownerFirstName: string;
    ownerLastName: string;
    plan?: string;
  }) =>
    superAdminApi.post('/tenants', data),

  update: (id: string, data: Record<string, unknown>) =>
    superAdminApi.patch(`/tenants/${id}`, data),

  suspend: (id: string, reason: string) =>
    superAdminApi.post(`/tenants/${id}/suspend`, { reason }),

  activate: (id: string) =>
    superAdminApi.post(`/tenants/${id}/activate`),

  delete: (id: string) =>
    superAdminApi.delete(`/tenants/${id}`),

  getUsers: (tenantId: string, params?: { page?: number; search?: string }) =>
    superAdminApi.get(`/tenants/${tenantId}/users`, { params }),

  getJobs: (tenantId: string, params?: { page?: number }) =>
    superAdminApi.get(`/tenants/${tenantId}/jobs`, { params }),

  getStats: (tenantId: string) =>
    superAdminApi.get(`/tenants/${tenantId}/stats`),

  impersonate: (tenantId: string, userId: string) =>
    superAdminApi.post(`/tenants/${tenantId}/impersonate`, { userId }),
};

// ==================== USERS ====================
export const superAdminUsersApi = {
  getAll: (params?: { page?: number; search?: string; role?: string; tenantId?: string }) =>
    superAdminApi.get('/users', { params }),

  getById: (id: string) =>
    superAdminApi.get(`/users/${id}`),

  update: (id: string, data: Record<string, unknown>) =>
    superAdminApi.patch(`/users/${id}`, data),

  suspend: (id: string, reason: string) =>
    superAdminApi.post(`/users/${id}/suspend`, { reason }),

  activate: (id: string) =>
    superAdminApi.post(`/users/${id}/activate`),

  resetPassword: (id: string) =>
    superAdminApi.post(`/users/${id}/reset-password`),

  delete: (id: string) =>
    superAdminApi.delete(`/users/${id}`),
};

// ==================== SUBSCRIPTIONS ====================
export const superAdminSubscriptionsApi = {
  getAll: (params?: { page?: number; status?: string; plan?: string }) =>
    superAdminApi.get('/subscriptions', { params }),

  getById: (id: string) =>
    superAdminApi.get(`/subscriptions/${id}`),

  create: (tenantId: string, data: { plan: string; billingCycle: string }) =>
    superAdminApi.post('/subscriptions', { tenantId, ...data }),

  update: (id: string, data: Record<string, unknown>) =>
    superAdminApi.patch(`/subscriptions/${id}`, data),

  cancel: (id: string, reason?: string) =>
    superAdminApi.post(`/subscriptions/${id}/cancel`, { reason }),

  extend: (id: string, days: number) =>
    superAdminApi.post(`/subscriptions/${id}/extend`, { days }),

  getPlans: () =>
    superAdminApi.get('/subscriptions/plans'),

  getStats: () =>
    superAdminApi.get('/subscriptions/stats'),

  updatePlan: (planId: string, data: Record<string, unknown>) =>
    superAdminApi.patch(`/subscriptions/plans/${planId}`, data),

  createPlan: (data: Record<string, unknown>) =>
    superAdminApi.post('/subscriptions/plans', data),

  deletePlan: (planId: string) =>
    superAdminApi.delete(`/subscriptions/plans/${planId}`),
};

// ==================== BILLING ====================
export const superAdminBillingApi = {
  getInvoices: (params?: { page?: number; status?: string }) =>
    superAdminApi.get('/billing/invoices', { params }),

  getPayments: (params?: { page?: number; status?: string }) =>
    superAdminApi.get('/billing/invoices', { params }),

  getGateways: () =>
    superAdminApi.get('/billing/gateways'),

  updateGateway: (data: { provider: string; isActive: boolean; config: Record<string, unknown> }) =>
    superAdminApi.post('/billing/gateways', data),

  refundPayment: (paymentId: string, reason?: string) =>
    superAdminApi.post(`/billing/invoices/${paymentId}/refund`, { reason }),

  exportBillingData: (params?: { startDate?: string; endDate?: string; format?: string }) =>
    superAdminApi.get('/billing/export', { params, responseType: 'blob' }),
};

// ==================== AUDIT LOGS ====================
export const superAdminAuditApi = {
  getAll: (params?: {
    page?: number;
    action?: string;
    entityType?: string;
    userId?: string;
    tenantId?: string;
    startDate?: string;
    endDate?: string;
  }) =>
    superAdminApi.get('/audit-logs', { params }),

  getById: (id: string) =>
    superAdminApi.get(`/audit-logs/${id}`),

  export: (params?: Record<string, unknown>) =>
    superAdminApi.get('/audit-logs/export', { params, responseType: 'blob' }),
};

// ==================== SYSTEM SETTINGS ====================
export const superAdminSettingsApi = {
  getAll: () =>
    superAdminApi.get('/settings'),

  update: (key: string, value: unknown) =>
    superAdminApi.patch('/settings', { key, value }),

  getEmailConfig: () =>
    superAdminApi.get('/settings/email'),

  updateEmailConfig: (data: Record<string, unknown>) =>
    superAdminApi.patch('/settings/email', data),

  testEmail: (to: string) =>
    superAdminApi.post('/settings/email/test', { to }),

  getFeatureFlags: () =>
    superAdminApi.get('/settings/feature-flags'),

  updateFeatureFlag: (flag: string, enabled: boolean) =>
    superAdminApi.patch(`/settings/feature-flags/${flag}`, { enabled }),

  getMaintenanceMode: () =>
    superAdminApi.get('/settings/maintenance'),

  setMaintenanceMode: (enabled: boolean, message?: string) =>
    superAdminApi.post('/settings/maintenance', { enabled, message }),
};

// ==================== ANALYTICS ====================
export const superAdminAnalyticsApi = {
  getOverview: (period?: 'day' | 'week' | 'month' | 'year') =>
    superAdminApi.get('/analytics/overview', { params: { period } }),

  getTenantGrowth: (period?: 'day' | 'week' | 'month' | 'year') =>
    superAdminApi.get('/analytics/tenant-growth', { params: { period } }),

  getUserGrowth: (period?: 'day' | 'week' | 'month' | 'year') =>
    superAdminApi.get('/analytics/user-growth', { params: { period } }),

  getUsageMetrics: (tenantId?: string) =>
    superAdminApi.get('/analytics/usage', { params: { tenantId } }),

  getTopTenants: (limit?: number) =>
    superAdminApi.get('/analytics/top-tenants', { params: { limit } }),
};

// ==================== MONITORING ====================
export const superAdminMonitoringApi = {
  getLogs: (params?: { level?: string; page?: number; limit?: number }) =>
    superAdminApi.get('/monitoring/logs', { params }),

  getResources: () =>
    superAdminApi.get('/monitoring/resources'),

  getJobs: () =>
    superAdminApi.get('/monitoring/jobs'),
};

// ==================== API MANAGEMENT ====================
export const superAdminApiManagementApi = {
  getKeys: (params?: { page?: number; tenantId?: string; search?: string }) =>
    superAdminApi.get('/api/keys', { params }),

  createKey: (data: { name: string; tenantId?: string; scopes: string[]; expiresAt?: string }) =>
    superAdminApi.post('/api/keys', data),

  revokeKey: (id: string) =>
    superAdminApi.delete(`/api/keys/${id}`),

  getUsage: (tenantId?: string) =>
    superAdminApi.get('/api/usage', { params: { tenantId } }),

  getWebhooks: (tenantId?: string) =>
    superAdminApi.get('/api/webhooks', { params: { tenantId } }),

  createWebhook: (data: { url: string; events: string[]; tenantId?: string }) =>
    superAdminApi.post('/api/webhooks', data),

  deleteWebhook: (id: string) =>
    superAdminApi.delete(`/api/webhooks/${id}`),

  getRateLimits: () =>
    superAdminApi.get('/api/rate-limits'),

  updateRateLimit: (id: string, data: { limit?: number; window?: string; isActive?: boolean }) =>
    superAdminApi.patch(`/api/rate-limits/${id}`, data),
};

// ==================== SECURITY ====================
export const superAdminSecurityApi = {
  getAlerts: () =>
    superAdminApi.get('/security/alerts'),

  resolveAlert: (id: string) =>
    superAdminApi.post(`/security/alerts/${id}/resolve`),

  getBlockedIps: () =>
    superAdminApi.get('/security/blocked-ips'),

  blockIp: (data: { ipAddress: string; reason: string }) =>
    superAdminApi.post('/security/blocked-ips', data),

  unblockIp: (id: string) =>
    superAdminApi.delete(`/security/blocked-ips/${id}`),

  getLoginAttempts: (params?: { success?: boolean; page?: number }) =>
    superAdminApi.get('/security/login-attempts', { params }),

  getSessions: () =>
    superAdminApi.get('/security/sessions'),

  revokeSession: (id: string) =>
    superAdminApi.delete(`/security/sessions/${id}`),
};

// ==================== ANNOUNCEMENTS ====================
export const superAdminAnnouncementsApi = {
  getAll: (params?: { page?: number; status?: string }) =>
    superAdminApi.get('/announcements', { params }),

  getById: (id: string) =>
    superAdminApi.get(`/announcements/${id}`),

  create: (data: Record<string, unknown>) =>
    superAdminApi.post('/announcements', data),

  update: (id: string, data: Record<string, unknown>) =>
    superAdminApi.patch(`/announcements/${id}`, data),

  delete: (id: string) =>
    superAdminApi.delete(`/announcements/${id}`),

  publish: (id: string) =>
    superAdminApi.post(`/announcements/${id}/publish`),
};

// ==================== DATA MANAGEMENT ====================
export const superAdminDataApi = {
  getBackups: () =>
    superAdminApi.get('/data/backups'),

  createBackup: (type: 'full' | 'incremental' | 'manual' = 'manual') =>
    superAdminApi.post('/data/backups', { type }),

  deleteBackup: (id: string) =>
    superAdminApi.delete(`/data/backups/${id}`),

  downloadBackup: (id: string) =>
    superAdminApi.get(`/data/backups/${id}/download`, { responseType: 'blob' }),

  getExports: (params?: { page?: number; status?: string }) =>
    superAdminApi.get('/data/exports', { params }),

  createExport: (data: { tenantId: string; type: string }) =>
    superAdminApi.post('/data/exports', data),

  downloadExport: (id: string) =>
    superAdminApi.get(`/data/exports/${id}/download`, { responseType: 'blob' }),

  getGDPRRequests: (params?: { page?: number; status?: string; type?: string }) =>
    superAdminApi.get('/data/gdpr-requests', { params }),

  processGDPRRequest: (id: string, action: 'complete' | 'reject') =>
    superAdminApi.post(`/data/gdpr-requests/${id}/process`, { action }),

  runCleanupTask: (task: 'audit_logs' | 'sessions' | 'orphaned_files' | 'deleted_records') =>
    superAdminApi.post(`/data/cleanup/${task}`),
};

// ==================== SUPPORT ====================
export const superAdminSupportApi = {
  getTickets: (params?: { page?: number; status?: string; priority?: string; search?: string }) =>
    superAdminApi.get('/support/tickets', { params }),

  getTicketById: (id: string) =>
    superAdminApi.get(`/support/tickets/${id}`),

  updateTicketStatus: (id: string, status: string) =>
    superAdminApi.patch(`/support/tickets/${id}/status`, { status }),

  addTicketMessage: (id: string, message: string) =>
    superAdminApi.post(`/support/tickets/${id}/messages`, { message }),
};

// ==================== NOTIFICATIONS ====================
export const superAdminNotificationsApi = {
  getAll: (params?: { page?: number; limit?: number; type?: string; priority?: string; unreadOnly?: boolean }) =>
    superAdminApi.get('/notifications', { params }),

  getUnreadCount: () =>
    superAdminApi.get('/notifications/unread-count'),

  markAsRead: (notificationIds: string[]) =>
    superAdminApi.post('/notifications/mark-read', { notificationIds }),

  markAllAsRead: () =>
    superAdminApi.post('/notifications/mark-all-read'),

  delete: (id: string) =>
    superAdminApi.delete(`/notifications/${id}`),

  deleteAll: (readOnly?: boolean) =>
    superAdminApi.delete('/notifications', { params: { readOnly } }),
};

export default superAdminApi;
