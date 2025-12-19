import { useState, useEffect } from 'react';
import {
    Shield,
    AlertTriangle,
    Lock,
    Globe,
    Ban,
    Activity,
    Search,
    Plus,
    RefreshCw,
    ShieldAlert,
    ShieldCheck,
    UserX,
    Clock,
    Unlock,
    Settings as SettingsIcon,
} from 'lucide-react';
import { Button, Input, ConfirmationModal } from '../../components/ui';
import toast from 'react-hot-toast';
import { superAdminSecurityApi } from '../../lib/superAdminApi';
import { cn } from '../../lib/utils';
import { useSuperAdminSocket } from '../../hooks/useSuperAdminSocket';

interface SecurityAlert {
    id: string;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    ipAddress: string;
    tenantName?: string;
    userName?: string;
    createdAt: string;
    resolved: boolean;
}

interface BlockedIP {
    id: string;
    ipAddress: string;
    reason: string;
    blockedBy: string;
    expiresAt?: string;
    createdAt: string;
}

interface FailedLogin {
    id: string;
    email: string;
    ipAddress: string;
    location?: string;
    tenantId?: string;
    success: boolean;
    createdAt: string;
}

interface ActiveSession {
    id: string;
    userId: string;
    userName: string;
    email: string;
    tenantName: string;
    ipAddress: string;
    location?: string;
    userAgent: string;
    lastActive: string;
}

type TabType = 'alerts' | 'blocked' | 'failed-logins' | 'sessions' | 'settings';

export function SecurityCenterPage() {
    const [activeTab, setActiveTab] = useState<TabType>('alerts');
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Security Alerts
    const [alerts, setAlerts] = useState<SecurityAlert[]>([]);

    // Blocked IPs
    const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
    const [showBlockModal, setShowBlockModal] = useState(false);
    const [newBlockIP, setNewBlockIP] = useState('');
    const [newBlockReason, setNewBlockReason] = useState('');

    // Failed Logins
    const [failedLogins, setFailedLogins] = useState<FailedLogin[]>([]);

    // Active Sessions
    const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
    const [sessionToRevoke, setSessionToRevoke] = useState<ActiveSession | null>(null);

    // Security Settings (Mock for now)
    const [securitySettings] = useState({
        maxLoginAttempts: 5,
        lockoutDuration: 30,
        sessionTimeout: 60,
        enforceStrongPasswords: true,
        enforceMfa: false,
        blockTorExitNodes: true,
        autoBlockSuspiciousIPs: true,
    });

    const { socket } = useSuperAdminSocket();

    useEffect(() => {
        if (!socket) return;

        socket.on('security_alert', (newAlert: any) => {
            toast.error(`SECURITY ALERT: ${newAlert.message}`, {
                duration: 5000,
                icon: '🚨',
            });

            setAlerts(prev => [{
                id: newAlert.id,
                type: newAlert.type,
                severity: newAlert.severity,
                message: newAlert.message,
                ipAddress: newAlert.sourceIp || 'Unknown',
                createdAt: newAlert.createdAt,
                resolved: false,
                tenantName: newAlert.tenantId,
            }, ...prev]);
        });

        return () => {
            socket.off('security_alert');
        };
    }, [socket]);

    useEffect(() => {
        fetchSecurityData();
    }, [activeTab]);

    const fetchSecurityData = async () => {
        setIsLoading(true);
        try {
            if (activeTab === 'alerts') {
                const response = await superAdminSecurityApi.getAlerts();
                const data = response.data.data || [];
                setAlerts(data.map((a: any) => ({
                    id: a.id,
                    type: a.type,
                    severity: a.severity || 'medium',
                    message: a.message,
                    ipAddress: a.sourceIp || 'Unknown',
                    createdAt: a.createdAt,
                    resolved: a.status === 'resolved',
                    tenantName: a.tenantId,
                })));
            } else if (activeTab === 'blocked') {
                const response = await superAdminSecurityApi.getBlockedIps();
                setBlockedIPs(response.data.data || []);
            } else if (activeTab === 'failed-logins') {
                const response = await superAdminSecurityApi.getLoginAttempts({ success: false });
                setFailedLogins(response.data.data || []);
            } else if (activeTab === 'sessions') {
                const response = await superAdminSecurityApi.getSessions();
                setActiveSessions(response.data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch security data', error);
            toast.error('Failed to fetch security data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBlockIP = async (ipToBlock?: string) => {
        const ip = ipToBlock || newBlockIP;
        if (!ip) {
            toast.error('Please enter an IP address');
            return;
        }

        try {
            await superAdminSecurityApi.blockIp({
                ipAddress: ip,
                reason: newBlockReason || 'Manual block'
            });
            toast.success(`IP ${ip} has been blocked`);
            setShowBlockModal(false);
            setNewBlockIP('');
            setNewBlockReason('');
            fetchSecurityData();
        } catch (error) {
            toast.error('Failed to block IP');
        }
    };

    const handleUnblockIP = async (id: string) => {
        try {
            await superAdminSecurityApi.unblockIp(id);
            toast.success('IP has been unblocked');
            fetchSecurityData();
        } catch (error) {
            toast.error('Failed to unblock IP');
        }
    };

    const handleResolveAlert = async (id: string) => {
        try {
            await superAdminSecurityApi.resolveAlert(id);
            setAlerts(alerts.map((a) => (a.id === id ? { ...a, resolved: true } : a)));
            toast.success('Alert marked as resolved');
        } catch (error) {
            toast.error('Failed to resolve alert');
        }
    };

    const handleRevokeSession = async () => {
        if (!sessionToRevoke) return;
        try {
            await superAdminSecurityApi.revokeSession(sessionToRevoke.id);
            toast.success('Session revoked');
            setSessionToRevoke(null);
            fetchSecurityData();
        } catch (error) {
            toast.error('Failed to revoke session');
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'bg-red-500/10 text-red-600 dark:text-red-500 border-red-500/20';
            case 'high': return 'bg-orange-500/10 text-orange-600 dark:text-orange-500 border-orange-500/20';
            case 'medium': return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border-yellow-500/20';
            case 'low': return 'bg-blue-500/10 text-blue-600 dark:text-blue-500 border-blue-500/20';
            default: return 'bg-neutral-500/10 text-neutral-500 border-neutral-500/20';
        }
    };

    const tabs = [
        { id: 'alerts' as TabType, name: 'Security Alerts', icon: ShieldAlert, count: alerts.filter((a) => !a.resolved).length },
        { id: 'blocked' as TabType, name: 'Blocked IPs', icon: Ban, count: blockedIPs.length },
        { id: 'failed-logins' as TabType, name: 'Auth Audit', icon: UserX },
        { id: 'sessions' as TabType, name: 'Active Sessions', icon: Activity, count: activeSessions.length },
        { id: 'settings' as TabType, name: 'Security Settings', icon: Lock },
    ];

    const filteredFailedLogins = failedLogins.filter(l =>
        l.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.ipAddress.includes(searchQuery)
    );

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">Security Command Center</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1 font-medium transition-colors">
                        Real-time protection and global threat monitoring
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        className="border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 h-11 px-4 rounded-xl"
                        onClick={fetchSecurityData}
                    >
                        <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                    </Button>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex gap-2 p-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-x-auto scrollbar-hidden">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black transition-all whitespace-nowrap",
                            activeTab === tab.id
                                ? "bg-red-500/10 text-red-600 dark:text-red-400 shadow-sm"
                                : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800"
                        )}
                    >
                        <tab.icon size={18} />
                        {tab.name}
                        {tab.count !== undefined && tab.count > 0 && (
                            <span className="ml-1 px-2 py-0.5 rounded-lg text-[10px] bg-red-500 text-white animate-pulse">
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center h-80 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl animate-pulse">
                    <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-sm font-black text-neutral-500 uppercase tracking-widest">Scanning Network Infrastructure...</p>
                </div>
            ) : (
                <div className="min-h-[500px]">
                    {activeTab === 'alerts' && (
                        <div className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
                                <Input
                                    placeholder="Filter system alerts..."
                                    className="pl-12 h-12 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div className="space-y-3">
                                {alerts.length === 0 ? (
                                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-16 text-center shadow-sm">
                                        <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                                            <ShieldCheck size={40} className="text-green-500" />
                                        </div>
                                        <h3 className="text-xl font-black text-neutral-900 dark:text-white uppercase tracking-tight">Zero Threats Detected</h3>
                                        <p className="text-neutral-500 mt-2 font-medium">Your platform infrastructure is currently secured.</p>
                                    </div>
                                ) : (
                                    alerts.map((alert) => (
                                        <div
                                            key={alert.id}
                                            className={cn(
                                                "bg-white dark:bg-neutral-900 border rounded-2xl p-5 transition-all shadow-sm",
                                                alert.resolved
                                                    ? 'border-neutral-100 dark:border-neutral-800 opacity-60'
                                                    : 'border-red-500/20 hover:border-red-500/40'
                                            )}
                                        >
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="flex items-start gap-4">
                                                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0", getSeverityColor(alert.severity))}>
                                                        <AlertTriangle size={24} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center flex-wrap gap-2">
                                                            <span className={cn("px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border", getSeverityColor(alert.severity))}>
                                                                {alert.severity}
                                                            </span>
                                                            <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">{alert.type}</span>
                                                            {alert.resolved && (
                                                                <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-green-500/10 text-green-600 dark:text-green-500">
                                                                    RESOLVED
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-neutral-900 dark:text-white mt-2 font-black text-base">{alert.message}</p>
                                                        <div className="flex items-center gap-4 mt-3 text-xs text-neutral-500 font-bold">
                                                            <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                                                                <Globe size={14} className="text-neutral-400" />
                                                                {alert.ipAddress}
                                                            </span>
                                                            <span className="flex items-center gap-1.5">
                                                                <Clock size={14} />
                                                                {new Date(alert.createdAt).toLocaleString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {!alert.resolved && (
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl font-bold"
                                                            onClick={() => handleBlockIP(alert.ipAddress)}
                                                        >
                                                            <Ban size={16} className="mr-1.5" />
                                                            Block Source
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="border-green-500/30 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10 rounded-xl font-bold"
                                                            onClick={() => handleResolveAlert(alert.id)}
                                                        >
                                                            <ShieldCheck size={16} className="mr-1.5" />
                                                            Resolve
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'blocked' && (
                        <div className="space-y-4">
                            <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-neutral-900 p-4 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm gap-4">
                                <div className="relative flex-1 w-full max-w-md">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                                    <Input
                                        placeholder="Search blacklist..."
                                        className="pl-10 h-10 bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 rounded-xl"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <Button onClick={() => setShowBlockModal(true)} className="w-full md:w-auto bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-black rounded-xl h-10">
                                    <Plus size={18} className="mr-2" />
                                    Manual Blacklist
                                </Button>
                            </div>

                            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-sm">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/20">
                                            <th className="text-left text-xs font-black uppercase tracking-widest text-neutral-500 px-6 py-5">IP Source</th>
                                            <th className="text-left text-xs font-black uppercase tracking-widest text-neutral-500 px-6 py-5">Violation Reason</th>
                                            <th className="text-left text-xs font-black uppercase tracking-widest text-neutral-500 px-6 py-5">Auth By</th>
                                            <th className="text-left text-xs font-black uppercase tracking-widest text-neutral-500 px-6 py-5">Added</th>
                                            <th className="px-6 py-5 w-12 text-right"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                        {blockedIPs.map((ip) => (
                                            <tr key={ip.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/10 transition-colors group">
                                                <td className="px-6 py-5">
                                                    <code className="px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-black tracking-tighter">
                                                        {ip.ipAddress}
                                                    </code>
                                                </td>
                                                <td className="px-6 py-5 text-sm font-bold text-neutral-700 dark:text-neutral-300">{ip.reason}</td>
                                                <td className="px-6 py-5 text-xs font-black text-neutral-400 uppercase tracking-tight">System Admin</td>
                                                <td className="px-6 py-5 text-sm text-neutral-500 font-medium">
                                                    {new Date(ip.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-neutral-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10 rounded-xl font-bold"
                                                        onClick={() => handleUnblockIP(ip.id)}
                                                    >
                                                        <Unlock size={16} className="mr-1.5" />
                                                        Restore
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                        {blockedIPs.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-16 text-center text-neutral-400 italic font-medium">
                                                    Whitelist is clear - no restricted IP addresses found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'failed-logins' && (
                        <div className="space-y-4">
                            <div className="bg-white dark:bg-neutral-900 p-4 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
                                    <Input
                                        placeholder="Audit auth stream..."
                                        className="pl-12 h-12 bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 rounded-xl"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-sm">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/20">
                                            <th className="text-left text-xs font-black uppercase tracking-widest text-neutral-500 px-6 py-5">Target Identifier</th>
                                            <th className="text-left text-xs font-black uppercase tracking-widest text-neutral-500 px-6 py-5">Source IP</th>
                                            <th className="text-left text-xs font-black uppercase tracking-widest text-neutral-500 px-6 py-5">Event</th>
                                            <th className="text-left text-xs font-black uppercase tracking-widest text-neutral-500 px-6 py-5">Timestamp</th>
                                            <th className="px-6 py-5 w-12 text-right"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                        {filteredFailedLogins.map((login) => (
                                            <tr key={login.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/10 transition-colors group">
                                                <td className="px-6 py-5 text-sm font-black text-neutral-900 dark:text-white uppercase tracking-tight">{login.email}</td>
                                                <td className="px-6 py-5">
                                                    <span className="font-mono text-sm text-neutral-500 font-bold">{login.ipAddress}</span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className="text-red-600 dark:text-red-500 text-[10px] font-black uppercase tracking-wider flex items-center gap-2 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 w-fit animate-pulse">
                                                        <ShieldAlert size={12} />
                                                        Auth Failure
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-xs text-neutral-500 font-black whitespace-nowrap">
                                                    {new Date(login.createdAt).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="border-red-500/30 text-red-600 dark:text-red-500 hover:bg-neutral-900 dark:hover:bg-white hover:text-white dark:hover:text-black rounded-xl h-10 w-10 p-0"
                                                        onClick={() => handleBlockIP(login.ipAddress)}
                                                        title="Immediate Blacklist"
                                                    >
                                                        <Ban size={18} />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredFailedLogins.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-16 text-center text-neutral-400 italic font-medium">
                                                    Clean Audit Trail - no unauthorized attempts detected
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'sessions' && (
                        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-sm">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/20">
                                        <th className="text-left text-xs font-black uppercase tracking-widest text-neutral-500 px-6 py-5">Account Holder</th>
                                        <th className="text-left text-xs font-black uppercase tracking-widest text-neutral-500 px-6 py-5">Network Detail</th>
                                        <th className="text-left text-xs font-black uppercase tracking-widest text-neutral-500 px-6 py-5">Environment</th>
                                        <th className="text-left text-xs font-black uppercase tracking-widest text-neutral-500 px-6 py-5">Last Broadcast</th>
                                        <th className="px-6 py-5 w-12 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {activeSessions.map((session) => (
                                        <tr key={session.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/10 transition-colors">
                                            <td className="px-6 py-5">
                                                <div>
                                                    <p className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-tight">{session.userName}</p>
                                                    <p className="text-xs font-bold text-neutral-400 mt-0.5">{session.email}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 font-mono text-xs font-black text-neutral-500">{session.ipAddress}</td>
                                            <td className="px-6 py-5">
                                                <p className="text-[10px] font-bold text-neutral-400 truncate max-w-[180px] bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700">
                                                    {session.userAgent}
                                                </p>
                                            </td>
                                            <td className="px-6 py-5 text-xs font-black text-neutral-500">
                                                {new Date(session.lastActive).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-500 hover:bg-red-500/10 rounded-xl font-black uppercase text-[10px] tracking-widest"
                                                    onClick={() => setSessionToRevoke(session)}
                                                >
                                                    <UserX size={14} className="mr-1.5" />
                                                    Revoke
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {activeSessions.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-16 text-center text-neutral-400 font-medium italic">
                                                Zero Active Sessions - system is quiescent
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 shadow-sm">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-10 h-10 rounded-xl bg-neutral-900 dark:bg-white flex items-center justify-center text-white dark:text-neutral-900">
                                        <SettingsIcon size={20} />
                                    </div>
                                    <h3 className="text-xl font-black text-neutral-900 dark:text-white uppercase tracking-tight">Global Authentication Strategy</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="block text-xs font-black text-neutral-500 uppercase tracking-widest">Max Violation Threshold</label>
                                        <div className="relative">
                                            <Input type="number" value={securitySettings.maxLoginAttempts} className="bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 h-12 rounded-xl font-black text-lg pl-4 shadow-inner" />
                                            <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-300" size={18} />
                                        </div>
                                        <p className="text-[10px] font-bold text-neutral-400 px-1 italic">Attempts before automatic container lockout</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-xs font-black text-neutral-500 uppercase tracking-widest">Quarantine Duration (min)</label>
                                        <div className="relative">
                                            <Input type="number" value={securitySettings.lockoutDuration} className="bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 h-12 rounded-xl font-black text-lg pl-4 shadow-inner" />
                                            <Clock className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-300" size={18} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end p-6 bg-red-500/5 rounded-3xl border border-red-500/10 shadow-inner">
                                <Button className="bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest h-14 px-8 rounded-2xl shadow-xl shadow-red-600/20 active:scale-95 transition-all">
                                    <Shield size={20} className="mr-3" />
                                    Push Security Update
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Global Overlays */}
            {showBlockModal && (
                <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xl z-[100] flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[2.5rem] p-10 w-full max-w-lg shadow-2xl animate-scale-in">
                        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6">
                            <Ban className="text-red-500" size={32} />
                        </div>
                        <h3 className="text-2xl font-black text-neutral-900 dark:text-white mb-2 uppercase tracking-tighter">
                            Initialize IP Blacklist
                        </h3>
                        <p className="text-neutral-500 font-medium mb-8 leading-relaxed">Prevent any further inbound traffic from this source from reaching the infrastructure.</p>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="block text-xs font-black text-neutral-500 uppercase tracking-widest px-1">Source Address</label>
                                <Input
                                    placeholder="0.0.0.0"
                                    value={newBlockIP}
                                    onChange={(e) => setNewBlockIP(e.target.value)}
                                    className="bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 h-14 rounded-2xl font-mono text-lg px-6 shadow-inner"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-xs font-black text-neutral-500 uppercase tracking-widest px-1">Protocol Violation Type</label>
                                <Input
                                    placeholder="e.g. Distributed Auth Spray"
                                    value={newBlockReason}
                                    onChange={(e) => setNewBlockReason(e.target.value)}
                                    className="bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 h-14 rounded-2xl font-bold px-6 shadow-inner"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-4 mt-12">
                            <Button variant="ghost" onClick={() => setShowBlockModal(false)} className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100">Cancel</Button>
                            <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest h-14 rounded-2xl shadow-lg shadow-red-600/30" onClick={() => handleBlockIP()}>
                                Confirm Purge
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={!!sessionToRevoke}
                onCancel={() => setSessionToRevoke(null)}
                onConfirm={handleRevokeSession}
                title="Revoke Secure Session"
                message={`Terminate active session for ${sessionToRevoke?.userName}? The user will be instantly logged out and redirected to authentication.`}
                confirmLabel="Confirm Revocation"
                cancelLabel="Abort"
                variant="danger"
            />
        </div>
    );
}

// Add these to index.css if not present: 
// @keyframes scale-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
// .animate-scale-in { animation: scale-in 0.2s ease-out; }
