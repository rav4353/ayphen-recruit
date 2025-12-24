import { BackgroundCheckManager } from '../../components/settings/BackgroundCheckManager';
import { PageHeader } from '../../components/ui';
import { Shield } from 'lucide-react';

export function BackgroundChecksPage() {

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Background Checks"
                subtitle="Manage candidate background verification and reports"
                icon={Shield}
                iconColor="blue"
            />
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm">
                <BackgroundCheckManager />
            </div>
        </div>
    );
}
