
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



            {/* Main Grid Layout */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
                {/* Activity & Alerts */}
                <div className="space-y-4 sm:space-y-6 [&>*]:bg-white [&>*]:dark:bg-neutral-900">
                    <UserActivityWidget />
                    <ComplianceAlertsWidget />
                </div>

                {/* Logs & Billing */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 [&>*]:bg-white [&>*]:dark:bg-neutral-900">
                    <RecentAuditLogsWidget />
                    <BillingUsageWidget />
                </div>
            </div>
        </div>
    );
}
