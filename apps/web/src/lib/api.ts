import axios from 'axios';
import { useAuthStore } from '../stores/auth';
import i18n from './i18n';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Don't redirect for background fetches that can fail gracefully
    // AND don't redirect for auth endpoints (login, refresh, etc) which handle their own errors
    if (
      error.config?.url?.includes('/settings/status-colors') ||
      error.config?.url?.includes('/users/me/preferences') ||
      error.config?.url?.includes('/auth/')
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      localStorage.removeItem('talentx-language');
      i18n.changeLanguage('en');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

/**
 * Utility to extract data from API responses consistently.
 * Handles both { data: T } and { data: { data: T } } response formats.
 */
export function extractData<T>(response: { data: T | { data: T } }): T {
  const data = response.data;
  if (data && typeof data === 'object' && 'data' in data) {
    return (data as { data: T }).data;
  }
  return data as T;
}

/**
 * Utility to safely access nested properties with fallback
 */
export function safeGet<T>(obj: any, path: string, fallback: T): T {
  const keys = path.split('.');
  let result = obj;
  for (const key of keys) {
    if (result === null || result === undefined) return fallback;
    result = result[key];
  }
  return result ?? fallback;
}

// Auth API
export const authApi = {
  // Basic auth
  login: (data: { email: string; password: string; tenantId?: string }) =>
    api.post('/auth/login', data),
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    tenantId?: string;
  }) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),

  // Password management
  forgotPassword: (data: { email: string; tenantId?: string }) =>
    api.post('/auth/forgot-password', data),
  resetPassword: (data: { token: string; newPassword: string }) =>
    api.post('/auth/reset-password', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/auth/change-password', data),
  verifyPassword: (password: string) =>
    api.post('/auth/verify-password', { password }),

  // Magic link (for candidates)
  requestMagicLink: (data: { email: string; tenantId: string }) =>
    api.post('/auth/magic-link/request', data),
  verifyMagicLink: (token: string) =>
    api.post('/auth/magic-link/verify', { token }),

  // OTP (for candidates)
  requestOtp: (data: { email: string; tenantId?: string; type?: string }) =>
    api.post('/auth/otp/request', data),
  verifyOtp: (data: { email: string; tenantId?: string; code: string; type?: string }) =>
    api.post('/auth/otp/verify', data),

  // MFA
  getMfaStatus: () => api.get('/auth/mfa/status'),
  setupMfa: () => api.post('/auth/mfa/setup'),
  confirmMfa: (code: string) => api.post('/auth/mfa/confirm', { code }),
  verifyMfa: (code: string, rememberDevice?: boolean) =>
    api.post('/auth/mfa/verify', { code, rememberDevice }),
  disableMfa: (data: { code: string; password: string }) =>
    api.post('/auth/mfa/disable', data),

  // Sessions
  getSessions: () => api.get('/auth/sessions'),
  terminateSession: (sessionId: string) => api.delete(`/auth/sessions/${sessionId}`),
  terminateAllSessions: () => api.delete('/auth/sessions'),
  refreshSession: () => api.post('/auth/sessions/refresh'),
  getSessionTimeout: () => api.get('/auth/session-timeout'),
};

// Jobs API
// Jobs API
export const jobsApi = {
  getAll: (tenantId: string, params?: Record<string, unknown>) => api.get(`/${tenantId}/jobs`, { params }),
  getById: (tenantId: string, id: string) => api.get(`/${tenantId}/jobs/${id}`),
  getPublic: (tenantId: string, id: string) => api.get(`/${tenantId}/jobs/${id}/public`),
  getPublicAll: (tenantId: string) => api.get(`/${tenantId}/jobs/public`),
  create: (tenantId: string, data: Record<string, unknown>) => api.post(`/${tenantId}/jobs`, data),
  update: (tenantId: string, id: string, data: Record<string, unknown>) => api.patch(`/${tenantId}/jobs/${id}`, data),
  updateStatus: (tenantId: string, id: string, status: string) => api.patch(`/${tenantId}/jobs/${id}/status`, { status }),
  delete: (tenantId: string, id: string) => api.delete(`/${tenantId}/jobs/${id}`),
  clone: (tenantId: string, id: string) => api.post(`/${tenantId}/jobs/${id}/clone`),
  export: (tenantId: string, params?: Record<string, unknown>) => api.get(`/${tenantId}/jobs/export`, { params, responseType: 'blob' }),
  submitApproval: (tenantId: string, id: string, approverIds?: string[]) => api.post(`/${tenantId}/jobs/${id}/submit-approval`, { approverIds }),
  approve: (tenantId: string, id: string, comment?: string) => api.post(`/${tenantId}/jobs/${id}/approve`, { comment }),
  reject: (tenantId: string, id: string, reason: string) => api.post(`/${tenantId}/jobs/${id}/reject`, { reason }),
  publish: (tenantId: string, id: string, channels: string[]) => api.post(`/${tenantId}/jobs/${id}/publish`, { channels }),
};

// Candidates API
export const candidatesApi = {
  getAll: (params?: {
    page?: number;
    take?: number;
    skip?: number;
    search?: string;
    skills?: string[];
    location?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    status?: string;
    source?: string;
  }) => api.get('/candidates', { params }),
  getById: (id: string) => api.get(`/candidates/${id}`),
  getActivities: (id: string) => api.get(`/candidates/${id}/activities`),
  create: (data: Record<string, unknown>) => api.post('/candidates', data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/candidates/${id}`, data),
  delete: (id: string) => api.delete(`/candidates/${id}`),
  bulkDelete: (ids: string[]) => api.delete('/candidates/bulk', { data: { ids } }),
  addTags: (id: string, tags: string[]) => api.post(`/candidates/${id}/tags`, { tags }),
  export: (params?: {
    search?: string;
    skills?: string[];
    location?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => api.get('/candidates/export', { params, responseType: 'blob' }),
  sendBulkEmail: (data: { ids: string[]; subject: string; message: string }) =>
    api.post('/candidates/bulk-email', data),
  merge: (data: { primaryId: string; secondaryId: string }) =>
    api.post('/candidates/merge', data),
  createReferral: (data: Record<string, unknown>) => api.post('/candidates/referral', data),
  getMyReferrals: () => api.get('/candidates/referrals/my'),
  // Duplicate detection
  checkDuplicates: (data: { email?: string; phone?: string; firstName?: string; lastName?: string; excludeId?: string }) =>
    api.post('/candidates/check-duplicates', data),
  // GDPR consent
  updateGdprConsent: (id: string, data: { dataProcessingConsent: boolean; marketingConsent?: boolean; consentSource?: string }) =>
    api.patch(`/candidates/${id}/gdpr-consent`, data),
  anonymize: (id: string) => api.post(`/candidates/${id}/anonymize`),
};

// Skills API
export const skillsApi = {
  getAll: () => api.get('/reference/skills'),
  create: (data: { name: string; synonyms: string[]; category: string }) =>
    api.post('/reference/skills', data),
};

// Settings API


// Applications API
export const applicationsApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/applications', { params }),
  getByJob: (jobId: string, params?: Record<string, unknown>) =>
    api.get(`/applications/job/${jobId}`, { params }),
  getById: (id: string) => api.get(`/applications/${id}`),
  create: (data: Record<string, unknown>) => api.post('/applications', data),
  createPublic: (data: Record<string, unknown>) => api.post('/applications/public/apply', data),
  moveToStage: (id: string, stageId: string) =>
    api.patch(`/applications/${id}/stage`, { stageId }),
  updateStatus: (id: string, status: string, reason?: string) =>
    api.patch(`/applications/${id}/status`, { status, reason }),
  copyToJob: (applicationIds: string[], targetJobId: string) =>
    api.post('/applications/copy', { applicationIds, targetJobId }),
};

// Pipelines API
export const pipelinesApi = {
  getAll: () => api.get('/pipelines'),
  getById: (id: string) => api.get(`/pipelines/${id}`),
  create: (data: Record<string, unknown>) => api.post('/pipelines', data),
  createDefault: () => api.post('/pipelines/default'),
  update: (id: string, data: { name?: string; description?: string; isDefault?: boolean }) =>
    api.patch(`/pipelines/${id}`, data),
  delete: (id: string) => api.delete(`/pipelines/${id}`),
  addStage: (id: string, data: { name: string; color?: string; slaDays?: number }) =>
    api.post(`/pipelines/${id}/stages`, data),
  updateStage: (stageId: string, data: { name?: string; color?: string; slaDays?: number; isTerminal?: boolean }) =>
    api.patch(`/pipelines/stages/${stageId}`, data),
  removeStage: (stageId: string) => api.delete(`/pipelines/stages/${stageId}`),
  reorderStages: (id: string, stageIds: string[]) =>
    api.patch(`/pipelines/${id}/stages/reorder`, { stageIds }),
};

// User Preferences API
export const preferencesApi = {
  get: () => api.get('/users/me/preferences'),
  update: (data: { theme?: string; language?: string }) =>
    api.put('/users/me/preferences', data),
};

// Saved Views API
export const savedViewsApi = {
  getAll: (entity: string) => api.get('/saved-views', { params: { entity } }),
  getById: (id: string) => api.get(`/saved-views/${id}`),
  create: (data: { name: string; entity: string; filters: Record<string, unknown>; isShared?: boolean }) =>
    api.post('/saved-views', data),
  update: (id: string, data: { name?: string; filters?: Record<string, unknown>; isShared?: boolean }) =>
    api.patch(`/saved-views/${id}`, data),
  delete: (id: string) => api.delete(`/saved-views/${id}`),
};

// Users API
export const usersApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/users', { params }),
  create: (data: Record<string, unknown>) => api.post('/users', data),
  getAvailability: () => api.get('/users/me/availability'),
  updateAvailability: (slots: { dayOfWeek: number; startTime: string; endTime: string }[]) =>
    api.put('/users/me/availability', { slots }),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/users/${id}`, data),
  updateStatus: (id: string, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') => api.patch(`/users/${id}/status`, { status }),
  resendPassword: (id: string) => api.post(`/users/${id}/resend-password`),
  delete: (id: string) => api.delete(`/users/${id}`),
  getPendingActions: () => api.get('/users/me/actions'),
};

export const rolesApi = {
  getAll: () => api.get('/roles'),
  getById: (id: string) => api.get(`/roles/${id}`),
  create: (data: { name: string; description?: string; permissions: string[] }) =>
    api.post('/roles', data),
  update: (id: string, data: { name?: string; description?: string; permissions?: string[] }) =>
    api.patch(`/roles/${id}`, data),
  delete: (id: string) => api.delete(`/roles/${id}`),
};

export const analyticsApi = {
  getSummary: () => api.get('/analytics/summary'),
  getPipelineHealth: () => api.get('/analytics/pipeline'),
  getTimeToHire: () => api.get('/analytics/time-to-hire'),
  getRecentActivity: () => api.get('/analytics/recent-activity'),
  getHiringFunnel: (jobId?: string) => api.get('/analytics/hiring-funnel', { params: { jobId } }),
  getSourceEffectiveness: () => api.get('/analytics/source-effectiveness'),
};

export const reportsApi = {
  getCustomReport: (params: { startDate?: string; endDate?: string; jobId?: string; recruiterId?: string }) =>
    api.get('/reports/custom', { params }),
  exportCsv: (params: { startDate?: string; endDate?: string; jobId?: string; recruiterId?: string }) =>
    api.get('/reports/export/csv', { params, responseType: 'blob' }),
  // Enhanced analytics
  getDashboard: () => api.get('/reports/dashboard'),
  getHiringFunnel: (params?: { startDate?: string; endDate?: string; jobId?: string }) =>
    api.get('/reports/funnel', { params }),
  getTimeToHire: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/reports/time-to-hire', { params }),
  getSourceEffectiveness: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/reports/source-effectiveness', { params }),
  getRecruiterPerformance: (params?: { startDate?: string }) =>
    api.get('/reports/recruiter-performance', { params }),
};

// Offer Templates API
export const offerTemplatesApi = {
  getAll: () => api.get('/offer-templates'),
  getOne: (id: string) => api.get(`/offer-templates/${id}`),
  create: (data: { name: string; content: string }) => api.post('/offer-templates', data),
  update: (id: string, data: { name?: string; content?: string }) => api.patch(`/offer-templates/${id}`, data),
  delete: (id: string) => api.delete(`/offer-templates/${id}`),
};

// Offers API
export const offersApi = {
  getAll: () => api.get('/offers'),
  getOne: (id: string) => api.get(`/offers/${id}`),
  create: (data: any) => api.post('/offers', data),
  update: (id: string, data: any) => api.patch(`/offers/${id}`, data),
  submit: (id: string) => api.post(`/offers/${id}/submit`),
  approve: (id: string) => api.post(`/offers/${id}/approve`),
  reject: (id: string, reason: string) => api.post(`/offers/${id}/reject`, { reason }),
  send: (id: string) => api.post(`/offers/${id}/send`),
  delete: (id: string) => api.delete(`/offers/${id}`),
  // Public endpoints
  getPublic: (token: string) => api.get(`/offers/public/${token}`),
  accept: (token: string, signature: string) => api.post(`/offers/public/${token}/accept`, { signature }),
  decline: (token: string, reason: string) => api.post(`/offers/public/${token}/decline`, { reason }),
};

// AI API
// AI API
export const aiApi = {
  generateJd: (data: { title: string; department?: string; skills?: string[]; experience?: string; tone?: string }) =>
    api.post('/ai/generate-jd', data),

  checkBias: (data: { text: string }) =>
    api.post('/ai/check-bias', data),
  parseResume: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/ai/parse-resume', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  generateSubjectLines: (data: { context: string; candidateName?: string; jobTitle?: string; companyName?: string }) =>
    api.post('/ai/generate-subject-lines', data),
};

// SLA API
export const slaApi = {
  getApplicationSla: (applicationId: string) => api.get(`/sla/application/${applicationId}`),
  getAtRiskApplications: () => api.get('/sla/at-risk'),
  getJobSlaStats: (jobId: string) => api.get(`/sla/job/${jobId}/stats`),
  getAverageTimeInStage: (stageId: string) => api.get(`/sla/stage/${stageId}/average-time`),
  updateStageSla: (stageId: string, slaDays: number) =>
    api.patch(`/sla/stage/${stageId}/sla`, { slaDays }),
};

// Workflows API
export const workflowsApi = {
  getByStage: (stageId: string) => api.get(`/workflows/stage/${stageId}`),
  create: (data: any) => api.post('/workflows', data),
  update: (id: string, data: any) => api.put(`/workflows/${id}`, data),
  delete: (id: string) => api.delete(`/workflows/${id}`),
  toggle: (id: string, isActive: boolean) => api.patch(`/workflows/${id}/toggle`, { isActive }),
};

// Disposition API
export const dispositionApi = {
  getRejectionReasons: () => api.get('/disposition/reasons/rejection'),
  getWithdrawalReasons: () => api.get('/disposition/reasons/withdrawal'),
  recordDisposition: (data: {
    applicationId: string;
    type: 'REJECTION' | 'WITHDRAWAL';
    reason: string;
    notes?: string;
  }) => api.post('/disposition/record', data),
  getAnalytics: (params?: { jobId?: string; startDate?: string; endDate?: string }) =>
    api.get('/disposition/analytics', { params }),
};

// Settings API
export const settingsApi = {
  getAll: () => api.get('/settings'),
  getPublic: (tenantId: string) => api.get(`/settings/public/${tenantId}`),
  getByKey: (key: string) => api.get(`/settings/${key}`),
  update: (key: string, data: { value: any; category?: string; isPublic?: boolean }) =>
    api.put(`/settings/${key}`, data),
  getStatusColors: () => api.get('/settings/status-colors'),
  resetStatusColors: () => api.post('/settings/status-colors/reset'),
};
// Reference API
export const referenceApi = {
  getCurrencies: () => api.get('/reference/currencies'),
  getTimezones: () => api.get('/reference/timezones'),
  // Locations
  getLocations: () => api.get('/reference/locations'),
  createLocation: (data: { name: string; address?: string; city?: string; state?: string; country: string; timezone?: string }) =>
    api.post('/reference/locations', data),
  updateLocation: (id: string, data: Partial<{ name: string; address?: string; city?: string; state?: string; country: string; timezone?: string }>) =>
    api.patch(`/reference/locations/${id}`, data),
  deleteLocation: (id: string) => api.delete(`/reference/locations/${id}`),
  // Departments
  getDepartments: () => api.get('/reference/departments'),
  createDepartment: (data: { name: string; code?: string; parentId?: string }) =>
    api.post('/reference/departments', data),
  updateDepartment: (id: string, data: Partial<{ name: string; code?: string; parentId?: string }>) =>
    api.patch(`/reference/departments/${id}`, data),
  deleteDepartment: (id: string) => api.delete(`/reference/departments/${id}`),
};

// Storage API
export const storageApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/storage/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  uploadPublic: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/storage/upload/public', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Interviews API
export const interviewsApi = {
  getAll: (params?: {
    applicationId?: string;
    interviewerId?: string;
    candidateId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) => api.get('/interviews', { params }),
  getById: (id: string) => api.get(`/interviews/${id}`),
  create: (data: {
    applicationId: string;
    interviewerId: string;
    type: string;
    scheduledAt: string;
    duration: number;
    location?: string;
    meetingLink?: string;
    notes?: string;
  }) => api.post('/interviews', data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/interviews/${id}`, data),
  delete: (id: string) => api.delete(`/interviews/${id}`),

  // Feedback methods
  createFeedback: (data: {
    interviewId: string;
    rating: number;
    strengths?: string;
    weaknesses?: string;
    notes?: string;
    recommendation?: string;
    scores?: Record<string, number>;
  }) => api.post('/interviews/feedback', data),
  updateFeedback: (id: string, data: Record<string, unknown>) => api.patch(`/interviews/feedback/${id}`, data),
  getFeedback: (interviewId: string) => api.get(`/interviews/${interviewId}/feedback`),
};

// Onboarding API
export const onboardingApi = {
  create: (data: { applicationId: string }) => api.post('/onboarding/initialize', data),
  getAll: () => api.get('/onboarding'),
  getOne: (id: string) => api.get(`/onboarding/${id}`),
  updateTask: (taskId: string, data: { status: 'PENDING' | 'COMPLETED' }) => api.patch(`/onboarding/tasks/${taskId}`, data),
  uploadDocument: (taskId: string, fileUrl: string) => api.patch(`/onboarding/tasks/${taskId}/upload`, { fileUrl }),
  reviewDocument: (taskId: string, status: 'APPROVED' | 'REJECTED') => api.patch(`/onboarding/tasks/${taskId}/review`, { status }),
};

// Communication API
export const communicationApi = {
  sendEmail: (data: { to: string; subject: string; body: string; candidateId: string; cc?: string; bcc?: string }) =>
    api.post('/emails/send', data),
  getCandidateEmails: (candidateId: string) => api.get(`/emails/candidate/${candidateId}`),
  getThreads: () => api.get('/emails/threads'),
  // Email Templates
  getTemplates: () => api.get('/email-templates'),
  createTemplate: (data: { name: string; subject: string; body: string }) => api.post('/email-templates', data),
  updateTemplate: (id: string, data: Partial<{ name: string; subject: string; body: string }>) => api.patch(`/email-templates/${id}`, data),
  deleteTemplate: (id: string) => api.delete(`/email-templates/${id}`),
};

// Health API
export const healthApi = {
  getHealth: () => api.get('/health'),
  getDetailedHealth: () => api.get('/health/detailed'),
};

// Scorecard Templates API (Mapped to Settings Controller)
export const scorecardTemplatesApi = {
  getAll: () => api.get('/settings/scorecards/all'),
  getOne: (id: string) => api.get(`/settings/scorecards/${id}`),
  create: (data: { name: string; sections: any[]; isActive?: boolean }) => api.post('/settings/scorecards', data),
  update: (id: string, data: Partial<{ name: string; sections: any[]; isActive?: boolean }>) => api.patch(`/settings/scorecards/${id}`, data),
  delete: (id: string) => api.delete(`/settings/scorecards/${id}`),
};

// Calendar Integration API
export const calendarApi = {
  // Settings (admin configures OAuth credentials)
  getSettings: () => api.get('/calendar/settings'),
  saveGoogleConfig: (data: { clientId: string; clientSecret: string; redirectUri?: string }) =>
    api.post('/calendar/settings/google', data),
  saveOutlookConfig: (data: { clientId: string; clientSecret: string; redirectUri?: string; tenantId?: string }) =>
    api.post('/calendar/settings/outlook', data),
  // User connections
  getAuthUrl: (provider: 'GOOGLE' | 'OUTLOOK') => api.get(`/calendar/auth-url?provider=${provider}`),
  connect: (data: { provider: 'GOOGLE' | 'OUTLOOK'; code: string; redirectUri?: string }) => api.post('/calendar/connect', data),
  getConnections: () => api.get('/calendar/connections'),
  disconnect: (connectionId: string) => api.delete(`/calendar/connections/${connectionId}`),
  createEvent: (data: {
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    location?: string;
    meetingLink?: string;
    attendees?: string[];
    interviewId?: string;
    generateIcs?: boolean;
  }) => api.post('/calendar/events', data),
  updateEvent: (eventId: string, data: Partial<{
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    location: string;
    attendees: string[];
  }>) => api.put(`/calendar/events/${eventId}`, data),
  deleteEvent: (eventId: string) => api.delete(`/calendar/events/${eventId}`),
  getFreeBusy: (data: { userIds: string[]; startTime: string; endTime: string; durationMinutes?: number }) =>
    api.post('/calendar/free-busy', data),
  findCommonAvailability: (data: { userIds: string[]; startTime: string; endTime: string; durationMinutes?: number }) =>
    api.post('/calendar/common-availability', data),
  generateIcs: (data: { title: string; startTime: string; endTime: string; description?: string; location?: string; attendees?: string[] }) =>
    api.post('/calendar/generate-ics', data),
};

// BGV (Background Verification) API
export const bgvApi = {
  getSettings: () => api.get('/bgv/settings'),
  configure: (data: {
    provider: 'CHECKR' | 'SPRINGVERIFY' | 'AUTHBRIDGE' | 'MANUAL';
    apiKey: string;
    apiSecret?: string;
    webhookUrl?: string;
    sandboxMode?: boolean;
  }) => api.post('/bgv/configure', data),
  initiate: (data: { candidateId: string; applicationId?: string; packageType?: string; checkTypes?: string[] }) =>
    api.post('/bgv/initiate', data),
  getChecks: (params?: { status?: string; candidateId?: string }) => api.get('/bgv/checks', { params }),
  getCheck: (id: string) => api.get(`/bgv/checks/${id}`),
  syncStatus: (id: string) => api.post(`/bgv/checks/${id}/sync`),
  cancel: (id: string) => api.post(`/bgv/checks/${id}/cancel`),
  getPackages: () => api.get('/bgv/packages'),
  getDashboard: () => api.get('/bgv/dashboard'),
};

// SMS API
export const smsApi = {
  getSettings: () => api.get('/sms/settings'),
  configure: (data: {
    provider: 'TWILIO' | 'MSG91' | 'TEXTLOCAL';
    accountSid: string;
    authToken: string;
    fromNumber: string;
    webhookUrl?: string;
  }) => api.post('/sms/configure', data),
  send: (data: { to: string; body: string; candidateId?: string }) => api.post('/sms/send', data),
  sendBulk: (data: { recipients: { phone: string; body: string; candidateId?: string }[] }) =>
    api.post('/sms/send-bulk', data),
  getTemplates: () => api.get('/sms/templates'),
  saveTemplate: (data: { name: string; content: string }) => api.post('/sms/templates', data),
};


// E-Signature API
export const esignatureApi = {
  getAuthUrl: () => api.get('/esignature/auth-url'),
  configure: (data: {
    provider: 'DOCUSIGN' | 'ADOBE_SIGN' | 'ZOHO_SIGN';
    clientId: string;
    clientSecret: string;
    accountId?: string;
    baseUrl?: string;
  }) => api.post('/esignature/configure', data),
  connect: (data: { code: string; redirectUri?: string }) => api.post('/esignature/connect', data),
  getSettings: () => api.get('/esignature/settings'),
  sendForSignature: (data: {
    offerId: string;
    signers: { name: string; email: string; role?: string; order?: number }[];
    emailSubject?: string;
    emailMessage?: string;
    expirationDays?: number;
    sendReminders?: boolean;
  }) => api.post('/esignature/send', data),
  getEnvelopeStatus: (envelopeId: string) => api.get(`/esignature/envelopes/${envelopeId}`),
  getEmbeddedSigningUrl: (envelopeId: string, returnUrl: string) =>
    api.post(`/esignature/envelopes/${envelopeId}/embedded-signing`, { returnUrl }),
  voidEnvelope: (envelopeId: string, reason: string) =>
    api.put(`/esignature/envelopes/${envelopeId}/void`, { reason }),
};

// Notifications API
export const notificationsApi = {
  getAll: (params?: { read?: boolean; type?: string }) =>
    api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/count'),
  getPreferences: () => api.get('/notifications/preferences'),
  updatePreferences: (data: Record<string, boolean>) =>
    api.patch('/notifications/preferences', data),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.post('/notifications/read-all'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
  clearAll: () => api.delete('/notifications'),
};

// User Availability API
export const userAvailabilityApi = {
  get: () => api.get('/users/me/availability'),
  update: (data: {
    timezone?: string;
    slots?: { dayOfWeek: number; startTime: string; endTime: string }[];
    bufferMinutes?: number;
    maxMeetingsPerDay?: number;
  }) => api.put('/users/me/availability', data),
  getSlots: (date: string, duration?: number) =>
    api.get('/users/me/availability/slots', { params: { date, duration } }),
  blockDates: (dates: string[]) => api.post('/users/me/availability/block', { dates }),
  unblockDates: (dates: string[]) => api.post('/users/me/availability/unblock', { dates }),
  getUserAvailability: (userId: string) => api.get(`/users/${userId}/availability`),
  getUserSlots: (userId: string, date: string, duration?: number) =>
    api.get(`/users/${userId}/availability/slots`, { params: { date, duration } }),
};

// Application History & Timeline API
export const applicationHistoryApi = {
  getHistory: (applicationId: string) => api.get(`/applications/${applicationId}/history`),
  getStageTransitions: (applicationId: string) => api.get(`/applications/${applicationId}/stage-transitions`),
  getTimeline: (applicationId: string, params?: { categories?: string; limit?: number }) =>
    api.get(`/applications/${applicationId}/timeline`, { params }),
};

// Audit Logs API
export const auditLogsApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    action?: string;
    userId?: string;
    entityType?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }) => api.get('/audit-logs', { params }),
  getActions: () => api.get('/audit-logs/actions'),
  getStats: (days?: number) => api.get('/audit-logs/stats', { params: { days } }),
  export: (params?: { action?: string; userId?: string; startDate?: string; endDate?: string }) =>
    api.get('/audit-logs/export', { params, responseType: 'blob' }),
};

// Interview Panels API
export const interviewPanelsApi = {
  create: (jobId: string, data: {
    name: string;
    interviewerIds: string[];
    stageId?: string;
    interviewType?: string;
    isDefault?: boolean;
  }) => api.post(`/jobs/${jobId}/interview-panels`, data),
  getAll: (jobId: string) => api.get(`/jobs/${jobId}/interview-panels`),
  update: (jobId: string, panelId: string, data: {
    name?: string;
    interviewerIds?: string[];
    stageId?: string;
    interviewType?: string;
    isDefault?: boolean;
  }) => api.patch(`/jobs/${jobId}/interview-panels/${panelId}`, data),
  delete: (jobId: string, panelId: string) => api.delete(`/jobs/${jobId}/interview-panels/${panelId}`),
  getSuggestedInterviewers: (jobId: string, date?: string) =>
    api.get(`/jobs/${jobId}/interview-panels/suggested-interviewers`, { params: { date } }),
};

// Interview Feedback Summary API
export const interviewFeedbackApi = {
  getSummary: (applicationId: string) => api.get(`/interviews/feedback/application/${applicationId}/summary`),
  getComparison: (jobId: string, candidateIds?: string[]) =>
    api.get(`/interviews/feedback/job/${jobId}/comparison`, { params: { candidateIds: candidateIds?.join(',') } }),
  getPending: () => api.get('/interviews/feedback/pending'),
};

// Offer Negotiation API
export const offerNegotiationApi = {
  submitCounterOffer: (offerId: string, data: {
    requestedSalary?: number;
    requestedBonus?: number;
    requestedEquity?: string;
    requestedStartDate?: string;
    notes?: string;
  }) => api.post(`/offers/${offerId}/counter-offer`, data),
  respondToCounter: (offerId: string, data: {
    action: 'ACCEPT' | 'REJECT' | 'COUNTER';
    revisedSalary?: number;
    revisedBonus?: number;
    revisedEquity?: string;
    revisedStartDate?: string;
    notes?: string;
  }) => api.post(`/offers/${offerId}/respond-counter`, data),
  getNegotiationHistory: (offerId: string) => api.get(`/offers/${offerId}/negotiation-history`),
  getComparison: (offerId: string) => api.get(`/offers/${offerId}/comparison`),
};

// Candidate Import API
export const candidateImportApi = {
  import: (data: {
    csvData: string;
    skipDuplicates?: boolean;
    updateExisting?: boolean;
    jobId?: string;
    source?: string;
    tags?: string[];
  }) => api.post('/candidates/import', data),
  validate: (csvData: string) => api.post('/candidates/import/validate', { csvData }),
  getTemplate: () => api.get('/candidates/import/template', { responseType: 'blob' }),
};

// Candidate Comparison API
export const candidateComparisonApi = {
  compare: (candidateIds: string[]) =>
    api.post('/candidates/compare', { candidateIds }),
  compareJobCandidates: (jobId: string, limit?: number) =>
    api.get(`/candidates/compare/job/${jobId}`, { params: { limit } }),
  getSummary: (candidateIds: string[]) =>
    api.post('/candidates/compare/summary', { candidateIds }),
};

// Candidate Leaderboard API
export const candidateLeaderboardApi = {
  get: (jobId: string, params?: {
    sortBy?: 'composite' | 'matchScore' | 'rating' | 'skillMatch' | 'stageProgress';
    limit?: number;
    includeRejected?: boolean;
  }) => api.get(`/applications/job/${jobId}/leaderboard`, { params }),
  getTopCandidates: (limit?: number) => api.get('/applications/top-candidates', { params: { limit } }),
};

// Job Requisition API
export const jobRequisitionApi = {
  create: (tenantId: string, data: {
    title: string;
    departmentId?: string;
    locationId?: string;
    headcount: number;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    targetStartDate?: string;
    justification: string;
    budgetApproved?: boolean;
    salaryRange?: { min: number; max: number; currency: string };
    skills?: string[];
    employmentType?: string;
  }) => api.post(`/${tenantId}/jobs/requisitions`, data),
  getAll: (tenantId: string, params?: { status?: string; departmentId?: string; priority?: string }) =>
    api.get(`/${tenantId}/jobs/requisitions`, { params }),
  getStats: (tenantId: string) => api.get(`/${tenantId}/jobs/requisitions/stats`),
  approve: (tenantId: string, requisitionId: string, notes?: string) =>
    api.post(`/${tenantId}/jobs/requisitions/${requisitionId}/approve`, { notes }),
  reject: (tenantId: string, requisitionId: string, notes?: string) =>
    api.post(`/${tenantId}/jobs/requisitions/${requisitionId}/reject`, { notes }),
  convert: (tenantId: string, requisitionId: string, additionalData?: Record<string, unknown>) =>
    api.post(`/${tenantId}/jobs/requisitions/${requisitionId}/convert`, additionalData),
};

// Talent Pools API
export const talentPoolsApi = {
  create: (data: {
    name: string;
    description?: string;
    criteria?: { skills?: string[]; locations?: string[]; experience?: { min?: number; max?: number }; sources?: string[] };
    isPublic?: boolean;
  }) => api.post('/talent-pools', data),
  getAll: () => api.get('/talent-pools'),
  getStats: () => api.get('/talent-pools/stats'),
  getById: (id: string) => api.get(`/talent-pools/${id}`),
  update: (id: string, data: {
    name?: string;
    description?: string;
    criteria?: { skills?: string[]; locations?: string[]; experience?: { min?: number; max?: number }; sources?: string[] };
    isPublic?: boolean;
  }) => api.put(`/talent-pools/${id}`, data),
  addCandidates: (id: string, candidateIds: string[]) => api.post(`/talent-pools/${id}/candidates`, { candidateIds }),
  removeCandidates: (id: string, candidateIds: string[]) => api.delete(`/talent-pools/${id}/candidates`, { data: { candidateIds } }),
  searchCandidates: (id: string, query?: string) => api.get(`/talent-pools/${id}/search-candidates`, { params: { q: query } }),
  delete: (id: string) => api.delete(`/talent-pools/${id}`),
};

// Interview Questions API
export const interviewQuestionsApi = {
  create: (data: {
    question: string;
    category: string;
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
    expectedAnswer?: string;
    skills?: string[];
    timeMinutes?: number;
  }) => api.post('/interview-questions', data),
  getAll: (params?: { category?: string; difficulty?: string; skills?: string }) =>
    api.get('/interview-questions', { params }),
  getCategories: () => api.get('/interview-questions/categories'),
  getById: (id: string) => api.get(`/interview-questions/${id}`),
  update: (id: string, data: {
    question?: string;
    category?: string;
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
    expectedAnswer?: string;
    skills?: string[];
    timeMinutes?: number;
  }) => api.put(`/interview-questions/${id}`, data),
  delete: (id: string) => api.delete(`/interview-questions/${id}`),
  generateForJob: (jobId: string, count?: number) => api.post('/interview-questions/generate', { jobId, count }),
};

// Candidate Notes API
export const candidateNotesApi = {
  create: (candidateId: string, data: { content: string; isPrivate?: boolean; mentionedUserIds?: string[] }) =>
    api.post(`/candidates/${candidateId}/notes`, data),
  getAll: (candidateId: string) => api.get(`/candidates/${candidateId}/notes`),
  update: (candidateId: string, noteId: string, data: { content?: string; isPrivate?: boolean }) =>
    api.put(`/candidates/${candidateId}/notes/${noteId}`, data),
  delete: (candidateId: string, noteId: string) => api.delete(`/candidates/${candidateId}/notes/${noteId}`),
  pin: (candidateId: string, noteId: string) => api.post(`/candidates/${candidateId}/notes/${noteId}/pin`),
  unpin: (candidateId: string, noteId: string) => api.post(`/candidates/${candidateId}/notes/${noteId}/unpin`),
};

// Skill Assessments API
export const skillAssessmentsApi = {
  create: (data: {
    name: string;
    description?: string;
    skills: string[];
    duration?: number;
    passingScore?: number;
    questions?: { question: string; options?: string[]; correctAnswer?: string; points?: number }[];
  }) => api.post('/skill-assessments', data),
  getAll: () => api.get('/skill-assessments'),
  getById: (id: string) => api.get(`/skill-assessments/${id}`),
  update: (id: string, data: Record<string, unknown>) => api.put(`/skill-assessments/${id}`, data),
  delete: (id: string) => api.delete(`/skill-assessments/${id}`),
  sendToCandidate: (assessmentId: string, candidateId: string, applicationId?: string) =>
    api.post(`/skill-assessments/${assessmentId}/send`, { candidateId, applicationId }),
  getResults: (assessmentId: string, candidateId: string) =>
    api.get(`/skill-assessments/${assessmentId}/results/${candidateId}`),
  submitResults: (assessmentId: string, data: { candidateId: string; answers: Record<string, string>; timeTaken?: number }) =>
    api.post(`/skill-assessments/${assessmentId}/submit`, data),
};

// Bulk Email Campaigns API
export const bulkEmailApi = {
  create: (data: {
    name: string;
    subject: string;
    body: string;
    recipientType: 'candidates' | 'talent_pool' | 'custom';
    recipientIds?: string[];
    talentPoolId?: string;
    filters?: Record<string, unknown>;
    scheduledAt?: string;
  }) => api.post('/bulk-email/campaigns', data),
  getAll: () => api.get('/bulk-email/campaigns'),
  getById: (id: string) => api.get(`/bulk-email/campaigns/${id}`),
  send: (id: string) => api.post(`/bulk-email/campaigns/${id}/send`),
  cancel: (id: string) => api.post(`/bulk-email/campaigns/${id}/cancel`),
  getStats: (id: string) => api.get(`/bulk-email/campaigns/${id}/stats`),
  preview: (data: { subject: string; body: string; sampleCandidateId?: string }) =>
    api.post('/bulk-email/preview', data),
};

// Hiring Team API
export const hiringTeamApi = {
  addMember: (jobId: string, data: {
    userId: string;
    role: 'HIRING_MANAGER' | 'RECRUITER' | 'INTERVIEWER' | 'COORDINATOR' | 'APPROVER' | 'OBSERVER';
    permissions?: {
      canViewCandidates?: boolean;
      canEditCandidates?: boolean;
      canScheduleInterviews?: boolean;
      canProvideFeedback?: boolean;
      canMakeOffers?: boolean;
      canApprove?: boolean;
    };
  }) => api.post(`/jobs/${jobId}/team`, data),
  getMembers: (jobId: string) => api.get(`/jobs/${jobId}/team`),
  updateMember: (jobId: string, memberId: string, data: {
    role?: 'HIRING_MANAGER' | 'RECRUITER' | 'INTERVIEWER' | 'COORDINATOR' | 'APPROVER' | 'OBSERVER';
    permissions?: Record<string, boolean>;
  }) => api.put(`/jobs/${jobId}/team/${memberId}`, data),
  removeMember: (jobId: string, memberId: string) => api.delete(`/jobs/${jobId}/team/${memberId}`),
  getMyJobs: () => api.get('/users/me/hiring-teams'),
};

// Advanced Candidate Search API
export const candidateSearchApi = {
  search: (params: {
    query?: string;
    skills?: string[];
    skillsMatch?: 'ALL' | 'ANY';
    locations?: string[];
    experience?: { min?: number; max?: number };
    companies?: string[];
    titles?: string[];
    sources?: string[];
    tags?: string[];
    createdAfter?: string;
    createdBefore?: string;
    hasApplications?: boolean;
    applicationStatus?: string[];
    excludeJobIds?: string[];
    sortBy?: 'relevance' | 'createdAt' | 'updatedAt' | 'name';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) => api.post('/candidates/search', params),
  getSuggestions: (query: string, field?: string) =>
    api.get('/candidates/search/suggestions', { params: { q: query, field } }),
  saveSearch: (name: string, query: Record<string, unknown>) =>
    api.post('/candidates/search/save', { name, query }),
  getSavedSearches: () => api.get('/candidates/search/saved'),
};

// Job Templates API
export const jobTemplatesApi = {
  create: (data: {
    name: string;
    title: string;
    description: string;
    requirements?: string;
    responsibilities?: string;
    benefits?: string;
    employmentType?: string;
    skills?: string[];
  }) => api.post('/job-templates', data),
  getAll: (includeInactive?: boolean) =>
    api.get('/job-templates', { params: { includeInactive } }),
  getById: (id: string) => api.get(`/job-templates/${id}`),
  update: (id: string, data: Record<string, unknown>) => api.put(`/job-templates/${id}`, data),
  delete: (id: string) => api.delete(`/job-templates/${id}`),
  duplicate: (id: string, name: string) => api.post(`/job-templates/${id}/duplicate`, { name }),
  createJob: (id: string, overrides?: {
    title?: string;
    description?: string;
    departmentId?: string;
    locationId?: string;
    hiringManagerId?: string;
    pipelineId?: string;
  }) => api.post(`/job-templates/${id}/create-job`, overrides),
  getStats: () => api.get('/job-templates/stats'),
};

// Interview Kits API
export const interviewKitsApi = {
  create: (data: {
    name: string;
    description?: string;
    interviewType: string;
    duration?: number;
    questions?: {
      question: string;
      category: string;
      expectedAnswer?: string;
      duration?: number;
    }[];
    scorecard?: {
      name: string;
      criteria: { name: string; weight: number; description?: string }[];
    };
    tips?: string[];
    resources?: { title: string; url: string }[];
  }) => api.post('/interview-kits', data),
  getAll: (interviewType?: string) =>
    api.get('/interview-kits', { params: { interviewType } }),
  getById: (id: string) => api.get(`/interview-kits/${id}`),
  update: (id: string, data: Record<string, unknown>) => api.put(`/interview-kits/${id}`, data),
  delete: (id: string) => api.delete(`/interview-kits/${id}`),
  duplicate: (id: string, name: string) => api.post(`/interview-kits/${id}/duplicate`, { name }),
  getInterviewTypes: () => api.get('/interview-kits/types'),
  assignToInterview: (kitId: string, interviewId: string) =>
    api.post(`/interview-kits/${kitId}/assign/${interviewId}`),
};

// Departments API
export const departmentsApi = {
  create: (data: { name: string; code?: string; parentId?: string }) =>
    api.post('/departments', data),
  getAll: (hierarchy?: boolean) =>
    api.get('/departments', { params: { hierarchy } }),
  getById: (id: string) => api.get(`/departments/${id}`),
  update: (id: string, data: { name?: string; code?: string; parentId?: string }) =>
    api.put(`/departments/${id}`, data),
  delete: (id: string) => api.delete(`/departments/${id}`),
  getStats: () => api.get('/departments/stats'),
  moveUsers: (fromId: string, toId: string, userIds: string[]) =>
    api.post(`/departments/${fromId}/move-users`, { toDepartmentId: toId, userIds }),
};

// Referrals API
export const referralsApi = {
  create: (data: { candidateId: string; jobId?: string; notes?: string }) =>
    api.post('/referrals', data),
  getMyReferrals: () => api.get('/referrals/my'),
  getMyStats: () => api.get('/referrals/my/stats'),
  getAll: (filters?: { status?: string; referrerId?: string }) =>
    api.get('/referrals', { params: filters }),
  getStats: (userId?: string) => api.get('/referrals/stats', { params: { userId } }),
  getLeaderboard: (limit?: number) => api.get('/referrals/leaderboard', { params: { limit } }),
  updateStatus: (id: string, status: 'PENDING' | 'INTERVIEWED' | 'HIRED' | 'REJECTED') =>
    api.patch(`/referrals/${id}/status`, { status }),
  markBonusPaid: (id: string) => api.post(`/referrals/${id}/pay-bonus`),
  getBonusConfig: () => api.get('/referrals/config'),
  setBonusConfig: (config: { hiredBonus: number; interviewBonus?: number; currency: string }) =>
    api.post('/referrals/config', config),
};

// Candidate Activity API
export const candidateActivityApi = {
  getTimeline: (candidateId: string, params?: { limit?: number; offset?: number; types?: string }) =>
    api.get(`/candidates/${candidateId}/activity`, { params }),
  getSummary: (candidateId: string) => api.get(`/candidates/${candidateId}/activity/summary`),
  getActivityTypes: () => api.get('/candidates/activity/types'),
};

// Email Sequences API
export const emailSequencesApi = {
  create: (data: {
    name: string;
    description?: string;
    triggerType: 'MANUAL' | 'APPLICATION_CREATED' | 'STAGE_ENTERED' | 'OFFER_SENT';
    triggerStageId?: string;
    steps: { subject: string; body: string; delayDays: number; delayHours: number }[];
  }) => api.post('/email-sequences', data),
  getAll: () => api.get('/email-sequences'),
  getById: (id: string) => api.get(`/email-sequences/${id}`),
  update: (id: string, data: Record<string, unknown>) => api.put(`/email-sequences/${id}`, data),
  delete: (id: string) => api.delete(`/email-sequences/${id}`),
  enrollCandidate: (sequenceId: string, candidateId: string) =>
    api.post(`/email-sequences/${sequenceId}/enroll/${candidateId}`),
  unenrollCandidate: (sequenceId: string, candidateId: string) =>
    api.delete(`/email-sequences/${sequenceId}/enroll/${candidateId}`),
  getCandidateEnrollments: (candidateId: string) =>
    api.get(`/email-sequences/candidate/${candidateId}/enrollments`),
};

// Bulk Actions API
export const bulkActionsApi = {
  moveStage: (applicationIds: string[], targetStageId: string) =>
    api.post('/applications/bulk/move-stage', { applicationIds, targetStageId }),
  updateStatus: (applicationIds: string[], status: 'REJECTED' | 'WITHDRAWN', reason?: string) =>
    api.post('/applications/bulk/update-status', { applicationIds, status, reason }),
  assign: (applicationIds: string[], assigneeId: string) =>
    api.post('/applications/bulk/assign', { applicationIds, assigneeId }),
  addTags: (applicationIds: string[], tags: string[]) =>
    api.post('/applications/bulk/add-tags', { applicationIds, tags }),
  sendEmail: (applicationIds: string[], subject: string, body: string) =>
    api.post('/applications/bulk/send-email', { applicationIds, subject, body }),
};

// Interview Scheduling API
export const interviewSchedulingApi = {
  createLink: (data: {
    applicationId: string;
    interviewerIds: string[];
    duration: number;
    interviewType: string;
    expiresInDays?: number;
    instructions?: string;
  }) => api.post('/interview-scheduling/links', data),
  getLinks: (status?: string) => api.get('/interview-scheduling/links', { params: { status } }),
  cancelLink: (token: string) => api.delete(`/interview-scheduling/links/${token}`),
};

// Public Scheduling API (for candidates)
export const publicSchedulingApi = {
  getLinkDetails: (token: string) => api.get(`/schedule/${token}`),
  getAvailableSlots: (token: string, startDate: string, endDate: string) =>
    api.get(`/schedule/${token}/slots`, { params: { startDate, endDate } }),
  bookSlot: (token: string, data: { start: string; interviewerId: string }) =>
    api.post(`/schedule/${token}/book`, data),
};

// ==================== INTEGRATIONS ====================

// Job Boards API
export const jobBoardsApi = {
  getSettings: () => api.get('/integrations/job-boards'),
  getAvailable: () => api.get('/integrations/job-boards/available'),
  configure: (data: { provider: string; apiKey: string; apiSecret?: string; companyId?: string }) =>
    api.post('/integrations/job-boards/configure', data),
  disconnect: (provider: string) => api.delete(`/integrations/job-boards/${provider}`),
  postJob: (jobId: string, providers?: string[]) =>
    api.post(`/integrations/job-boards/post/${jobId}`, { providers }),
};

// LinkedIn Apply API
export const linkedInApplyApi = {
  getConfig: () => api.get('/integrations/linkedin/config'),
  configure: (data: { clientId: string; clientSecret: string; redirectUri: string }) =>
    api.post('/integrations/linkedin/configure', data),
  getOAuthUrl: (jobId: string, tenantId: string) =>
    api.get(`/integrations/linkedin/oauth-url/${jobId}`, { params: { tenantId } }),
  getButtonConfig: (jobId: string, tenantId: string) =>
    api.get(`/integrations/linkedin/button-config/${jobId}`, { params: { tenantId } }),
};

// Indeed Feed API
export const indeedFeedApi = {
  getConfig: () => api.get('/integrations/indeed/config'),
  configure: (data: { publisherId: string; companyName: string; includeDescription?: boolean; includeSalary?: boolean }) =>
    api.post('/integrations/indeed/configure', data),
  validateFeed: () => api.get('/integrations/indeed/validate'),
  getFeedUrl: (tenantId: string) => `/api/integrations/indeed/feed/${tenantId}`,
};

// ZipRecruiter API
export const zipRecruiterApi = {
  getConfig: () => api.get('/integrations/ziprecruiter/config'),
  configure: (data: { apiKey: string; publisherId: string; sandboxMode?: boolean }) =>
    api.post('/integrations/ziprecruiter/configure', data),
  postJob: (jobId: string) => api.post(`/integrations/ziprecruiter/post/${jobId}`),
  removeJob: (externalId: string) => api.delete(`/integrations/ziprecruiter/job/${externalId}`),
  getStats: (externalId: string) => api.get(`/integrations/ziprecruiter/stats/${externalId}`),
  syncAll: () => api.post('/integrations/ziprecruiter/sync-all'),
};

// HRIS Sync API
export const hrisApi = {
  getConfig: () => api.get('/integrations/hris/config'),
  getProviders: () => api.get('/integrations/hris/providers'),
  configure: (data: {
    provider: string;
    apiKey?: string;
    apiSecret?: string;
    subdomain?: string;
    syncEnabled?: boolean;
    syncDirection?: 'IMPORT' | 'EXPORT' | 'BIDIRECTIONAL';
    syncFrequency?: 'HOURLY' | 'DAILY' | 'WEEKLY';
  }) => api.post('/integrations/hris/configure', data),
  disconnect: () => api.delete('/integrations/hris'),
  syncEmployees: () => api.post('/integrations/hris/sync'),
  exportHires: () => api.post('/integrations/hris/export-hires'),
  testConnection: () => api.get('/integrations/hris/test'),
  getFieldMappings: () => api.get('/integrations/hris/field-mappings'),
  updateFieldMappings: (mappings: Record<string, string>) =>
    api.put('/integrations/hris/field-mappings', { mappings }),
  getSyncHistory: (limit?: number) => api.get('/integrations/hris/sync-history', { params: { limit } }),
};

// Slack/Teams Messaging API
export const messagingApi = {
  // Slack
  getSlackConfig: () => api.get('/integrations/messaging/slack/config'),
  configureSlack: (data: {
    botToken: string;
    signingSecret: string;
    defaultChannelId?: string;
    notificationChannels?: Record<string, string>;
  }) => api.post('/integrations/messaging/slack/configure', data),
  getSlackChannels: () => api.get('/integrations/messaging/slack/channels'),
  testSlack: () => api.get('/integrations/messaging/slack/test'),
  // Teams
  getTeamsConfig: () => api.get('/integrations/messaging/teams/config'),
  configureTeams: (data: { webhookUrl: string; notificationChannels?: Record<string, string> }) =>
    api.post('/integrations/messaging/teams/configure', data),
  testTeams: () => api.get('/integrations/messaging/teams/test'),
  // Unified
  disconnectAll: () => api.delete('/integrations/messaging'),
  sendTestNotification: () => api.post('/integrations/messaging/test-notification'),
};

// Webhooks API
export const webhooksApi = {
  getAll: () => api.get('/integrations/webhooks'),
  getEvents: () => api.get('/integrations/webhooks/events'),
  getOne: (id: string) => api.get(`/integrations/webhooks/${id}`),
  create: (data: { name: string; url: string; events: string[]; headers?: Record<string, string> }) =>
    api.post('/integrations/webhooks', data),
  update: (id: string, data: { name?: string; url?: string; events?: string[]; isActive?: boolean }) =>
    api.put(`/integrations/webhooks/${id}`, data),
  delete: (id: string) => api.delete(`/integrations/webhooks/${id}`),
  regenerateSecret: (id: string) => api.post(`/integrations/webhooks/${id}/regenerate-secret`),
  test: (id: string) => api.post(`/integrations/webhooks/${id}/test`),
  getDeliveries: (id: string, limit?: number) =>
    api.get(`/integrations/webhooks/${id}/deliveries`, { params: { limit } }),
};

// ==================== CAREER SITE ====================

// Career Site Admin API
export const careerSiteApi = {
  getConfig: () => api.get('/career-site/admin/config'),
  updateConfig: (data: any) => api.put('/career-site/admin/config', data),
  updateBranding: (data: any) => api.put('/career-site/admin/branding', data),
  updateLayout: (data: any) => api.put('/career-site/admin/layout', data),
  updateCompanyInfo: (data: any) => api.put('/career-site/admin/company-info', data),
  updateSeo: (data: any) => api.put('/career-site/admin/seo', data),
  updateCustomCode: (data: any) => api.put('/career-site/admin/custom-code', data),
  // Pages
  addPage: (data: { title: string; slug: string; content: string }) =>
    api.post('/career-site/admin/pages', data),
  updatePage: (pageId: string, data: any) => api.put(`/career-site/admin/pages/${pageId}`, data),
  deletePage: (pageId: string) => api.delete(`/career-site/admin/pages/${pageId}`),
  // Testimonials
  addTestimonial: (data: { name: string; role: string; image?: string; quote: string }) =>
    api.post('/career-site/admin/testimonials', data),
  deleteTestimonial: (id: string) => api.delete(`/career-site/admin/testimonials/${id}`),
  // Preview
  getPreviewUrl: () => api.get('/career-site/admin/preview-url'),
};

// Custom Domain API
export const customDomainApi = {
  getStatus: () => api.get('/career-site/domain/status'),
  setSubdomain: (subdomain: string) => api.post('/career-site/domain/subdomain', { subdomain }),
  addCustomDomain: (domain: string) => api.post('/career-site/domain/custom', { domain }),
  verifyDomain: () => api.post('/career-site/domain/verify'),
  removeDomain: () => api.delete('/career-site/domain/custom'),
  getDnsInstructions: () => api.get('/career-site/domain/dns-instructions'),
};

// Application Form API
export const applicationFormApi = {
  getConfig: () => api.get('/career-site/application-form/config'),
  updateConfig: (data: any) => api.put('/career-site/application-form/config', data),
  getFieldTypes: () => api.get('/career-site/application-form/field-types'),
  // Custom fields
  addField: (data: any) => api.post('/career-site/application-form/fields', data),
  updateField: (fieldId: string, data: any) => api.put(`/career-site/application-form/fields/${fieldId}`, data),
  deleteField: (fieldId: string) => api.delete(`/career-site/application-form/fields/${fieldId}`),
  reorderFields: (fieldIds: string[]) => api.put('/career-site/application-form/fields/reorder', { fieldIds }),
  // Job-specific form
  getJobForm: (jobId: string) => api.get(`/career-site/application-form/job/${jobId}`),
  setJobForm: (jobId: string, data: any) => api.put(`/career-site/application-form/job/${jobId}`, data),
  addScreeningQuestion: (jobId: string, data: any) =>
    api.post(`/career-site/application-form/job/${jobId}/screening-questions`, data),
};

// Public Career Site API (for candidates)
export const publicCareerSiteApi = {
  getCareerSite: (tenantId: string) => api.get(`/careers/${tenantId}`),
  getJobs: (tenantId: string, params?: {
    search?: string;
    department?: string;
    location?: string;
    employmentType?: string;
    workLocation?: string;
    page?: number;
    limit?: number;
  }) => api.get(`/careers/${tenantId}/jobs`, { params }),
  getJob: (tenantId: string, jobId: string) => api.get(`/careers/${tenantId}/jobs/${jobId}`),
  getApplicationForm: (tenantId: string, jobId: string) =>
    api.get(`/careers/${tenantId}/jobs/${jobId}/application-form`),
  validateApplication: (tenantId: string, jobId: string, data: Record<string, any>) =>
    api.post(`/careers/${tenantId}/jobs/${jobId}/validate`, data),
};

// ==================== BULK IMPORT ====================

export const bulkImportApi = {
  // Candidate import
  getCandidateFields: () => api.get('/bulk-import/candidates/fields'),
  getCandidateTemplate: () => api.get('/bulk-import/candidates/template'),
  previewCandidates: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/bulk-import/candidates/preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  importCandidates: (file: File, mappings: any[], options?: {
    skipDuplicates?: boolean;
    updateExisting?: boolean;
    defaultSource?: string;
    defaultTags?: string[];
  }) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mappings', JSON.stringify(mappings));
    if (options?.skipDuplicates) formData.append('skipDuplicates', 'true');
    if (options?.updateExisting) formData.append('updateExisting', 'true');
    if (options?.defaultSource) formData.append('defaultSource', options.defaultSource);
    if (options?.defaultTags) formData.append('defaultTags', JSON.stringify(options.defaultTags));
    return api.post('/bulk-import/candidates/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  // Job import
  getJobFields: () => api.get('/bulk-import/jobs/fields'),
  getJobTemplate: () => api.get('/bulk-import/jobs/template'),
  previewJobs: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/bulk-import/jobs/preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  importJobs: (file: File, mappings: any[], options?: {
    defaultStatus?: string;
    defaultPipelineId?: string;
  }) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mappings', JSON.stringify(mappings));
    if (options?.defaultStatus) formData.append('defaultStatus', options.defaultStatus);
    if (options?.defaultPipelineId) formData.append('defaultPipelineId', options.defaultPipelineId);
    return api.post('/bulk-import/jobs/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  // History
  getHistory: (limit?: number) => api.get('/bulk-import/history', { params: { limit } }),
};

// ==================== CUSTOM REPORTS ====================

export const customReportsApi = {
  getColumns: (entityType: string) => api.get(`/custom-reports/columns/${entityType}`),
  getFilterOperators: (fieldType: string) => api.get(`/custom-reports/filter-operators/${fieldType}`),
  getDatePresets: () => api.get('/custom-reports/date-presets'),
  executeReport: (definition: any) => api.post('/custom-reports/execute', definition),
  exportReport: (definition: any) => api.post('/custom-reports/export', definition, { responseType: 'blob' }),
  getSavedReports: () => api.get('/custom-reports/saved'),
  saveReport: (report: { name: string; description?: string; definition: any; isPublic?: boolean }) =>
    api.post('/custom-reports/saved', report),
  deleteReport: (id: string) => api.delete(`/custom-reports/saved/${id}`),
};

// ==================== CANDIDATE SOURCING ====================

export const sourcingApi = {
  // Sourced Candidates CRUD
  create: (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    currentTitle?: string;
    currentCompany?: string;
    location?: string;
    skills?: string[];
    experience?: string;
    profileUrl?: string;
    linkedinUrl?: string;
    resumeUrl?: string;
    summary?: string;
    source?: string;
    sourceDetails?: string;
    rating?: number;
    notes?: string;
    targetJobId?: string;
  }) => api.post('/sourcing', data),

  getAll: (params?: {
    search?: string;
    status?: string;
    source?: string;
    skills?: string[];
    location?: string;
    page?: number;
    take?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => api.get('/sourcing', { params }),

  getById: (id: string) => api.get(`/sourcing/${id}`),

  update: (id: string, data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    currentTitle?: string;
    currentCompany?: string;
    location?: string;
    skills?: string[];
    experience?: string;
    profileUrl?: string;
    linkedinUrl?: string;
    resumeUrl?: string;
    summary?: string;
    status?: string;
    rating?: number;
    notes?: string;
  }) => api.put(`/sourcing/${id}`, data),

  delete: (id: string) => api.delete(`/sourcing/${id}`),

  // Statistics
  getStats: () => api.get('/sourcing/stats'),

  // Channels and statuses
  getChannels: () => api.get('/sourcing/channels'),

  // Suggested candidates for a job
  getSuggestedCandidates: (jobId: string) => api.get(`/sourcing/suggested/${jobId}`),

  // Outreach
  recordOutreach: (data: {
    sourcedCandidateId: string;
    type: 'EMAIL' | 'LINKEDIN' | 'PHONE' | 'OTHER';
    subject?: string;
    message?: string;
    notes?: string;
  }) => api.post('/sourcing/outreach', data),

  bulkOutreach: (data: {
    sourcedCandidateIds: string[];
    subject: string;
    message: string;
    templateId?: string;
  }) => api.post('/sourcing/bulk-outreach', data),

  // Pipeline
  addToPipeline: (data: {
    sourcedCandidateId: string;
    jobId: string;
    coverLetter?: string;
  }) => api.post('/sourcing/add-to-pipeline', data),
};

// ==================== AUDIT LOGS ====================

export const auditLogApi = {
  getActionTypes: () => api.get('/audit-logs/action-types'),
  getLogs: (params?: {
    action?: string;
    userId?: string;
    applicationId?: string;
    candidateId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => api.get('/audit-logs', { params }),
  getStats: (startDate?: string, endDate?: string) =>
    api.get('/audit-logs/stats', { params: { startDate, endDate } }),
  getLog: (id: string) => api.get(`/audit-logs/${id}`),
  exportLogs: (params?: { action?: string; startDate?: string; endDate?: string }) =>
    api.get('/audit-logs/export', { params, responseType: 'blob' }),
};

