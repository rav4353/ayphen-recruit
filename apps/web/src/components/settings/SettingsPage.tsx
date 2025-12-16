import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth';
import { Settings, Users, GitBranch, FileText, Plug, Shield, CreditCard, Palette, Zap, Layout, Bell, Search, X, ChevronRight, Keyboard, Upload, History, Globe, ArrowLeft } from 'lucide-react';
import { GeneralSettings } from './GeneralSettings';
import { UserManagementSettings } from './UserManagementSettings';
import { HiringProcessSettings } from './HiringProcessSettings';
import { TemplateSettings } from './TemplateSettings';
import { IntegrationSettings } from './IntegrationSettings';
import { ComplianceSettings } from './ComplianceSettings';
import { BillingSettings } from './BillingSettings';
import { StatusSettings } from './StatusSettings';
import { VendorSettings } from './VendorSettings';
import { NotificationSettings } from './NotificationSettings';
import { SkillsSettings } from './SkillsSettings';
import { SecuritySettings } from './SecuritySettings';
import { AutomationSettings } from './AutomationSettings';
import { JobFormSettings } from './JobFormSettings';
import { KeyboardShortcutsSettings } from './KeyboardShortcutsSettings';
import { BulkImportManager } from './BulkImportManager';
import { AuditLogViewer } from './AuditLogViewer';
import { CareerSiteBuilder } from './CareerSiteBuilder';
import { BackgroundCheckManager } from './BackgroundCheckManager';

// Define all searchable settings items - comprehensive list
const settingsItems = [
    // === TAB NAMES (for searching by tab) ===
    { id: 'tab-general', label: 'General', description: 'Organization profile and localization settings', tabId: 'general', keywords: ['general', 'settings', 'organization', 'company'] },
    { id: 'tab-security', label: 'Security', description: 'Password and authentication settings', tabId: 'security', keywords: ['security', 'password', 'authentication'] },
    { id: 'tab-notifications', label: 'Notifications', description: 'Email and push notification preferences', tabId: 'notifications', keywords: ['notifications', 'alerts', 'email'] },
    { id: 'tab-appearance', label: 'Appearance', description: 'Theme and status color customization', tabId: 'appearance', keywords: ['appearance', 'theme', 'colors', 'style'] },
    { id: 'tab-users', label: 'Users', description: 'User management and roles', tabId: 'users', keywords: ['users', 'team', 'members', 'roles'] },
    { id: 'tab-hiring', label: 'Hiring', description: 'Hiring process configuration', tabId: 'hiring', keywords: ['hiring', 'process', 'pipeline', 'workflow'] },
    { id: 'tab-jobForm', label: 'Job Form', description: 'Custom fields for job forms', tabId: 'jobForm', keywords: ['job form', 'custom fields', 'form builder'] },
    { id: 'tab-automations', label: 'Automations', description: 'Workflow automation settings', tabId: 'automations', keywords: ['automations', 'triggers', 'workflows'] },
    { id: 'tab-skills', label: 'Skills', description: 'Skills taxonomy management', tabId: 'skills', keywords: ['skills', 'competencies', 'taxonomy'] },
    { id: 'tab-templates', label: 'Templates', description: 'Email, offer, and scorecard templates', tabId: 'templates', keywords: ['templates', 'email templates', 'offer templates'] },
    { id: 'tab-integrations', label: 'Integrations', description: 'Third-party integrations', tabId: 'integrations', keywords: ['integrations', 'connect', 'api'] },
    { id: 'tab-compliance', label: 'Compliance', description: 'GDPR, EEOC, and data retention', tabId: 'compliance', keywords: ['compliance', 'gdpr', 'privacy', 'legal'] },
    { id: 'tab-billing', label: 'Billing', description: 'Subscription and payment settings', tabId: 'billing', keywords: ['billing', 'payment', 'subscription'] },
    { id: 'tab-shortcuts', label: 'Keyboard Shortcuts', description: 'View and customize keyboard shortcuts', tabId: 'shortcuts', keywords: ['keyboard', 'shortcuts', 'hotkeys', 'keys'] },
    { id: 'tab-import', label: 'Bulk Import', description: 'Import candidates and jobs from CSV', tabId: 'import', keywords: ['import', 'csv', 'bulk', 'upload'] },
    { id: 'tab-audit', label: 'Audit Logs', description: 'View activity and change history', tabId: 'audit', keywords: ['audit', 'logs', 'history', 'activity'] },
    { id: 'tab-career-site', label: 'Career Site', description: 'Customize your public career page', tabId: 'careerSite', keywords: ['career', 'site', 'page', 'jobs', 'public'] },
    { id: 'tab-bgv', label: 'Background Checks', description: 'Manage candidate background verification', tabId: 'bgv', keywords: ['background', 'check', 'verification', 'checkr', 'screening'] },

    // === GENERAL SETTINGS ===
    { id: 'org-profile', label: 'Organization Profile', description: 'Company name, website, and logo', tabId: 'general', keywords: ['organization', 'profile', 'company', 'about'] },
    { id: 'org-name', label: 'Organization Name', description: 'Set your company name', tabId: 'general', keywords: ['company', 'name', 'organization', 'business'] },
    { id: 'org-website', label: 'Website', description: 'Company website URL', tabId: 'general', keywords: ['website', 'url', 'domain', 'link'] },
    { id: 'org-industry', label: 'Industry', description: 'Business industry category', tabId: 'general', keywords: ['industry', 'sector', 'business type'] },
    { id: 'org-description', label: 'Company Description', description: 'Brief description of your company', tabId: 'general', keywords: ['description', 'about', 'overview'] },
    { id: 'org-logo', label: 'Organization Logo', description: 'Upload your company logo', tabId: 'general', keywords: ['logo', 'branding', 'image', 'icon'] },
    { id: 'org-phone', label: 'Phone Number', description: 'Company contact phone', tabId: 'general', keywords: ['phone', 'telephone', 'contact', 'number'] },
    { id: 'org-address', label: 'Address', description: 'Company address', tabId: 'general', keywords: ['address', 'location', 'headquarters'] },
    { id: 'localization', label: 'Localization', description: 'Regional and format settings', tabId: 'general', keywords: ['localization', 'regional', 'format', 'locale'] },
    { id: 'org-timezone', label: 'Timezone', description: 'Set default timezone', tabId: 'general', keywords: ['time', 'zone', 'timezone', 'utc'] },
    { id: 'org-currency', label: 'Currency', description: 'Default currency for salaries', tabId: 'general', keywords: ['currency', 'money', 'dollar', 'euro', 'inr'] },
    { id: 'org-dateformat', label: 'Date Format', description: 'How dates are displayed', tabId: 'general', keywords: ['date', 'format', 'mm/dd', 'dd/mm'] },
    { id: 'org-language', label: 'Default Language', description: 'Set default system language', tabId: 'general', keywords: ['language', 'locale', 'english', 'french', 'hindi'] },
    { id: 'org-weekstart', label: 'Week Starts On', description: 'First day of the week', tabId: 'general', keywords: ['week', 'monday', 'sunday', 'calendar'] },
    { id: 'org-numberformat', label: 'Number Format', description: 'Thousand and decimal separators', tabId: 'general', keywords: ['number', 'format', 'decimal', 'separator'] },
    { id: 'departments', label: 'Departments', description: 'Manage company departments', tabId: 'general', keywords: ['department', 'team', 'division', 'unit'] },
    { id: 'locations', label: 'Locations', description: 'Manage office locations', tabId: 'general', keywords: ['location', 'office', 'city', 'country', 'address'] },

    // === SECURITY SETTINGS ===
    { id: 'security-settings', label: 'Security Settings', description: 'Manage password and security preferences', tabId: 'security', keywords: ['security', 'password', 'protection'] },
    { id: 'change-password', label: 'Change Password', description: 'Update your account password', tabId: 'security', keywords: ['change', 'password', 'update', 'reset'] },
    { id: 'current-password', label: 'Current Password', description: 'Enter your current password', tabId: 'security', keywords: ['current', 'password', 'old'] },
    { id: 'new-password', label: 'New Password', description: 'Set a new password', tabId: 'security', keywords: ['new', 'password', 'create'] },
    { id: 'confirm-password', label: 'Confirm Password', description: 'Confirm your new password', tabId: 'security', keywords: ['confirm', 'password', 'verify'] },
    { id: 'password-requirements', label: 'Password Requirements', description: 'Password strength requirements', tabId: 'security', keywords: ['requirements', 'strength', 'complexity', 'uppercase', 'lowercase', 'special'] },
    { id: 'mfa-settings', label: 'Two-Factor Authentication', description: 'Enable or configure MFA', tabId: 'security', keywords: ['mfa', '2fa', 'two-factor', 'authentication', 'authenticator'] },
    { id: 'session-timeout', label: 'Session Timeout', description: 'Set session expiry duration', tabId: 'security', keywords: ['session', 'timeout', 'expiry', 'login', 'auto logout'] },

    // === NOTIFICATION SETTINGS ===
    { id: 'notification-preferences', label: 'Notification Preferences', description: 'Choose which notifications to receive', tabId: 'notifications', keywords: ['preferences', 'notifications', 'settings'] },
    { id: 'delivery-methods', label: 'Delivery Methods', description: 'How to receive notifications', tabId: 'notifications', keywords: ['delivery', 'method', 'channel'] },
    { id: 'in-app-notifications', label: 'In-App Notifications', description: 'Show notifications in the app', tabId: 'notifications', keywords: ['in-app', 'push', 'bell'] },
    { id: 'email-notifications', label: 'Email Notifications', description: 'Send notifications to email', tabId: 'notifications', keywords: ['email', 'mail', 'notify'] },
    { id: 'new-application', label: 'New Applications', description: 'When a candidate applies to jobs', tabId: 'notifications', keywords: ['new', 'application', 'apply', 'candidate'] },
    { id: 'stage-change', label: 'Stage Changes', description: 'When applications move between stages', tabId: 'notifications', keywords: ['stage', 'change', 'move', 'pipeline'] },
    { id: 'interview-scheduled', label: 'Interview Scheduled', description: 'When interviews are scheduled', tabId: 'notifications', keywords: ['interview', 'scheduled', 'calendar'] },
    { id: 'interview-reminders', label: 'Interview Reminders', description: 'Reminders before upcoming interviews', tabId: 'notifications', keywords: ['interview', 'reminder', 'upcoming'] },
    { id: 'interview-feedback', label: 'Feedback Requests', description: 'When feedback is requested after interviews', tabId: 'notifications', keywords: ['feedback', 'request', 'interview'] },
    { id: 'offer-created', label: 'Offer Created', description: 'When new offers are created', tabId: 'notifications', keywords: ['offer', 'created', 'new'] },
    { id: 'offer-approval', label: 'Offer Approval Status', description: 'When offers are approved or rejected', tabId: 'notifications', keywords: ['offer', 'approval', 'approved', 'rejected'] },
    { id: 'offer-accepted', label: 'Offer Accepted', description: 'When candidates accept offers', tabId: 'notifications', keywords: ['offer', 'accepted', 'accept'] },
    { id: 'offer-declined', label: 'Offer Declined', description: 'When candidates decline offers', tabId: 'notifications', keywords: ['offer', 'declined', 'decline', 'reject'] },
    { id: 'job-approvals', label: 'Job Approvals', description: 'When jobs require or receive approval', tabId: 'notifications', keywords: ['job', 'approval', 'approve'] },
    { id: 'job-published', label: 'Job Published', description: 'When jobs are published', tabId: 'notifications', keywords: ['job', 'published', 'live', 'open'] },
    { id: 'sla-at-risk', label: 'SLA At Risk Alerts', description: 'When applications approach SLA deadlines', tabId: 'notifications', keywords: ['sla', 'at risk', 'deadline', 'warning'] },
    { id: 'sla-overdue', label: 'SLA Overdue Alerts', description: 'When SLA deadlines are breached', tabId: 'notifications', keywords: ['sla', 'overdue', 'breach', 'late'] },
    { id: 'approval-requests', label: 'Approval Requests', description: 'When items require your approval', tabId: 'notifications', keywords: ['approval', 'request', 'pending'] },
    { id: 'onboarding-updates', label: 'Onboarding Updates', description: 'New hire onboarding progress', tabId: 'notifications', keywords: ['onboarding', 'update', 'new hire'] },
    { id: 'bgv-updates', label: 'Background Check Updates', description: 'Background verification status', tabId: 'notifications', keywords: ['bgv', 'background', 'verification', 'check'] },
    { id: 'system-alerts', label: 'System Alerts', description: 'Important system notifications', tabId: 'notifications', keywords: ['system', 'alert', 'important'] },

    // === APPEARANCE/STATUS SETTINGS ===
    { id: 'theme-mode', label: 'Theme Mode', description: 'Choose light, dark, or system theme', tabId: 'appearance', keywords: ['theme', 'dark', 'light', 'mode', 'dark mode'] },
    { id: 'status-colors', label: 'Status Colors', description: 'Customize colors for different statuses', tabId: 'appearance', keywords: ['color', 'status', 'customize', 'palette'] },
    { id: 'application-status-colors', label: 'Application Status Colors', description: 'Colors for application statuses', tabId: 'appearance', keywords: ['application', 'status', 'color', 'new', 'active', 'hired'] },
    { id: 'job-status-colors', label: 'Job Status Colors', description: 'Colors for job statuses', tabId: 'appearance', keywords: ['job', 'status', 'color', 'draft', 'open', 'closed'] },
    { id: 'reset-colors', label: 'Reset to Defaults', description: 'Reset all colors to default', tabId: 'appearance', keywords: ['reset', 'default', 'restore'] },

    // === USER MANAGEMENT SETTINGS ===
    { id: 'user-management', label: 'User Management', description: 'Manage users and access', tabId: 'users', keywords: ['user', 'management', 'admin'] },
    { id: 'user-roles', label: 'User Roles', description: 'Manage roles and permissions', tabId: 'users', keywords: ['role', 'permission', 'access', 'admin', 'recruiter', 'hiring manager'] },
    { id: 'create-role', label: 'Create Role', description: 'Create a new user role', tabId: 'users', keywords: ['create', 'role', 'new', 'add'] },
    { id: 'role-permissions', label: 'Permissions', description: 'Set permissions for roles', tabId: 'users', keywords: ['permission', 'access', 'rights', 'allow'] },
    { id: 'team-members', label: 'Team Members', description: 'View and manage team members', tabId: 'users', keywords: ['team', 'member', 'employee', 'staff'] },
    { id: 'invite-users', label: 'Invite Users', description: 'Add new team members', tabId: 'users', keywords: ['invite', 'add', 'new', 'member', 'send invitation'] },
    { id: 'user-status', label: 'User Status', description: 'Activate or deactivate users', tabId: 'users', keywords: ['active', 'inactive', 'suspend', 'deactivate'] },
    { id: 'resend-password', label: 'Resend Password', description: 'Send new password to user', tabId: 'users', keywords: ['resend', 'password', 'reset', 'forgot'] },
    { id: 'delete-user', label: 'Delete User', description: 'Remove user from system', tabId: 'users', keywords: ['delete', 'remove', 'user'] },

    // === HIRING PROCESS SETTINGS ===
    { id: 'hiring-process', label: 'Hiring Process', description: 'Configure your hiring workflow', tabId: 'hiring', keywords: ['hiring', 'process', 'workflow', 'recruitment'] },
    { id: 'interview-types', label: 'Interview Types', description: 'Define types of interviews', tabId: 'hiring', keywords: ['interview', 'type', 'phone', 'video', 'onsite', 'panel'] },
    { id: 'add-interview-type', label: 'Add Interview Type', description: 'Create a new interview type', tabId: 'hiring', keywords: ['add', 'interview', 'type', 'create'] },
    { id: 'interview-duration', label: 'Interview Duration', description: 'Default interview length', tabId: 'hiring', keywords: ['duration', 'length', 'time', 'minutes'] },
    { id: 'sla-settings', label: 'SLA Settings', description: 'Set time limits for each stage', tabId: 'hiring', keywords: ['sla', 'deadline', 'time', 'limit', 'service level'] },
    { id: 'sla-screening', label: 'Screening SLA', description: 'Time limit for screening stage', tabId: 'hiring', keywords: ['screening', 'sla', 'days'] },
    { id: 'sla-interview', label: 'Interview SLA', description: 'Time limit for interview scheduling', tabId: 'hiring', keywords: ['interview', 'sla', 'schedule'] },
    { id: 'sla-offer', label: 'Offer SLA', description: 'Time limit for offer extension', tabId: 'hiring', keywords: ['offer', 'sla', 'extend'] },
    { id: 'approval-workflows', label: 'Approval Workflows', description: 'Configure approval chains', tabId: 'hiring', keywords: ['approval', 'workflow', 'chain', 'approver'] },
    { id: 'job-approval', label: 'Job Approval', description: 'Who approves new jobs', tabId: 'hiring', keywords: ['job', 'approval', 'approver'] },
    { id: 'offer-approval-workflow', label: 'Offer Approval', description: 'Who approves offers', tabId: 'hiring', keywords: ['offer', 'approval', 'approver'] },

    // === JOB FORM SETTINGS ===
    { id: 'job-form-settings', label: 'Job Form Settings', description: 'Customize job posting forms', tabId: 'jobForm', keywords: ['job', 'form', 'settings', 'customize'] },
    { id: 'custom-fields', label: 'Custom Fields', description: 'Add custom fields to job forms', tabId: 'jobForm', keywords: ['custom', 'field', 'form', 'add'] },
    { id: 'field-type', label: 'Field Type', description: 'Type of custom field (text, dropdown, etc.)', tabId: 'jobForm', keywords: ['type', 'text', 'dropdown', 'checkbox', 'number'] },
    { id: 'required-fields', label: 'Required Fields', description: 'Make fields mandatory', tabId: 'jobForm', keywords: ['required', 'mandatory', 'validation'] },
    { id: 'field-placement', label: 'Field Placement', description: 'Where to show custom fields', tabId: 'jobForm', keywords: ['placement', 'section', 'location'] },

    // === AUTOMATION SETTINGS ===
    { id: 'automation-settings', label: 'Automation Settings', description: 'Configure automated workflows', tabId: 'automations', keywords: ['automation', 'settings', 'workflow'] },
    { id: 'workflow-triggers', label: 'Workflow Triggers', description: 'Set up automated actions', tabId: 'automations', keywords: ['trigger', 'automation', 'workflow', 'when'] },
    { id: 'email-automation', label: 'Email Automation', description: 'Automated email responses', tabId: 'automations', keywords: ['email', 'auto', 'reply', 'automatic'] },
    { id: 'stage-automation', label: 'Stage Automation', description: 'Auto-move candidates between stages', tabId: 'automations', keywords: ['stage', 'move', 'auto', 'progression'] },

    // === SKILLS SETTINGS ===
    { id: 'skills-settings', label: 'Skills Settings', description: 'Manage skills taxonomy', tabId: 'skills', keywords: ['skills', 'settings', 'taxonomy'] },
    { id: 'add-skill', label: 'Add Skill', description: 'Add a new skill to the library', tabId: 'skills', keywords: ['add', 'skill', 'new', 'create'] },
    { id: 'skill-categories', label: 'Skill Categories', description: 'Organize skills by category', tabId: 'skills', keywords: ['category', 'group', 'organize'] },
    { id: 'skill-synonyms', label: 'Skill Synonyms', description: 'Alternative names for skills', tabId: 'skills', keywords: ['synonym', 'alias', 'alternative'] },

    // === TEMPLATE SETTINGS ===
    { id: 'template-settings', label: 'Template Settings', description: 'Manage document templates', tabId: 'templates', keywords: ['template', 'settings', 'documents'] },
    { id: 'offer-templates', label: 'Offer Letter Templates', description: 'Templates for offer letters', tabId: 'templates', keywords: ['offer', 'letter', 'template'] },
    { id: 'create-offer-template', label: 'Create Offer Template', description: 'Create a new offer template', tabId: 'templates', keywords: ['create', 'offer', 'template', 'new'] },
    { id: 'email-templates', label: 'Email Templates', description: 'Templates for emails', tabId: 'templates', keywords: ['email', 'template', 'message'] },
    { id: 'create-email-template', label: 'Create Email Template', description: 'Create a new email template', tabId: 'templates', keywords: ['create', 'email', 'template', 'new'] },
    { id: 'scorecard-templates', label: 'Scorecard Templates', description: 'Interview evaluation templates', tabId: 'templates', keywords: ['scorecard', 'template', 'evaluation', 'interview'] },
    { id: 'jd-templates', label: 'Job Description Templates', description: 'Templates for job descriptions', tabId: 'templates', keywords: ['job', 'description', 'jd', 'template'] },

    // === INTEGRATION SETTINGS ===
    { id: 'integration-settings', label: 'Integration Settings', description: 'Connect third-party services', tabId: 'integrations', keywords: ['integration', 'settings', 'connect'] },
    { id: 'calendar-integration', label: 'Calendar Integration', description: 'Connect Google or Outlook calendar', tabId: 'integrations', keywords: ['calendar', 'google', 'outlook', 'sync', 'meeting'] },
    { id: 'google-calendar', label: 'Google Calendar', description: 'Connect Google Calendar', tabId: 'integrations', keywords: ['google', 'calendar', 'gmail', 'meet'] },
    { id: 'outlook-calendar', label: 'Outlook Calendar', description: 'Connect Outlook/Microsoft Calendar', tabId: 'integrations', keywords: ['outlook', 'microsoft', 'calendar', 'teams'] },
    { id: 'esignature', label: 'E-Signature', description: 'Electronic signature integration', tabId: 'integrations', keywords: ['esignature', 'docusign', 'signature', 'sign', 'document'] },
    { id: 'docusign', label: 'DocuSign', description: 'DocuSign integration', tabId: 'integrations', keywords: ['docusign', 'signature', 'sign'] },
    { id: 'job-boards-integration', label: 'Job Boards', description: 'Post jobs to external sites', tabId: 'integrations', keywords: ['job board', 'linkedin', 'indeed', 'glassdoor', 'posting'] },
    { id: 'linkedin-integration', label: 'LinkedIn', description: 'LinkedIn job posting', tabId: 'integrations', keywords: ['linkedin', 'job', 'posting', 'social'] },
    { id: 'indeed-integration', label: 'Indeed', description: 'Indeed job posting', tabId: 'integrations', keywords: ['indeed', 'job', 'posting'] },
    { id: 'bgv-integration', label: 'Background Verification', description: 'Background check providers', tabId: 'integrations', keywords: ['bgv', 'background', 'verification', 'check', 'checkr'] },
    { id: 'api-settings', label: 'API Settings', description: 'API keys and access', tabId: 'integrations', keywords: ['api', 'key', 'token', 'access', 'developer'] },


    // === COMPLIANCE SETTINGS ===
    { id: 'compliance-settings', label: 'Compliance Settings', description: 'Data privacy and legal compliance', tabId: 'compliance', keywords: ['compliance', 'settings', 'legal', 'privacy'] },
    { id: 'gdpr-settings', label: 'GDPR Settings', description: 'EU data privacy compliance', tabId: 'compliance', keywords: ['gdpr', 'privacy', 'data', 'eu', 'european'] },
    { id: 'data-retention', label: 'Data Retention', description: 'How long to keep data', tabId: 'compliance', keywords: ['retention', 'delete', 'archive', 'days', 'years'] },
    { id: 'consent-management', label: 'Consent Management', description: 'Manage candidate consents', tabId: 'compliance', keywords: ['consent', 'permission', 'agree'] },
    { id: 'eeoc-compliance', label: 'EEOC Compliance', description: 'Equal opportunity settings', tabId: 'compliance', keywords: ['eeoc', 'equal', 'opportunity', 'diversity'] },
    { id: 'anonymization', label: 'Data Anonymization', description: 'Anonymize candidate data', tabId: 'compliance', keywords: ['anonymize', 'anonymization', 'privacy', 'remove'] },
    { id: 'audit-log', label: 'Audit Log', description: 'Track system changes', tabId: 'compliance', keywords: ['audit', 'log', 'history', 'track'] },

    // === BILLING SETTINGS ===
    { id: 'billing-settings', label: 'Billing Settings', description: 'Subscription and payment', tabId: 'billing', keywords: ['billing', 'settings', 'payment'] },
    { id: 'subscription-plan', label: 'Subscription Plan', description: 'View or change your plan', tabId: 'billing', keywords: ['plan', 'subscription', 'pricing', 'tier'] },
    { id: 'current-plan', label: 'Current Plan', description: 'Your active subscription', tabId: 'billing', keywords: ['current', 'plan', 'active'] },
    { id: 'upgrade-plan', label: 'Upgrade Plan', description: 'Upgrade to higher tier', tabId: 'billing', keywords: ['upgrade', 'plan', 'premium', 'enterprise'] },
    { id: 'payment-method', label: 'Payment Method', description: 'Credit card or billing details', tabId: 'billing', keywords: ['payment', 'card', 'credit', 'billing', 'method'] },
    { id: 'invoices', label: 'Invoices', description: 'View billing history', tabId: 'billing', keywords: ['invoice', 'receipt', 'history', 'payment history'] },
    { id: 'billing-address', label: 'Billing Address', description: 'Address for invoices', tabId: 'billing', keywords: ['billing', 'address', 'invoice'] },
];


const SETTINGS_TAB_STORAGE_KEY = 'talentx-settings-last-tab';

export function SettingsPage() {
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [previousSearch, setPreviousSearch] = useState('');
    const { user } = useAuthStore();

    // Get active tab from URL, localStorage, or default to 'general'
    const urlTab = searchParams.get('tab');
    const storedTab = localStorage.getItem(`${SETTINGS_TAB_STORAGE_KEY}-${user?.tenantId}`);
    const activeTab = urlTab || storedTab || 'general';

    // Persist tab selection to localStorage when it changes
    useEffect(() => {
        if (activeTab && user?.tenantId) {
            localStorage.setItem(`${SETTINGS_TAB_STORAGE_KEY}-${user.tenantId}`, activeTab);
        }
    }, [activeTab, user?.tenantId]);

    // If no tab in URL but we have a stored tab, update URL to match
    useEffect(() => {
        if (!urlTab && storedTab) {
            setSearchParams(prev => {
                const newParams = new URLSearchParams(prev);
                newParams.set('tab', storedTab);
                return newParams;
            }, { replace: true });
        }
    }, [urlTab, storedTab, setSearchParams]);

    // Tabs definition
    const tabs = [
        { id: 'general', label: t('settings.tabs.general'), icon: <Settings size={18} /> },
        { id: 'security', label: t('settings.tabs.security'), icon: <Shield size={18} /> },
        { id: 'notifications', label: t('settings.tabs.notifications', 'Notifications'), icon: <Bell size={18} /> },
        { id: 'appearance', label: t('settings.tabs.appearance'), icon: <Palette size={18} /> },
        { id: 'users', label: t('settings.tabs.users'), icon: <Users size={18} /> },
        { id: 'hiring', label: t('settings.tabs.hiring'), icon: <GitBranch size={18} /> },
        { id: 'jobForm', label: t('settings.tabs.jobForm', 'Job Form'), icon: <Layout size={18} /> },
        { id: 'automations', label: t('settings.tabs.automations'), icon: <Zap size={18} /> },
        { id: 'skills', label: t('settings.tabs.skills'), icon: <FileText size={18} /> },
        { id: 'templates', label: t('settings.tabs.templates', 'Templates'), icon: <FileText size={18} /> },
        { id: 'integrations', label: t('settings.tabs.integrations'), icon: <Plug size={18} /> },
        { id: 'compliance', label: t('settings.tabs.compliance'), icon: <Shield size={18} /> },
        { id: 'billing', label: t('settings.tabs.billing'), icon: <CreditCard size={18} /> },
        { id: 'careerSite', label: t('settings.tabs.careerSite', 'Career Site'), icon: <Globe size={18} /> },
        { id: 'import', label: t('settings.tabs.import', 'Bulk Import'), icon: <Upload size={18} /> },
        { id: 'shortcuts', label: t('settings.tabs.shortcuts', 'Shortcuts'), icon: <Keyboard size={18} /> },
        { id: 'audit', label: t('settings.tabs.audit', 'Audit Logs'), icon: <History size={18} /> },
        { id: 'bgv', label: t('settings.tabs.bgv', 'Background Checks'), icon: <Shield size={18} /> },
    ];

    // Filter settings items based on search query
    const filteredItems = searchQuery.trim() === ''
        ? []
        : settingsItems.filter(item => {
            const query = searchQuery.toLowerCase();
            return item.label.toLowerCase().includes(query) ||
                item.description.toLowerCase().includes(query) ||
                item.keywords.some(keyword => keyword.toLowerCase().includes(query));
        });

    const handleTabChange = (tabId: string, fromSearch: boolean = false) => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams();
            newParams.set('tab', tabId);
            // Keep the 'view' param only if staying on the same main tab
            const currentTab = prev.get('tab');
            if (currentTab === tabId && prev.has('view')) {
                newParams.set('view', prev.get('view')!);
            }
            return newParams;
        });
        if (fromSearch) {
            setPreviousSearch(searchQuery);
        } else {
            setPreviousSearch('');
        }
        setSearchQuery(''); // Clear search when selecting a tab
    };

    const handleBackToSearch = () => {
        setSearchQuery(previousSearch);
        setPreviousSearch('');
    };

    const getTabLabel = (tabId: string) => {
        const tab = tabs.find(t => t.id === tabId);
        return tab?.label || tabId;
    };

    const getTabIcon = (tabId: string) => {
        const tab = tabs.find(t => t.id === tabId);
        return tab?.icon || <Settings size={18} />;
    };

    // Highlight matching text in search results
    const highlightMatch = (text: string, query: string) => {
        if (!query.trim()) return text;
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const parts = text.split(regex);
        return parts.map((part, i) =>
            regex.test(part) ? (
                <mark key={i} className="bg-yellow-200 dark:bg-yellow-900/50 text-inherit rounded px-0.5">
                    {part}
                </mark>
            ) : part
        );
    };

    return (
        <div className="h-full min-h-0 flex flex-col gap-3 sm:gap-5">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    {previousSearch && (
                        <button
                            onClick={handleBackToSearch}
                            className="p-1 -ml-1 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white rounded-md transition-colors"
                            title="Back to search"
                        >
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    <h1 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">
                        {t('settings.title')}
                    </h1>
                </div>
                {/* Search Input */}
                <div className="relative w-full max-w-xs">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('settings.searchPlaceholder', 'Search settings...')}
                        className="w-full pl-9 pr-8 py-1.5 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 sm:gap-6 overflow-hidden">
                {/* Sidebar Navigation - Hide when searching */}
                {!searchQuery && (
                    <div className="w-full lg:w-64 lg:sticky lg:top-6 lg:self-start overflow-x-auto lg:overflow-x-visible lg:overflow-y-auto lg:max-h-[calc(100vh-10rem)] pb-2 lg:pb-0 scrollbar-hidden">
                        <div className="flex lg:flex-col gap-1 min-w-max lg:min-w-0 pr-4 lg:pr-0 lg:pb-4">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id)}
                                    className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${activeTab === tab.id
                                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                                        }`}
                                >
                                    {tab.icon}
                                    <span className="hidden sm:inline lg:inline">{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Content Area */}
                <div className="flex-1 min-w-0 min-h-0 overflow-y-auto overscroll-contain">
                    {/* Show search results when searching */}
                    {searchQuery.trim() !== '' ? (
                        <div className="space-y-2">
                            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                                {filteredItems.length} {filteredItems.length === 1 ? 'result' : 'results'} for "{searchQuery}"
                            </p>
                            {filteredItems.length === 0 ? (
                                <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
                                    <Search size={48} className="mx-auto mb-4 opacity-50" />
                                    <p className="text-lg">{t('settings.noResults', 'No settings found')}</p>
                                    <p className="text-sm mt-2">{t('settings.tryDifferentSearch', 'Try a different search term')}</p>
                                </div>
                            ) : (
                                filteredItems.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => handleTabChange(item.tabId, true)}
                                        className="w-full text-left p-4 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="text-blue-600 dark:text-blue-400">
                                                    {getTabIcon(item.tabId)}
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-neutral-900 dark:text-white">{highlightMatch(item.label, searchQuery)}</h4>
                                                    <p className="text-sm text-neutral-500 dark:text-neutral-400">{highlightMatch(item.description, searchQuery)}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-neutral-400 group-hover:text-blue-500">
                                                <span className="text-xs bg-neutral-100 dark:bg-neutral-700 px-2 py-1 rounded">
                                                    {getTabLabel(item.tabId)}
                                                </span>
                                                <ChevronRight size={16} />
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    ) : (
                        /* Normal single tab view when not searching */
                        <>
                            {activeTab === 'general' && <GeneralSettings />}
                            {activeTab === 'security' && <SecuritySettings />}
                            {activeTab === 'notifications' && <NotificationSettings />}
                            {activeTab === 'appearance' && <StatusSettings />}
                            {activeTab === 'users' && <UserManagementSettings />}
                            {activeTab === 'hiring' && <HiringProcessSettings />}
                            {activeTab === 'jobForm' && <JobFormSettings />}
                            {activeTab === 'automations' && <AutomationSettings />}
                            {activeTab === 'skills' && <SkillsSettings />}
                            {activeTab === 'templates' && <TemplateSettings />}
                            {activeTab === 'integrations' && <IntegrationSettings />}
                            {activeTab === 'compliance' && <ComplianceSettings />}
                            {activeTab === 'billing' && <BillingSettings />}
                            {activeTab === 'vendors' && <VendorSettings />}
                            {activeTab === 'careerSite' && <CareerSiteBuilder />}
                            {activeTab === 'import' && <BulkImportManager />}
                            {activeTab === 'shortcuts' && <KeyboardShortcutsSettings />}
                            {activeTab === 'audit' && <AuditLogViewer />}
                            {activeTab === 'bgv' && <BackgroundCheckManager />}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
