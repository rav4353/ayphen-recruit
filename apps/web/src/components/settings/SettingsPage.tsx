import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Settings, Users, GitBranch, FileText, Plug, Shield, CreditCard, Palette, Mail, Zap, Layout } from 'lucide-react';
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
        { id: 'templates', label: t('settings.tabs.templates', 'Templates'), icon: <FileText size={18} /> },
        { id: 'integrations', label: t('settings.tabs.integrations'), icon: <Plug size={18} /> },
        { id: 'email', label: t('settings.tabs.email'), icon: <Mail size={18} /> },
        { id: 'compliance', label: t('settings.tabs.compliance'), icon: <Shield size={18} /> },
        { id: 'billing', label: t('settings.tabs.billing'), icon: <CreditCard size={18} /> },
    ];

    const handleTabChange = (tabId: string) => {
        setSearchParams({ tab: tabId });
    };

    return (
        <div className="h-full min-h-0 flex flex-col gap-4 sm:gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">
                    {t('settings.title')}
                </h1>
            </div>

            <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 sm:gap-6">
                {/* Sidebar Navigation - Horizontal scroll on mobile */}
                <div className="w-full lg:w-64 lg:sticky lg:top-6 lg:self-start overflow-x-auto pb-2 lg:pb-0">
                    <div className="flex lg:flex-col gap-1 min-w-max lg:min-w-0">
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

                {/* Content Area */}
                <div className="flex-1 min-w-0 min-h-0 overflow-auto overscroll-contain">
                    {activeTab === 'general' && <GeneralSettings />}
                    {activeTab === 'security' && <SecuritySettings />}
                    {activeTab === 'appearance' && <StatusSettings />}
                    {activeTab === 'users' && <UserManagementSettings />}
                    {activeTab === 'hiring' && <HiringProcessSettings />}
                    {activeTab === 'jobForm' && <JobFormSettings />}
                    {activeTab === 'automations' && <AutomationSettings />}
                    {activeTab === 'skills' && <SkillsSettings />}
                    {activeTab === 'templates' && <TemplateSettings />}
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
