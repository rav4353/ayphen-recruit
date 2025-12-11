import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/auth';
import { InboxPage } from './pages/communication/InboxPage';

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
import { CareerPage } from './pages/public/CareerPage';
import { JobApplicationPage } from './pages/public/JobApplicationPage';
import { ReferralsPage } from './pages/referrals/ReferralsPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { CalendarPage } from './pages/interviews/CalendarPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { OfferTemplatesPage } from './pages/offers/templates/OfferTemplatesPage';
import { OfferTemplateEditor } from './pages/offers/templates/OfferTemplateEditor';
import { OffersPage } from './pages/offers/OffersPage';
import { CreateOfferPage } from './pages/offers/CreateOfferPage';
import { OfferDetailPage } from './pages/offers/OfferDetailPage';
import { CandidateOfferPage } from './pages/offers/CandidateOfferPage';
import { OnboardingDashboardPage } from './pages/onboarding/OnboardingDashboardPage';
import { OnboardingDetailPage } from './pages/onboarding/OnboardingDetailPage';


function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function RedirectToDashboard() {
  const user = useAuthStore((state) => state.user);
  const tenantId = user?.tenantId;
  return <Navigate to={`/${tenantId}/dashboard`} replace />;
}

function App() {
  return (
    <ConfirmationProvider>
      <StatusColorProvider>
        <UnsavedChangesProvider>
          <Routes>
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
              <Route path="/change-password" element={<ChangePasswordPage />} />
            </Route>

            {/* Public Career Routes */}
            <Route path="/careers/:tenantId" element={<CareerPage />} />
            <Route path="/careers/:tenantId/jobs/:jobId" element={<JobApplicationPage />} />

            {/* Protected routes */}
            <Route
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<RedirectToDashboard />} />
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
                <Route path="reports" element={<ReportsPage />} />
                <Route path="offers" element={<OffersPage />} />
                <Route path="offers/new" element={<CreateOfferPage />} />
                <Route path="offers/:id" element={<OfferDetailPage />} />
                <Route path="offers/templates" element={<OfferTemplatesPage />} />
                <Route path="offers/templates/new" element={<OfferTemplateEditor />} />
                <Route path="offers/templates/:templateId/edit" element={<OfferTemplateEditor />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="onboarding" element={<OnboardingDashboardPage />} />
                <Route path="onboarding/:id" element={<OnboardingDetailPage />} />
              </Route>
            </Route>

            {/* Public Routes */}
            <Route path="/:tenantId/jobs/:id/public" element={<PublicJobPage />} />
            {/* <Route path="/jobs/public/:tenantId" element={<PublicJobBoard />} /> */}
            <Route path="/offers/public/:token" element={<CandidateOfferPage />} />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </UnsavedChangesProvider>
      </StatusColorProvider>
    </ConfirmationProvider >
  );
}

export default App;
