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
  getWorkflowsByStage: (stageId: string) => api.get(`/workflows/stage/${stageId}`),
  createWorkflow: (data: Record<string, any>) => api.post('/workflows', data),
  updateWorkflow: (id: string, data: Record<string, any>) => api.put(`/workflows/${id}`, data),
  deleteWorkflow: (id: string) => api.delete(`/workflows/${id}`),
  toggleWorkflow: (id: string, isActive: boolean) =>
    api.patch(`/workflows/${id}/toggle`, { isActive }),
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

// Job Boards API
export const jobBoardsApi = {
  getSettings: () => api.get('/job-boards/settings'),
  getProviderSettings: (provider: string) => api.get(`/job-boards/settings/${provider}`),
  configure: (data: {
    provider: 'LINKEDIN' | 'INDEED' | 'ZIPRECRUITER' | 'GLASSDOOR' | 'MONSTER';
    apiKey: string;
    apiSecret?: string;
    companyId?: string;
    sandboxMode?: boolean;
  }) => api.post('/job-boards/configure', data),
  disconnect: (provider: string) => api.delete(`/job-boards/settings/${provider}`),
  postJob: (data: { jobId: string; providers?: string[] }) => api.post('/job-boards/post-job', data),
  getJobPostings: (jobId: string) => api.get(`/job-boards/postings/${jobId}`),
  removePosting: (postingId: string) => api.delete(`/job-boards/postings/${postingId}`),
  getAvailableBoards: () => api.get('/job-boards/available'),
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
