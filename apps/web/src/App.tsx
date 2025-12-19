import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/auth';
import { InboxPage } from './pages/communication/InboxPage';
import { ErrorBoundary } from './components/ErrorBoundary';

// Layouts
import { DashboardLayout } from './layouts/DashboardLayout';
import { AuthLayout } from './layouts/AuthLayout';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { VerifyEmailPage } from './pages/auth//VerifyEmailPage';
import { OtpLoginPage } from './pages/auth/OtpLoginPage';
import { MfaVerifyPage } from './pages/auth/MfaVerifyPage';
import { MfaSetupPage } from './pages/auth/MfaSetupPage';
import { MfaOnboardingPage } from './pages/auth/MfaOnboardingPage';
import { ChangePasswordPage } from './pages/auth/ChangePasswordPage';

// Dashboard Pages
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { JobsPage } from './pages/jobs/JobsPage';
import { CreateJobPage } from './pages/jobs/CreateJobPage';
import { EditJobPage } from './pages/jobs/EditJobPage';
import { JobDetailPage } from './pages/jobs/JobDetailPage';
import { CandidatesPage } from './pages/candidates/CandidatesPage';
import { AddCandidatePage } from './pages/candidates/AddCandidatePage';
import { CandidateDetailPage } from './pages/candidates/CandidateDetailPage';
import { EditCandidatePage } from './pages/candidates/EditCandidatePage';
import { PipelinePage } from './pages/pipeline/PipelinePage';
import { UnsavedChangesProvider } from './contexts/UnsavedChangesContext';
import { ConfirmationProvider } from './contexts/ConfirmationContext';
import { StatusColorProvider } from './contexts/StatusColorContext';
import { PublicJobPage } from './pages/careers/PublicJobPage';
import { PublicCareerSite } from './pages/public/PublicCareerSite';
import { PublicJobDetails } from './pages/public/PublicJobDetails';
import { JobApplicationPage } from './pages/public/JobApplicationPage';
import { InterviewSchedulePage } from './pages/public/InterviewSchedulePage';
import { ReferralsPage } from './pages/referrals/ReferralsPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { CalendarPage } from './pages/interviews/CalendarPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { OfferTemplatesPage } from './pages/offers/templates/OfferTemplatesPage';
import { OfferTemplateEditor } from './pages/offers/templates/OfferTemplateEditor';
import { JobDescriptionTemplateEditor } from './pages/templates/JobDescriptionTemplateEditor';
import { EmailTemplateEditor } from './pages/templates/EmailTemplateEditor';
import { OnboardingTemplateEditor } from './pages/templates/OnboardingTemplateEditor';
import { OffersPage } from './pages/offers/OffersPage';
import { CreateOfferPage } from './pages/offers/CreateOfferPage';
import { OfferDetailPage } from './pages/offers/OfferDetailPage';
import { CandidateOfferPage } from './pages/offers/CandidateOfferPage';
import { OnboardingDashboardPage } from './pages/onboarding/OnboardingDashboardPage';
import { OnboardingDetailPage } from './pages/onboarding/OnboardingDetailPage';
import { EmployeeOnboardingPortal } from './pages/portal/EmployeeOnboardingPortal';
import { SourcingPage } from './pages/sourcing/SourcingPage';
import { TalentPoolsPage } from './pages/sourcing/TalentPoolsPage';
import { CampaignsPage } from './pages/marketing/CampaignsPage';
import { LandingPage } from './pages/LandingPage';
import MaintenancePage from './pages/MaintenancePage';

// Super Admin
import { SuperAdminLayout } from './layouts/SuperAdminLayout';
import {
  SuperAdminLoginPage,
  SuperAdminDashboardPage,
  TenantsPage as SuperAdminTenantsPage,
  SubscriptionsPage as SuperAdminSubscriptionsPage,
  UsersPage as SuperAdminUsersPage,
  AuditLogsPage as SuperAdminAuditLogsPage,
  AnalyticsPage as SuperAdminAnalyticsPage,
  SuperAdminSettingsPage,
  SystemMonitoringPage,
  SecurityCenterPage,
  AnnouncementsPage,
  SupportTicketsPage,
  BillingManagementPage,
  DataManagementPage,
  ApiManagementPage,
} from './pages/super-admin';
import { useSuperAdminStore } from './stores/superAdmin';


function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function SuperAdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isSessionValid, updateActivity, lastActivity, sessionTimeout } = useSuperAdminStore();

  // Update activity on route access
  React.useEffect(() => {
    if (isAuthenticated) {
      console.log('[SuperAdmin] Route accessed, updating activity');
      updateActivity();
    }
  }, [isAuthenticated, updateActivity]);

  console.log('[SuperAdmin] Protection check:', {
    isAuthenticated,
    lastActivity: new Date(lastActivity).toISOString(),
    sessionTimeout,
    minutesSinceActivity: ((Date.now() - lastActivity) / 1000 / 60).toFixed(2),
    isValid: isSessionValid()
  });

  if (!isAuthenticated) {
    console.log('[SuperAdmin] Not authenticated, redirecting to login');
    return <Navigate to="/super-admin/login" replace />;
  }

  // Check session validity AFTER updating activity
  if (!isSessionValid()) {
    console.log('[SuperAdmin] Session invalid, logging out');
    useSuperAdminStore.getState().logout();
    return <Navigate to="/super-admin/login" replace />;
  }

  console.log('[SuperAdmin] Access granted');
  return <>{children}</>;
}

function RedirectToDashboard() {
  const user = useAuthStore((state) => state.user);
  const tenantId = user?.tenantId;
  return <Navigate to={`/${tenantId}/dashboard`} replace />;
}

function App() {
  return (
    <ErrorBoundary>
      <ConfirmationProvider>
        <StatusColorProvider>
          <UnsavedChangesProvider>
            <Routes>
              {/* Landing Page - Default Home */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/maintenance" element={<MaintenancePage />} />

              {/* Auth routes */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
                <Route path="/auth/verify-email" element={<VerifyEmailPage />} />
                <Route path="/auth/otp" element={<OtpLoginPage />} />
                <Route path="/auth/mfa" element={<MfaVerifyPage />} />
                <Route path="/auth/mfa-setup" element={<MfaSetupPage />} />
                <Route path="/auth/mfa-onboarding" element={<MfaOnboardingPage />} />
                <Route path="/change-password" element={<ChangePasswordPage />} />
              </Route>

              {/* Public Career Routes */}
              <Route path="/careers/:tenantId" element={<PublicCareerSite />} />
              <Route path="/careers/:tenantId/jobs/:jobId" element={<PublicJobDetails />} />
              <Route path="/careers/:tenantId/jobs/:jobId/apply" element={<JobApplicationPage />} />

              {/* Protected routes */}
              <Route
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<RedirectToDashboard />} />

                <Route path="/:tenantId">
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="jobs" element={<JobsPage />} />
                  <Route path="jobs/new" element={<CreateJobPage />} />
                  <Route path="jobs/:id/edit" element={<EditJobPage />} />
                  <Route path="jobs/:id" element={<JobDetailPage />} />
                  <Route path="candidates" element={<CandidatesPage />} />
                  <Route path="candidates/new" element={<AddCandidatePage />} />
                  <Route path="candidates/:id" element={<CandidateDetailPage />} />
                  <Route path="candidates/:id/edit" element={<EditCandidatePage />} />
                  <Route path="referrals" element={<ReferralsPage />} />
                  <Route path="pipeline/:jobId?" element={<PipelinePage />} />
                  <Route path="interviews" element={<CalendarPage />} />
                  <Route path="inbox" element={<InboxPage />} />
                  <Route path="campaigns" element={<CampaignsPage />} />
                  <Route path="reports" element={<ReportsPage />} />
                  <Route path="offers" element={<OffersPage />} />
                  <Route path="offers/new" element={<CreateOfferPage />} />
                  <Route path="offers/:id" element={<OfferDetailPage />} />
                  <Route path="offers/templates" element={<OfferTemplatesPage />} />
                  <Route path="offers/templates/new" element={<OfferTemplateEditor />} />
                  <Route path="offers/templates/:templateId/edit" element={<OfferTemplateEditor />} />
                  <Route path="templates/job-descriptions/new" element={<JobDescriptionTemplateEditor />} />
                  <Route path="templates/job-descriptions/:templateId/edit" element={<JobDescriptionTemplateEditor />} />
                  <Route path="templates/emails/new" element={<EmailTemplateEditor />} />
                  <Route path="templates/emails/:templateId/edit" element={<EmailTemplateEditor />} />
                  <Route path="templates/onboarding/new" element={<OnboardingTemplateEditor />} />
                  <Route path="templates/onboarding/:templateId/edit" element={<OnboardingTemplateEditor />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="onboarding" element={<OnboardingDashboardPage />} />
                  <Route path="onboarding/:id" element={<OnboardingDetailPage />} />
                  <Route path="sourcing" element={<SourcingPage />} />
                  <Route path="talent-pools" element={<TalentPoolsPage />} />
                </Route>
              </Route>

              {/* Public Routes */}
              <Route path="/:tenantId/jobs/:id/public" element={<PublicJobPage />} />
              {/* <Route path="/jobs/public/:tenantId" element={<PublicJobBoard />} /> */}
              <Route path="/offers/public/:token" element={<CandidateOfferPage />} />
              <Route path="/schedule/:token" element={<InterviewSchedulePage />} />
              <Route path="/portal/onboarding/:id" element={<EmployeeOnboardingPortal />} />

              {/* Super Admin Routes */}
              <Route path="/super-admin/login" element={<SuperAdminLoginPage />} />
              <Route
                element={
                  <SuperAdminProtectedRoute>
                    <SuperAdminLayout />
                  </SuperAdminProtectedRoute>
                }
              >
                <Route path="/super-admin/dashboard" element={<SuperAdminDashboardPage />} />
                <Route path="/super-admin/tenants" element={<SuperAdminTenantsPage />} />
                <Route path="/super-admin/subscriptions" element={<SuperAdminSubscriptionsPage />} />
                <Route path="/super-admin/analytics" element={<SuperAdminAnalyticsPage />} />
                <Route path="/super-admin/users" element={<SuperAdminUsersPage />} />
                <Route path="/super-admin/audit-logs" element={<SuperAdminAuditLogsPage />} />
                <Route path="/super-admin/settings" element={<SuperAdminSettingsPage />} />
                <Route path="/super-admin/monitoring" element={<SystemMonitoringPage />} />
                <Route path="/super-admin/security" element={<SecurityCenterPage />} />
                <Route path="/super-admin/announcements" element={<AnnouncementsPage />} />
                <Route path="/super-admin/support" element={<SupportTicketsPage />} />
                <Route path="/super-admin/billing" element={<BillingManagementPage />} />
                <Route path="/super-admin/data" element={<DataManagementPage />} />
                <Route path="/super-admin/api" element={<ApiManagementPage />} />
              </Route>

              {/* Catch all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </UnsavedChangesProvider>
        </StatusColorProvider>
      </ConfirmationProvider>
    </ErrorBoundary>
  );
}

export default App;
