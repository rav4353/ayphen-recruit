# Super Admin Portal - End-to-End Documentation

## Overview

The Super Admin Portal is a comprehensive platform management system designed for TalentX administrators. It provides complete control over tenants, users, subscriptions, billing, security, and system configuration.

**Access URL:** `http://localhost:3000/super-admin`

**Default Credentials:**
- Email: `superadmin@ayphen.com`
- Password: `Ayphen!SuperAdmin#2025-Temp1`

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Dashboard](#2-dashboard)
3. [Tenants Management](#3-tenants-management)
4. [Users Management](#4-users-management)
5. [Subscriptions](#5-subscriptions)
6. [Billing Management](#6-billing-management)
7. [Analytics](#7-analytics)
8. [Security Center](#8-security-center)
9. [System Monitoring](#9-system-monitoring)
10. [API Management](#10-api-management)
11. [Audit Logs](#11-audit-logs)
12. [Data Management](#12-data-management)
13. [Support Tickets](#13-support-tickets)
14. [Announcements](#14-announcements)
15. [Settings](#15-settings)

---

## 1. Authentication

**Route:** `/super-admin/login`

### Features
| Feature | Status | Description |
|---------|--------|-------------|
| Email/Password Login | ✅ Working | Standard authentication |
| Session Management | ✅ Working | JWT-based sessions |
| Password Change on First Login | ✅ Working | Forced on initial access |
| Logout | ✅ Working | Clears session tokens |

### API Endpoints
- `POST /super-admin/auth/login` - Authenticate super admin
- `POST /super-admin/auth/logout` - Terminate session
- `POST /super-admin/auth/change-password` - Update password

---

## 2. Dashboard

**Route:** `/super-admin/dashboard`

### Widgets
| Widget | Data Source | Status |
|--------|-------------|--------|
| Total Tenants | `getDashboardStats()` | ✅ Real-time |
| Active Users | `getDashboardStats()` | ✅ Real-time |
| Monthly Revenue | `getDashboardStats()` | ✅ Real-time |
| Open Jobs | `getDashboardStats()` | ✅ Real-time |
| System Health | `getSystemHealth()` | ✅ Real-time |
| Recent Activity | `getRecentActivity()` | ✅ Real-time |

### Interactive Elements
| Element | Action | Status |
|---------|--------|--------|
| Refresh Button | Reloads all dashboard data | ✅ Working |
| Activity Links | Navigate to entity details | ✅ Working |
| Health Status Indicators | Show DB, Redis, Email, Storage status | ✅ Working |

### API Endpoints
- `GET /super-admin/dashboard/stats` - Dashboard statistics
- `GET /super-admin/dashboard/health` - System health check
- `GET /super-admin/dashboard/activity` - Recent activity feed

---

## 3. Tenants Management

**Route:** `/super-admin/tenants`

### Features
| Feature | Data Source | Status |
|---------|-------------|--------|
| Tenants List | `getAll()` | ✅ Real |
| Search by Name/Email | Query params | ✅ Working |
| Filter by Status | ACTIVE/SUSPENDED/PENDING | ✅ Working |
| Filter by Plan | STARTER/PROFESSIONAL/ENTERPRISE | ✅ Working |
| Pagination | Page navigation | ✅ Working |

### Actions
| Action | API Method | Status |
|--------|------------|--------|
| Add Organization | Navigate to `/tenants/new` | ✅ Working |
| View Org Profile | Navigate to `/tenants/:id` | ✅ Working |
| Impersonate Owner | `impersonate(tenantId, userId)` | ✅ Working |
| Visit Employee Portal | Opens tenant dashboard | ✅ Working |
| Suspend Account | `suspend(tenantId)` | ✅ Working |
| Activate Account | `activate(tenantId)` | ✅ Working |
| Delete Permanent | `delete(tenantId)` | ✅ Working |

### API Endpoints
- `GET /super-admin/tenants` - List all tenants
- `GET /super-admin/tenants/:id` - Get tenant details
- `POST /super-admin/tenants` - Create tenant
- `PATCH /super-admin/tenants/:id` - Update tenant
- `DELETE /super-admin/tenants/:id` - Delete tenant
- `POST /super-admin/tenants/:id/suspend` - Suspend tenant
- `POST /super-admin/tenants/:id/activate` - Activate tenant
- `POST /super-admin/tenants/:id/impersonate` - Impersonate user

---

## 4. Users Management

**Route:** `/super-admin/users`

### Features
| Feature | Data Source | Status |
|---------|-------------|--------|
| Users List | `getAll()` | ✅ Real |
| Stats Cards | Calculated from users | ✅ Real |
| Search by Name/Email/ID | Query params | ✅ Working |
| Filter by Status | ACTIVE/SUSPENDED/PENDING/INACTIVE | ✅ Working |
| Filter by Role | ADMIN/RECRUITER/HIRING_MANAGER/INTERVIEWER | ✅ Working |
| Pagination | Page navigation | ✅ Working |

### Actions
| Action | API Method | Status |
|--------|------------|--------|
| View Full Profile | Shows user details toast | ✅ Working |
| Impersonate Account | `impersonate(tenantId, userId)` | ✅ Working |
| Reset Password | `resetPassword(userId)` | ✅ Working |
| Suspend Access | `suspend(userId, reason)` | ✅ Working |
| Activate Account | `activate(userId)` | ✅ Working |
| Purge User Data | `delete(userId)` | ✅ Working |

### API Endpoints
- `GET /super-admin/users` - List all users
- `GET /super-admin/users/:id` - Get user details
- `POST /super-admin/users/:id/suspend` - Suspend user
- `POST /super-admin/users/:id/activate` - Activate user
- `POST /super-admin/users/:id/reset-password` - Reset password
- `DELETE /super-admin/users/:id` - Delete user

---

## 5. Subscriptions

**Route:** `/super-admin/subscriptions`

### Features
| Feature | Data Source | Status |
|---------|-------------|--------|
| Subscriptions List | `getAll()` | ✅ Real |
| Stats Cards (MRR, ARR, Active, Churn) | `getStats()` | ✅ Real |
| Plans Architecture | `getPlans()` | ✅ Real |
| Search by Organization | Query params | ✅ Working |
| Filter by Status | ACTIVE/TRIAL/PAST_DUE/CANCELLED | ✅ Working |
| Filter by Plan | Dynamic from plans | ✅ Working |

### Displayed Data
- Tenant name
- Plan tier
- Status (with icons)
- Billing cycle (MONTHLY/YEARLY)
- Amount
- Next billing date

### API Endpoints
- `GET /super-admin/subscriptions` - List subscriptions
- `GET /super-admin/subscriptions/plans` - List plans
- `GET /super-admin/subscriptions/stats` - Subscription statistics

---

## 6. Billing Management

**Route:** `/super-admin/billing`

### Tabs
| Tab | Features | Status |
|-----|----------|--------|
| Fiscal Overview | Revenue stats (MRR, ARR, pending) | ✅ Real |
| Plan Console | CRUD subscription plans | ✅ Working |
| Invoice Registry | List invoices | ✅ Real |
| Payment Stream | List payments with refund | ✅ Real |
| Gateway Bridge | Configure STRIPE/GPAY/PAYTM | ✅ Working |

### Actions
| Action | API Method | Status |
|--------|------------|--------|
| Refresh | `fetchBillingData()` | ✅ Working |
| Fiscal Dump (Export) | `exportBillingData()` | ✅ Working |
| Create Plan | `createPlan()` | ✅ Working |
| Edit Plan | `updatePlan()` | ✅ Working |
| Delete Plan | `deletePlan()` | ✅ Working |
| Process Refund | `refundPayment()` | ✅ Working |
| Configure Gateway | `updateGateway()` | ✅ Working |

### API Endpoints
- `GET /super-admin/billing/invoices` - List invoices/payments
- `POST /super-admin/billing/invoices/:id/refund` - Process refund
- `GET /super-admin/billing/export` - Export billing data
- `GET /super-admin/billing/gateways` - List gateway configs
- `POST /super-admin/billing/gateways` - Update gateway config
- `GET /super-admin/subscriptions/plans` - List plans
- `POST /super-admin/subscriptions/plans` - Create plan
- `PATCH /super-admin/subscriptions/plans/:id` - Update plan
- `DELETE /super-admin/subscriptions/plans/:id` - Delete plan

---

## 7. Analytics

**Route:** `/super-admin/analytics`

### Features
| Feature | Data Source | Status |
|---------|-------------|--------|
| Stats Cards | `getOverview()` | ✅ Real |
| Period Selector | day/week/month/year | ✅ Working |
| Sector Momentum Chart | `getTenantGrowth()` | ✅ Real |
| Tier Velocity Chart | `planDistribution` | ✅ Real |
| Top Tenants Table | `getTopTenants()` | ✅ Real |

### Interactive Elements
| Element | Action | Status |
|---------|--------|--------|
| Period Toggle | Changes data timeframe | ✅ Working |
| Refresh Button | Reloads analytics | ✅ Working |
| Arrow Buttons (Top Tenants) | Navigate to tenant details | ✅ Working |
| Deep Inspection Button | Navigate to tenants list | ✅ Working |

### API Endpoints
- `GET /super-admin/analytics/overview` - Overview stats
- `GET /super-admin/analytics/tenant-growth` - Growth data
- `GET /super-admin/analytics/top-tenants` - Top performing tenants

---

## 8. Security Center

**Route:** `/super-admin/security`

### Tabs
| Tab | Data Source | Status |
|-----|-------------|--------|
| Security Alerts | `getAlerts()` | ✅ Real |
| Blocked IPs | `getBlockedIps()` | ✅ Real |
| Failed Login Attempts | `getLoginAttempts()` | ✅ Real |
| Active Sessions | `getSessions()` | ✅ Real |
| Security Settings | `getAll()` settings | ✅ Real |

### Actions
| Action | API Method | Status |
|--------|------------|--------|
| Resolve Alert | `resolveAlert(id)` | ✅ Working |
| Block IP | `blockIp(data)` | ✅ Working |
| Unblock IP | `unblockIp(id)` | ✅ Working |
| Revoke Session | `revokeSession(id)` | ✅ Working |
| Save Security Settings | `update(key, value)` | ✅ Working |

### Security Settings
- Max Login Attempts
- Lockout Duration
- Enforce Strong Passwords
- Session Timeout
- Global MFA Enforcement

### API Endpoints
- `GET /super-admin/security/alerts` - Security alerts
- `POST /super-admin/security/alerts/:id/resolve` - Resolve alert
- `GET /super-admin/security/blocked-ips` - Blocked IPs
- `POST /super-admin/security/blocked-ips` - Block IP
- `DELETE /super-admin/security/blocked-ips/:id` - Unblock IP
- `GET /super-admin/security/login-attempts` - Login attempts
- `GET /super-admin/security/sessions` - Active sessions
- `DELETE /super-admin/security/sessions/:id` - Revoke session

---

## 9. System Monitoring

**Route:** `/super-admin/monitoring`

### Features
| Feature | Data Source | Status |
|---------|-------------|--------|
| System Resources | `getResources()` | ✅ Real |
| System Logs | `getLogs()` | ✅ Real |
| Job Statistics | `getJobs()` | ✅ Real |
| System Health | `getSystemHealth()` | ✅ Real |
| Real-time Updates | WebSocket | ✅ Working |

### Actions
| Action | API Method | Status |
|--------|------------|--------|
| Platform Lockdown | `setMaintenanceMode()` | ✅ Working |
| Refresh | `fetchData()` | ✅ Working |

### API Endpoints
- `GET /super-admin/monitoring/resources` - CPU, memory, disk usage
- `GET /super-admin/monitoring/logs` - System logs
- `GET /super-admin/monitoring/jobs` - Background job stats
- WebSocket: `system_metrics` event for real-time updates

---

## 10. API Management

**Route:** `/super-admin/api`

### Tabs
| Tab | Data Source | Status |
|-----|-------------|--------|
| Root Keys | `getKeys()` | ✅ Real |
| Webhooks | `getWebhooks()` | ✅ Real |
| Throttling (Rate Limits) | `getRateLimits()` | ✅ Real (with fallback) |
| Telemetry (API Logs) | `getUsage()` | ✅ Real |

### Actions
| Action | API Method | Status |
|--------|------------|--------|
| Issue New Key | `createKey()` | ✅ Working |
| Revoke Key | `revokeKey(id)` | ✅ Working |
| Copy Key | Clipboard API | ✅ Working |
| Toggle Key Visibility | Local state | ✅ Working |
| Register Webhook | `createWebhook()` | ✅ Working |
| Delete Webhook | `deleteWebhook(id)` | ✅ Working |
| Toggle Rate Limit | `updateRateLimit()` | ✅ Working |

### API Endpoints
- `GET /super-admin/api/keys` - List API keys
- `POST /super-admin/api/keys` - Create API key
- `DELETE /super-admin/api/keys/:id` - Revoke API key
- `GET /super-admin/api/webhooks` - List webhooks
- `POST /super-admin/api/webhooks` - Create webhook
- `DELETE /super-admin/api/webhooks/:id` - Delete webhook
- `GET /super-admin/api/rate-limits` - List rate limits
- `PATCH /super-admin/api/rate-limits/:id` - Update rate limit
- `GET /super-admin/api/usage` - API usage telemetry

---

## 11. Audit Logs

**Route:** `/super-admin/audit-logs`

### Features
| Feature | Data Source | Status |
|---------|-------------|--------|
| Logs Table | `getAll()` | ✅ Real |
| Stats Cards | Calculated from logs | ✅ Real |
| Search | Query params | ✅ Working |
| Action Filter | LOGIN/CREATE/UPDATE/DELETE etc. | ✅ Working |
| Entity Filter | USER/TENANT/JOB etc. | ✅ Working |
| Date Range Filter | Start/End dates | ✅ Working |
| Pagination | Page navigation | ✅ Working |

### Actions
| Action | API Method | Status |
|--------|------------|--------|
| Archive Dump (Export) | `export()` | ✅ Working |
| Refresh | `fetchLogs()` | ✅ Working |
| Reset Signal | Clears all filters | ✅ Working |

### Log Entry Data
- Timestamp
- Action type
- Entity type & ID
- User name & IP address
- Tenant name
- Payload/Details preview

### API Endpoints
- `GET /super-admin/audit-logs` - List audit logs
- `GET /super-admin/audit-logs/:id` - Get log details
- `GET /super-admin/audit-logs/export` - Export logs as CSV

---

## 12. Data Management

**Route:** `/super-admin/data`

### Tabs
| Tab | Features | Status |
|-----|----------|--------|
| System Snapshots | Backup management | ✅ Working |
| Data Pipeline | Export queue | ✅ Real |
| Privacy Center | GDPR requests | ✅ Working |
| Purge Protocols | Cleanup tasks | ✅ Working |

### Backups Tab Actions
| Action | API Method | Status |
|--------|------------|--------|
| Create Snapshot | `createBackup()` | ✅ Working |
| Download Backup | `downloadBackup()` | ✅ Working |
| Delete Backup | `deleteBackup()` | ✅ Working |

### Exports Tab
| Feature | Status |
|---------|--------|
| Export List | ✅ Real |
| Download Completed Export | ✅ Working |

### GDPR Tab Actions
| Action | API Method | Status |
|--------|------------|--------|
| Complete Request | `processGDPRRequest(id, 'complete')` | ✅ Working |
| Reject Request | `processGDPRRequest(id, 'reject')` | ✅ Working |

### Cleanup Tasks
| Task | API Method | Status |
|------|------------|--------|
| Audit Log Truncation | `runCleanupTask('audit_logs')` | ✅ Working |
| Session Flush | `runCleanupTask('sessions')` | ✅ Working |
| Orphaned Blob Purge | `runCleanupTask('orphaned_files')` | ✅ Working |
| Hard-Purge Deleted Nodes | `runCleanupTask('deleted_records')` | ✅ Working |

### API Endpoints
- `GET /super-admin/data/backups` - List backups
- `POST /super-admin/data/backups` - Create backup
- `DELETE /super-admin/data/backups/:id` - Delete backup
- `GET /super-admin/data/backups/:id/download` - Download backup
- `GET /super-admin/data/exports` - List exports
- `POST /super-admin/data/exports` - Create export
- `GET /super-admin/data/exports/:id/download` - Download export
- `GET /super-admin/data/gdpr-requests` - List GDPR requests
- `POST /super-admin/data/gdpr-requests/:id/process` - Process request
- `POST /super-admin/data/cleanup/:task` - Run cleanup task

---

## 13. Support Tickets

**Route:** `/super-admin/support`

### Features
| Feature | Data Source | Status |
|---------|-------------|--------|
| Ticket List | `getTickets()` | ✅ Real |
| Ticket Details | `getTicketById()` | ✅ Real |
| Search | By ID/User/Organization | ✅ Working |
| Status Filter | OPEN/IN_PROGRESS/WAITING/RESOLVED/CLOSED | ✅ Working |
| Priority Filter | URGENT/HIGH/MEDIUM/LOW | ✅ Working |

### Actions
| Action | API Method | Status |
|--------|------------|--------|
| Select Ticket | `getTicketById()` | ✅ Working |
| Send Reply | `addTicketMessage()` | ✅ Working |
| Internal Note | `addTicketMessage()` with flag | ✅ Working |
| Set In Progress | `updateTicketStatus('in_progress')` | ✅ Working |
| Mark Resolved | `updateTicketStatus('resolved')` | ✅ Working |
| Close Ticket | `updateTicketStatus('closed')` | ✅ Working |

### Ticket View Features
- Original issue description
- Message thread with staff/user distinction
- Internal notes (highlighted)
- Reply composition with internal toggle

### API Endpoints
- `GET /super-admin/support/tickets` - List tickets
- `GET /super-admin/support/tickets/:id` - Get ticket details
- `PATCH /super-admin/support/tickets/:id/status` - Update status
- `POST /super-admin/support/tickets/:id/messages` - Add message

---

## 14. Announcements

**Route:** `/super-admin/announcements`

### Features
| Feature | Data Source | Status |
|---------|-------------|--------|
| Announcements List | `getAll()` | ✅ Real |
| Stats Cards | Calculated from announcements | ✅ Real |

### Actions
| Action | API Method | Status |
|--------|------------|--------|
| New Announcement | Opens create modal | ✅ Working |
| Edit Announcement | `update(id, data)` | ✅ Working |
| Delete Announcement | `delete(id)` | ✅ Working |
| Force Deploy (Publish) | `publish(id)` | ✅ Working |

### Announcement Form Fields
- Title
- Message
- Type (info/warning/success/critical)
- Priority (low/medium/high)
- Audience (all/admins/specific_tenants)
- Dismissible toggle
- Show Banner toggle
- Scheduled at (optional)
- Expires at (optional)

### API Endpoints
- `GET /super-admin/announcements` - List announcements
- `GET /super-admin/announcements/:id` - Get announcement
- `POST /super-admin/announcements` - Create announcement
- `PATCH /super-admin/announcements/:id` - Update announcement
- `DELETE /super-admin/announcements/:id` - Delete announcement
- `POST /super-admin/announcements/:id/publish` - Publish announcement

---

## 15. Settings

**Route:** `/super-admin/settings`

### Tabs

#### General (System Core)
| Feature | API Method | Status |
|---------|------------|--------|
| Maintenance Mode Toggle | `setMaintenanceMode()` | ✅ Working |
| Maintenance Message | Editable textarea | ✅ Working |
| Allow New Registrations | Toggle | ✅ Working |
| Require Email Verification | Toggle | ✅ Working |

#### Email (Comms Stack)
| Feature | API Method | Status |
|---------|------------|--------|
| SMTP Configuration | `getEmailConfig()` / `updateEmailConfig()` | ✅ Working |
| Test Email | `testEmail()` | ✅ Working |

SMTP Fields:
- Host
- Port
- User
- Password
- From Name
- From Email
- Secure toggle

#### Security Posture
| Feature | API Method | Status |
|---------|------------|--------|
| Session Timeout | `update()` | ✅ Working |
| Max Login Attempts | `update()` | ✅ Working |
| Global MFA Enforcement | Toggle | ✅ Working |
| Root Credentials Reset | `update('force_password_reset', true)` | ✅ Working |

#### Feature Matrix
| Feature | API Method | Status |
|---------|------------|--------|
| Feature Flags List | `getFeatureFlags()` | ✅ Real |
| Toggle Features | `updateFeatureFlag()` | ✅ Working |

#### Platform Ops (Maintenance)
| Feature | API Method | Status |
|---------|------------|--------|
| Maintenance Mode Toggle | `setMaintenanceMode()` | ✅ Working |
| Broadcast Message | Editable | ✅ Working |

### API Endpoints
- `GET /super-admin/settings` - Get all settings
- `POST /super-admin/settings/:key` - Update setting
- `GET /super-admin/settings/email` - Get email config
- `POST /super-admin/settings/email` - Update email config
- `POST /super-admin/settings/email/test` - Test email
- `GET /super-admin/settings/maintenance` - Get maintenance mode
- `POST /super-admin/settings/maintenance` - Set maintenance mode
- `GET /super-admin/settings/feature-flags` - Get feature flags
- `POST /super-admin/settings/feature-flags/:key` - Toggle feature flag

---

## Technical Architecture

### Frontend Stack
- **Framework:** React 18 with TypeScript
- **Routing:** React Router v6
- **State Management:** Zustand
- **HTTP Client:** Axios with interceptors
- **UI Components:** Custom components with Tailwind CSS
- **Icons:** Lucide React
- **Notifications:** React Hot Toast

### Backend Stack
- **Framework:** NestJS
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT with Passport.js
- **Real-time:** WebSocket (Socket.io)
- **Validation:** class-validator

### API Structure
All super admin endpoints are prefixed with `/super-admin/` and protected with `AuthGuard('super-admin-jwt')`.

### Authentication Flow
1. Super admin logs in at `/super-admin/login`
2. Backend validates credentials against `SuperAdmin` table
3. JWT tokens (access + refresh) returned
4. Frontend stores tokens in Zustand store
5. Axios interceptor attaches token to all requests
6. Token refresh handled automatically on 401

### WebSocket Events
- `system_metrics` - Real-time system monitoring data
- `security_alert` - New security alerts
- `maintenance_mode_changed` - Maintenance status updates

---

## Security Considerations

1. **Authentication:** Separate JWT strategy for super admins
2. **Password Policy:** Forced change on first login
3. **Session Management:** Configurable timeout
4. **IP Blocking:** Ability to block malicious IPs
5. **Audit Logging:** All actions are logged
6. **Rate Limiting:** Configurable API throttling
7. **MFA Support:** Optional enforcement

---

## Future Enhancements

- [ ] Two-factor authentication for super admin login
- [ ] Role-based access control within super admin
- [ ] Advanced analytics with custom reports
- [ ] Automated backup scheduling
- [ ] Email template management
- [ ] Custom branding settings per tenant
- [ ] API rate limiting per tenant
- [ ] Advanced audit log search with regex

---

## Troubleshooting

### Common Issues

**Login fails with "Invalid credentials"**
- Verify super admin exists in database
- Run `pnpm prisma db seed` to create default super admin

**Dashboard shows no data**
- Check backend is running
- Verify JWT token is valid
- Check browser console for errors

**WebSocket not connecting**
- Ensure backend WebSocket gateway is running
- Check CORS configuration

**API returns 401 Unauthorized**
- Token may be expired
- Try logging out and back in
- Check token refresh mechanism

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Dec 2024 | Initial implementation with all core features |

---

*Last Updated: December 19, 2025*
