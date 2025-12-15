import { useState, useEffect } from 'react';
import { Card, CardHeader, Button } from '../ui';
import { Bell, Mail, Briefcase, Calendar, FileText, AlertTriangle, CheckCircle, Users, Shield, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../../lib/api';
import toast from 'react-hot-toast';

interface NotificationPreferences {
    newApplication: boolean;
    applicationStageChange: boolean;
    interviewScheduled: boolean;
    interviewReminder: boolean;
    interviewFeedback: boolean;
    offerCreated: boolean;
    offerApproval: boolean;
    offerAccepted: boolean;
    offerDeclined: boolean;
    jobApproval: boolean;
    jobPublished: boolean;
    slaAtRisk: boolean;
    slaOverdue: boolean;
    approvalRequests: boolean;
    onboardingUpdates: boolean;
    bgvUpdates: boolean;
    systemAlerts: boolean;
    emailEnabled: boolean;
    pushEnabled: boolean;
}

const defaultPreferences: NotificationPreferences = {
    newApplication: true,
    applicationStageChange: true,
    interviewScheduled: true,
    interviewReminder: true,
    interviewFeedback: true,
    offerCreated: true,
    offerApproval: true,
    offerAccepted: true,
    offerDeclined: true,
    jobApproval: true,
    jobPublished: true,
    slaAtRisk: true,
    slaOverdue: true,
    approvalRequests: true,
    onboardingUpdates: true,
    bgvUpdates: true,
    systemAlerts: true,
    emailEnabled: true,
    pushEnabled: true,
};

interface NotificationCategory {
    title: string;
    icon: React.ElementType;
    color: string;
    items: {
        key: keyof NotificationPreferences;
        label: string;
        description: string;
    }[];
}

const notificationCategories: NotificationCategory[] = [
    {
        title: 'Applications',
        icon: Briefcase,
        color: 'text-purple-500 bg-purple-500/10',
        items: [
            { key: 'newApplication', label: 'New Applications', description: 'When a candidate applies to your jobs' },
            { key: 'applicationStageChange', label: 'Stage Changes', description: 'When applications move between stages' },
        ],
    },
    {
        title: 'Interviews',
        icon: Calendar,
        color: 'text-cyan-500 bg-cyan-500/10',
        items: [
            { key: 'interviewScheduled', label: 'Interview Scheduled', description: 'When interviews are scheduled' },
            { key: 'interviewReminder', label: 'Interview Reminders', description: 'Reminders before upcoming interviews' },
            { key: 'interviewFeedback', label: 'Feedback Requests', description: 'When feedback is requested after interviews' },
        ],
    },
    {
        title: 'Offers',
        icon: FileText,
        color: 'text-green-500 bg-green-500/10',
        items: [
            { key: 'offerCreated', label: 'Offer Created', description: 'When new offers are created' },
            { key: 'offerApproval', label: 'Approval Status', description: 'When offers are approved or rejected' },
            { key: 'offerAccepted', label: 'Offer Accepted', description: 'When candidates accept offers' },
            { key: 'offerDeclined', label: 'Offer Declined', description: 'When candidates decline offers' },
        ],
    },
    {
        title: 'Jobs',
        icon: Briefcase,
        color: 'text-blue-500 bg-blue-500/10',
        items: [
            { key: 'jobApproval', label: 'Job Approvals', description: 'When jobs require approval or are approved' },
            { key: 'jobPublished', label: 'Job Published', description: 'When jobs are published or status changes' },
        ],
    },
    {
        title: 'SLA Alerts',
        icon: AlertTriangle,
        color: 'text-amber-500 bg-amber-500/10',
        items: [
            { key: 'slaAtRisk', label: 'At Risk Alerts', description: 'When applications are approaching SLA deadlines' },
            { key: 'slaOverdue', label: 'Overdue Alerts', description: 'When SLA deadlines have been breached' },
        ],
    },
    {
        title: 'Approvals',
        icon: CheckCircle,
        color: 'text-orange-500 bg-orange-500/10',
        items: [
            { key: 'approvalRequests', label: 'Approval Requests', description: 'When items require your approval' },
        ],
    },
    {
        title: 'Onboarding',
        icon: Users,
        color: 'text-indigo-500 bg-indigo-500/10',
        items: [
            { key: 'onboardingUpdates', label: 'Onboarding Updates', description: 'Updates about new hire onboarding progress' },
        ],
    },
    {
        title: 'Background Checks',
        icon: Shield,
        color: 'text-teal-500 bg-teal-500/10',
        items: [
            { key: 'bgvUpdates', label: 'BGV Updates', description: 'Background verification status updates' },
        ],
    },
    {
        title: 'System',
        icon: Settings,
        color: 'text-neutral-500 bg-neutral-500/10',
        items: [
            { key: 'systemAlerts', label: 'System Alerts', description: 'Important system notifications and updates' },
        ],
    },
];

export function NotificationSettings() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
    const [hasChanges, setHasChanges] = useState(false);

    // Fetch preferences
    const { data: fetchedPreferences, isLoading } = useQuery({
        queryKey: ['notification-preferences'],
        queryFn: async () => {
            try {
                const response = await notificationsApi.getPreferences();
                return response.data?.data || defaultPreferences;
            } catch {
                return defaultPreferences;
            }
        },
    });

    // Update preferences when fetched
    useEffect(() => {
        if (fetchedPreferences) {
            setPreferences(fetchedPreferences);
        }
    }, [fetchedPreferences]);

    // Save mutation
    const saveMutation = useMutation({
        mutationFn: async (newPreferences: Partial<NotificationPreferences>) => {
            return notificationsApi.updatePreferences(newPreferences as Record<string, boolean>);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
            toast.success('Notification preferences saved');
            setHasChanges(false);
        },
        onError: () => {
            toast.error('Failed to save preferences');
        },
    });

    const handleToggle = (key: keyof NotificationPreferences) => {
        setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
        setHasChanges(true);
    };

    const handleSave = () => {
        saveMutation.mutate(preferences);
    };

    const handleEnableAll = () => {
        const allEnabled = Object.keys(defaultPreferences).reduce((acc, key) => {
            acc[key as keyof NotificationPreferences] = true;
            return acc;
        }, {} as NotificationPreferences);
        setPreferences(allEnabled);
        setHasChanges(true);
    };

    const handleDisableAll = () => {
        const allDisabled = Object.keys(defaultPreferences).reduce((acc, key) => {
            acc[key as keyof NotificationPreferences] = false;
            return acc;
        }, {} as NotificationPreferences);
        setPreferences(allDisabled);
        setHasChanges(true);
    };

    if (isLoading) {
        return (
            <Card>
                <div className="p-6 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Delivery Methods */}
            <Card>
                <CardHeader 
                    title={t('notifications.deliveryMethods', 'Delivery Methods')} 
                    description={t('notifications.deliveryDescription', 'Choose how you want to receive notifications')} 
                />
                <div className="p-6 pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                                    <Bell size={20} />
                                </div>
                                <div>
                                    <p className="font-medium text-neutral-900 dark:text-white">In-App Notifications</p>
                                    <p className="text-sm text-neutral-500">Show notifications in the app</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={preferences.pushEnabled}
                                    onChange={() => handleToggle('pushEnabled')}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                        <div className="flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                                    <Mail size={20} />
                                </div>
                                <div>
                                    <p className="font-medium text-neutral-900 dark:text-white">Email Notifications</p>
                                    <p className="text-sm text-neutral-500">Send notifications to your email</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={preferences.emailEnabled}
                                    onChange={() => handleToggle('emailEnabled')}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Notification Categories */}
            <Card>
                <CardHeader 
                    title={t('notifications.preferences', 'Notification Preferences')} 
                    description={t('notifications.preferencesDescription', 'Choose which notifications you want to receive')} 
                />
                <div className="p-6 pt-0">
                    <div className="flex justify-end gap-2 mb-4">
                        <Button variant="ghost" size="sm" onClick={handleEnableAll}>Enable All</Button>
                        <Button variant="ghost" size="sm" onClick={handleDisableAll}>Disable All</Button>
                    </div>

                    <div className="space-y-6">
                        {notificationCategories.map((category) => {
                            const Icon = category.icon;
                            return (
                                <div key={category.title} className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
                                    <div className="flex items-center gap-3 px-4 py-3 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-700">
                                        <div className={`p-1.5 rounded-lg ${category.color}`}>
                                            <Icon size={16} />
                                        </div>
                                        <h4 className="font-medium text-neutral-900 dark:text-white">{category.title}</h4>
                                    </div>
                                    <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                        {category.items.map((item) => (
                                            <div key={item.key} className="flex items-center justify-between px-4 py-3">
                                                <div>
                                                    <p className="text-sm font-medium text-neutral-900 dark:text-white">{item.label}</p>
                                                    <p className="text-xs text-neutral-500">{item.description}</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={preferences[item.key]}
                                                        onChange={() => handleToggle(item.key)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-neutral-600 peer-checked:bg-blue-600"></div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {hasChanges && (
                        <div className="flex justify-end mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                            <Button onClick={handleSave} disabled={saveMutation.isPending}>
                                {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
