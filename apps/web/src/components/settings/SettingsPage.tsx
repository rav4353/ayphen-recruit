import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Settings, Users, GitBranch, FileText, Plug, Shield, CreditCard, Palette, Mail, Zap, Layout, ClipboardCheck } from 'lucide-react';
import { GeneralSettings } from './GeneralSettings';
import { UserManagementSettings } from './UserManagementSettings';
import { HiringProcessSettings } from './HiringProcessSettings';
import { TemplateSettings } from './TemplateSettings';
import { IntegrationSettings } from './IntegrationSettings';
import { ComplianceSettings } from './ComplianceSettings';
import { BillingSettings } from './BillingSettings';
import { StatusSettings } from './StatusSettings';
import { EmailSettings } from './EmailSettings';
import { VendorSettings } from './VendorSettings';

import { SkillsSettings } from './SkillsSettings';
import { SecuritySettings } from './SecuritySettings';
import { AutomationSettings } from './AutomationSettings';


import { EmailTemplatesSettings } from './EmailTemplatesSettings';
import { ScorecardTemplatesSettings } from './ScorecardTemplatesSettings';

import { JobFormSettings } from './JobFormSettings';

export function SettingsPage() {
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'general';

    const tabs = [
        { id: 'general', label: t('settings.tabs.general'), icon: <Settings size={18} /> },
        { id: 'security', label: t('settings.tabs.security'), icon: <Shield size={18} /> },

        { id: 'appearance', label: t('settings.tabs.appearance'), icon: <Palette size={18} /> },
        { id: 'users', label: t('settings.tabs.users'), icon: <Users size={18} /> },
        { id: 'hiring', label: t('settings.tabs.hiring'), icon: <GitBranch size={18} /> },
        { id: 'jobForm', label: t('settings.tabs.jobForm', 'Job Form'), icon: <Layout size={18} /> },
        { id: 'automations', label: t('settings.tabs.automations'), icon: <Zap size={18} /> },
        { id: 'skills', label: t('settings.tabs.skills'), icon: <FileText size={18} /> },
        { id: 'templates', label: t('settings.tabs.offerTemplates', 'Offer Templates'), icon: <FileText size={18} /> },
        { id: 'scorecards', label: t('settings.tabs.scorecards', 'Scorecard Templates'), icon: <ClipboardCheck size={18} /> },
        { id: 'emailTemplates', label: t('settings.tabs.emailTemplates', 'Email Templates'), icon: <Mail size={18} /> },
        { id: 'integrations', label: t('settings.tabs.integrations'), icon: <Plug size={18} /> },
        { id: 'email', label: t('settings.tabs.email'), icon: <Mail size={18} /> },
        { id: 'compliance', label: t('settings.tabs.compliance'), icon: <Shield size={18} /> },
        { id: 'billing', label: t('settings.tabs.billing'), icon: <CreditCard size={18} /> },
    ];

    const handleTabChange = (tabId: string) => {
        setSearchParams({ tab: tabId });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                    {t('settings.title')}
                </h1>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Sidebar Navigation */}
                <div className="w-full md:w-64 space-y-1 md:sticky md:top-6 md:self-start">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === tab.id
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1">
                    {activeTab === 'general' && <GeneralSettings />}
                    {activeTab === 'security' && <SecuritySettings />}

                    {activeTab === 'appearance' && <StatusSettings />}
                    {activeTab === 'users' && <UserManagementSettings />}
                    {activeTab === 'hiring' && <HiringProcessSettings />}
                    {activeTab === 'jobForm' && <JobFormSettings />}
                    {activeTab === 'automations' && <AutomationSettings />}
                    {activeTab === 'skills' && <SkillsSettings />}
                    {activeTab === 'templates' && <TemplateSettings />}
                    {activeTab === 'scorecards' && <ScorecardTemplatesSettings />}
                    {activeTab === 'emailTemplates' && <EmailTemplatesSettings />}
                    {activeTab === 'integrations' && <IntegrationSettings />}
                    {activeTab === 'email' && <EmailSettings />}
                    {activeTab === 'compliance' && <ComplianceSettings />}
                    {activeTab === 'billing' && <BillingSettings />}
                    {activeTab === 'vendors' && <VendorSettings />}
                </div>
            </div>
        </div>
    );
}

