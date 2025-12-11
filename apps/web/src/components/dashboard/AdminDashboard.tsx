import { SystemHealthWidget } from './SystemHealthWidget';
import { UserActivityWidget } from './UserActivityWidget';
import { ComplianceAlertsWidget } from './ComplianceAlertsWidget';
import { RecentAuditLogsWidget } from './RecentAuditLogsWidget';
import { BillingUsageWidget } from './BillingUsageWidget';

import { useTranslation } from 'react-i18next';

export function AdminDashboard() {
    const { t } = useTranslation();

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Section */}
            <div>
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t('dashboard.admin.title')}</h1>
                <p className="text-neutral-500 dark:text-neutral-400 mt-1">{t('dashboard.subtitle.admin')}</p>
            </div>

            {/* System Health - Full Width */}
            <SystemHealthWidget />

            {/* Main Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Activity & Alerts */}
                <div className="space-y-6 lg:col-span-2">
                    <UserActivityWidget />
                    <ComplianceAlertsWidget />
                </div>

                {/* Right Column - Logs & Billing */}
                <div className="space-y-6">
                    <RecentAuditLogsWidget />
                    <BillingUsageWidget />
                </div>
            </div>
        </div>
    );
}
