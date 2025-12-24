import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, Button } from '../ui';
import { AlertCircle, ShieldAlert, FileWarning, Users, Clock, Loader2 } from 'lucide-react';
import { complianceApi } from '../../lib/api';
import toast from 'react-hot-toast';

interface Alert {
    id: string;
    title: string;
    severity: 'Critical' | 'Warning';
    type: 'GDPR' | 'Diversity' | 'Background Check' | 'Document Expiry' | 'SLA';
    actionUrl?: string;
}

export function ComplianceAlertsWidget() {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [resolvingId, setResolvingId] = useState<string | null>(null);

    const fetchAlerts = async () => {
        setIsLoading(true);
        try {
            const response = await complianceApi.getAlerts();
            const data = response.data?.data || response.data || [];
            setAlerts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch compliance alerts:', error);
            setAlerts([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAlerts();
    }, []);

    const handleResolve = async (alertId: string) => {
        setResolvingId(alertId);
        try {
            await complianceApi.resolveAlert(alertId, 'Resolved by user');
            toast.success('Alert resolved');
            fetchAlerts();
        } catch (error) {
            toast.error('Failed to resolve alert');
        } finally {
            setResolvingId(null);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'GDPR': return <ShieldAlert size={18} />;
            case 'Diversity': return <Users size={18} />;
            case 'Background Check': return <FileWarning size={18} />;
            case 'SLA': return <Clock size={18} />;
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
                                    {alert.actionUrl ? (
                                        <Link to={alert.actionUrl} className="text-sm font-medium text-neutral-900 dark:text-white hover:underline block">
                                            {alert.title}
                                        </Link>
                                    ) : (
                                        <p className="text-sm font-medium text-neutral-900 dark:text-white">{alert.title}</p>
                                    )}
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${alert.severity === 'Critical' ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                                            }`}>
                                            {alert.severity}
                                        </span>
                                        <Button 
                                            variant="link" 
                                            size="sm" 
                                            className="h-auto p-0 text-xs"
                                            onClick={() => handleResolve(alert.id)}
                                            disabled={resolvingId === alert.id}
                                        >
                                            {resolvingId === alert.id ? <Loader2 size={12} className="animate-spin mr-1" /> : null}
                                            Resolve
                                        </Button>
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
