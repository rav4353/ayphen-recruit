# Module 0: Authentication & Identity Management

## Overview
**Module Owner:** Engineering/Security
**Status:** Implemented (Excluding SSO)
**Epic:** As a User (Admin, Candidate, Vendor), I want to securely log in to the platform using the method appropriate for my role so that I can access my specific features.

This module handles the "Front Door" of the application. It distinguishes between internal users (Employees), external users (Candidates), and partners (Vendors).

---

## Implementation Status

### Backend (NestJS API)
| Feature | Status | Location |
|---------|--------|----------|
| Email/Password Login | ✅ Done | `auth.service.ts`, `auth.controller.ts` |
| User Registration | ✅ Done | `auth.service.ts` |
| OTP Login | ✅ Done | `services/otp.service.ts` |
| 2FA/MFA (TOTP) | ✅ Done | `services/mfa.service.ts` |
| Password Reset | ✅ Done | `services/password.service.ts` |
| Password History | ✅ Done | `services/password.service.ts` |
| Session Management | ✅ Done | `services/session.service.ts` |
| Login Attempt Tracking | ✅ Done | `services/login-attempt.service.ts` |
| Account Lockout | ✅ Done | `services/login-attempt.service.ts` |
| SSO (SAML/OIDC) | ❌ Excluded | - |

### Frontend (React)
| Page | Status | Location |
|------|--------|----------|
| Login Page | ✅ Done | `pages/auth/LoginPage.tsx` |
| Register Page | ✅ Done | `pages/auth/RegisterPage.tsx` |
| Forgot Password | ✅ Done | `pages/auth/ForgotPasswordPage.tsx` |
| Reset Password | ✅ Done | `pages/auth/ResetPasswordPage.tsx` |
| OTP Login | ✅ Done | `pages/auth/OtpLoginPage.tsx` |
| MFA Verification | ✅ Done | `pages/auth/MfaVerifyPage.tsx` |
| MFA Setup | ✅ Done | `pages/auth/MfaSetupPage.tsx` |

### Reusable UI Components
| Component | Location |
|-----------|----------|
| Button | `components/ui/Button.tsx` |
| Input | `components/ui/Input.tsx` |
| Card | `components/ui/Card.tsx` |
| Alert | `components/ui/Alert.tsx` |
| OtpInput | `components/ui/OtpInput.tsx` |
| Divider | `components/ui/Divider.tsx` |
| ThemeToggle | `components/ui/ThemeToggle.tsx` |
| LanguageSwitcher | `components/ui/LanguageSwitcher.tsx` |

### Theme Support
- **Light/Dark Mode**: Toggle between light and dark themes
- **System Preference**: Automatically follows system theme preference
- **Persistence**: Theme preference saved to localStorage
- **Context**: `ThemeContext` provides `theme`, `resolvedTheme`, and `setTheme`

### Internationalization (i18n)
| Language | Code | Flag |
|----------|------|------|
| English | `en` | 🇺🇸 |
| Spanish | `es` | 🇪🇸 |
| French | `fr` | 🇫🇷 |
| German | `de` | 🇩🇪 |
| Hindi | `hi` | 🇮🇳 |

- **Translation Files**: Located in `src/locales/*.json`
- **Auto-detection**: Detects browser language preference
- **Persistence**: Language preference saved to localStorage

### Database Models (Prisma)
- `MagicLink` - Magic link tokens
- `OtpCode` - OTP codes with attempt tracking
- `PasswordResetToken` - Password reset tokens
- `PasswordHistory` - Previous password hashes
- `UserSession` - Active user sessions
- `LoginAttempt` - Login attempt tracking

### API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login with email/password |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Logout and invalidate tokens |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Reset password with token |
| POST | `/auth/change-password` | Change password (authenticated) |
| POST | `/auth/otp/request` | Request OTP |
| POST | `/auth/otp/verify` | Verify OTP |
| POST | `/auth/mfa/setup` | Initiate MFA setup |
| POST | `/auth/mfa/confirm` | Confirm MFA setup |
| POST | `/auth/mfa/verify` | Verify MFA code |
| POST | `/auth/mfa/disable` | Disable MFA |
| GET | `/auth/mfa/status` | Get MFA status |
| GET | `/auth/sessions` | Get active sessions |
| DELETE | `/auth/sessions/:id` | Terminate session |
| DELETE | `/auth/sessions` | Terminate all other sessions |
| POST | `/auth/sessions/refresh` | Refresh session timeout |
| GET | `/auth/session-timeout` | Get session timeout config |

### Session Timeouts by Role
| Role | Timeout |
|------|---------|
| SUPER_ADMIN | 30 minutes |
| ADMIN | 30 minutes |
| RECRUITER | 60 minutes |
| HIRING_MANAGER | 60 minutes |
| INTERVIEWER | 60 minutes |
| CANDIDATE | 7 days |
| VENDOR | 30 minutes |

---

## User Stories

### Story 0.1: Internal User Login (Admin/Recruiter/Hiring Manager)
**Description**
Employees need secure, frictionless access, typically via the company's Identity Provider.

**Scope**
*   **In-Scope:**
    *   SSO Enforcement (SAML 2.0 / OIDC) for Enterprise clients.
    *   Email/Password login for smaller teams (with MFA enforcement).
    *   "Remember Me" session management.
    *   Redirect to Dashboard upon success.
*   **Out-of-Scope:**
    *   Biometric auth (FaceID) on web.

**Pre-requisites**
*   Identity Provider Config (Module 10).

**Acceptance Criteria**
1.  User enters email `jane@company.com`.
2.  System detects corporate domain and redirects to Okta/Microsoft login.
3.  Upon successful auth, user is logged in and redirected to their role-specific dashboard.
4.  Failed attempts are rate-limited.

---

### Story 0.2: Candidate Login & Authentication
**Description**
Candidates need a low-friction way to track applications or sign offers without remembering complex passwords.

**Scope**
*   **In-Scope:**
    *   Social Login (Google, LinkedIn).
    *   One-Time Password (OTP) via Email.
    *   Persistent session for "Apply" flow.
*   **Out-of-Scope:**
    *   Mandatory account creation *before* applying (Apply first, create account later).

**Pre-requisites**
*   Email Service.

**Acceptance Criteria**
1.  Candidate clicks "Check Status".
2.  Enters email; receives an OTP or uses Social Login.
3.  Successful verification logs them in securely without a long-term password.
4.  Session expires after X days of inactivity.

---

### Story 0.3: Vendor Portal Login
**Description**
External agencies and background check providers need restricted access to specific candidates.

**Scope**
*   **In-Scope:**
    *   Email/Password authentication.
    *   Mandatory 2FA (Two-Factor Authentication) via Authenticator App or SMS.
    *   Invitation-based account setup.
*   **Out-of-Scope:**
    *   SSO for vendors (unless they are large enterprise partners).

**Pre-requisites**
*   Vendor Management (Module 10).

**Acceptance Criteria**
1.  Admin invites `agent@agency.com`.
2.  Vendor clicks invite link to set password and 2FA.
3.  Login grants access *only* to the Vendor Portal view.

---

### Story 0.4: Password Management & Recovery
**Description**
Self-service tools for users who use password-based login.

**Scope**
*   **In-Scope:**
    *   "Forgot Password" flow (Reset Link).
    *   Password complexity enforcement (Length, Special chars).
    *   Account Lockout after N failed attempts.
*   **Out-of-Scope:**
    *   Manual admin password reset.

**Pre-requisites**
*   None.

**Acceptance Criteria**
1.  User clicks "Forgot Password", enters email.
2.  System sends reset link (valid for 1 hour).
3.  New password must not match the last 3 passwords.

---

### Story 0.5: Session Management & Timeouts
**Description**
Ensure security by handling idle sessions appropriately.

**Scope**
*   **In-Scope:**
    *   Configurable session timeout (e.g., 30 mins for Admin, 7 days for Candidate).
    *   Force logout on password change.
    *   Concurrent session handling (optional warning).
*   **Out-of-Scope:**
    *   Geolocation fencing.

**Pre-requisites**
*   Security Policy.

**Acceptance Criteria**
1.  Admin user is logged out after 30 minutes of inactivity.
2.  User sees a "Session Expiring" warning 2 minutes before timeout.
