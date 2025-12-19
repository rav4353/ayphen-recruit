import { useState, useEffect } from 'react';
import { Card, CardHeader, Button } from '../ui';
import { AlertCircle, ShieldAlert, FileWarning, Users } from 'lucide-react';

interface Alert {
    id: string;
    title: string;
    severity: 'Critical' | 'Warning';
    type: 'GDPR' | 'Diversity' | 'Background Check';
}

export function ComplianceAlertsWidget() {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // TODO: Replace with actual compliance API
        const fetchAlerts = async () => {
            // Mock fetch
            await new Promise(resolve => setTimeout(resolve, 600));
            setAlerts([
                { id: '1', title: '5 Candidates data expiring in 7 days (GDPR)', severity: 'Warning', type: 'GDPR' },
                { id: '2', title: 'Missing diversity data for Engineering Dept', severity: 'Critical', type: 'Diversity' },
                { id: '3', title: 'Background check failed for John Doe', severity: 'Critical', type: 'Background Check' },
            ]);
            setIsLoading(false);
        };
        fetchAlerts();
    }, []);

    const getIcon = (type: string) => {
        switch (type) {
            case 'GDPR': return <ShieldAlert size={18} />;
            case 'Diversity': return <Users size={18} />;
            case 'Background Check': return <FileWarning size={18} />;
            default: return <AlertCircle size={18} />;
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader title="Compliance Alerts" align="left" />
                <div className="p-4 space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-20 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
                    ))}
                </div>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader title="Compliance Alerts" align="left" />
            <div className="p-0">
                {alerts.length === 0 ? (
                    <div className="p-8 text-center text-neutral-500 text-sm">
                        No compliance alerts
                    </div>
                ) : (
                    alerts.map((alert) => (
                        <div key={alert.id} className="p-4 border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                            <div className="flex items-start gap-3">
                                <div className={`mt-0.5 ${alert.severity === 'Critical' ? 'text-red-500' : 'text-amber-500'}`}>
                                    {getIcon(alert.type)}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-neutral-900 dark:text-white">{alert.title}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${alert.severity === 'Critical' ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                                            }`}>
                                            {alert.severity}
                                        </span>
                                        <Button variant="link" size="sm" className="h-auto p-0 text-xs">Resolve</Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </Card>
    );
}
