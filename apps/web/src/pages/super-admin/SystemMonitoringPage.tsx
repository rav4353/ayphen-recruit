import { useState, useEffect } from 'react';
import {
    Cpu,
    Database,
    HardDrive,
    Terminal,
    AlertTriangle,
    RefreshCw,
    TrendingUp,
    Clock,
    Zap,
    Server,
    ChevronDown,
} from 'lucide-react';
import { Button } from '../../components/ui';
import { superAdminMonitoringApi } from '../../lib/superAdminApi';
import toast from 'react-hot-toast';
import { cn } from '../../lib/utils';
import { useSuperAdminSocket } from '../../hooks/useSuperAdminSocket';

export function SystemMonitoringPage() {
    const [resources, setResources] = useState<any>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [jobs, setJobs] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [logLevel, setLogLevel] = useState('all');
    const { socket, isConnected } = useSuperAdminSocket();

    useEffect(() => {
        fetchData();
    }, [logLevel]);

    useEffect(() => {
        if (!socket) return;

        socket.on('system_metrics', (data: any) => {
            if (data.resources) setResources(data.resources);
            if (data.jobs) setJobs(data.jobs);
            // Optionally prepend logs if the socket sends them, 
            // but for now we'll stick to hardware metrics for real-time
        });

        return () => {
            socket.off('system_metrics');
        };
    }, [socket]);

    const fetchData = async () => {
        try {
            const [resourceRes, logsRes, jobsRes] = await Promise.all([
                superAdminMonitoringApi.getResources(),
                superAdminMonitoringApi.getLogs({ level: logLevel }),
                superAdminMonitoringApi.getJobs()
            ]);

            setResources(resourceRes.data.data);
            setLogs(logsRes.data.data);
            setJobs(jobsRes.data.data);
        } catch (error) {
            toast.error('Failed to fetch system metrics');
        } finally {
            setIsLoading(false);
        }
    };

    const formatBytes = (bytes: number) => {
        if (!bytes || bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (isLoading && !resources) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-black text-neutral-500 uppercase tracking-widest">Establishing Monitoring Stream...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight uppercase">Infrastructure Telemetry</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1 font-medium transition-colors">
                        Real-time system state observations and log processing
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all",
                        isConnected
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-500"
                            : "bg-red-500/10 border-red-500/20 text-red-600"
                    )}>
                        <div className={cn(
                            "w-2 h-2 rounded-full",
                            isConnected ? "bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-red-500"
                        )} />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                            {isConnected ? "Stream Active" : "Stream Offline"}
                        </span>
                    </div>
                    <Button variant="outline" className="border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all rounded-xl h-11" onClick={fetchData}>
                        <RefreshCw size={18} className={cn("mr-2", isLoading && "animate-spin")} />
                        Sync Telemetry
                    </Button>
                </div>
            </div>

            {/* Hardware Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'CPU Load Avg', value: resources?.cpu.loadAvg[0]?.toFixed(2) || '0.00', sub: `${resources?.cpu.count} V-Cores Active`, icon: Cpu, color: 'blue', progress: null },
                    { label: 'Memory Pressure', value: `${resources?.memory.usagePercentage.toFixed(1)}%`, sub: `${formatBytes(resources?.memory.used)} IN USE`, icon: HardDrive, color: 'purple', progress: resources?.memory.usagePercentage },
                    { label: 'Process Queue', value: jobs?.active || 0, sub: `${jobs?.completed || 0} Successful Cycles`, icon: Zap, color: 'amber', progress: null },
                    { label: 'Operational Uptime', value: `${Math.floor((resources?.uptime || 0) / 3600)}h ${Math.floor(((resources?.uptime || 0) % 3600) / 60)}m`, sub: `${resources?.platform} Kernel`, icon: Clock, color: 'emerald', progress: null },
                ].map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                        <div className="flex items-start justify-between relative z-10">
                            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110", `bg-${stat.color}-500/10 text-${stat.color}-600 dark:text-${stat.color}-400`)}>
                                <stat.icon size={24} />
                            </div>
                            {stat.progress !== null && (
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Saturation</p>
                                    <div className="h-1.5 w-20 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden border border-neutral-200 dark:border-neutral-700">
                                        <div className={cn("h-full transition-all duration-1000", `bg-${stat.color}-500`)} style={{ width: `${stat.progress}%` }} />
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="mt-6 relative z-10">
                            <h3 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tighter tabular-nums leading-none">
                                {stat.value}
                            </h3>
                            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mt-3 opacity-80">{stat.label}</p>
                            <p className="text-xs font-bold text-neutral-400 mt-1">{stat.sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* System Logs Interface */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-neutral-900 p-4 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                                <Terminal size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-neutral-900 dark:text-white uppercase tracking-tighter">Diagnostic Logs</h2>
                                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Immutable system event log</p>
                            </div>
                        </div>
                        <div className="relative">
                            <select
                                value={logLevel}
                                onChange={(e) => setLogLevel(e.target.value)}
                                className="appearance-none bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-300 text-xs font-black uppercase tracking-widest rounded-xl px-5 py-2.5 pr-10 focus:ring-4 focus:ring-red-500/5 transition-all cursor-pointer outline-none"
                            >
                                <option value="all">All Channels</option>
                                <option value="error">Critical Errors</option>
                                <option value="warn">System Warnings</option>
                                <option value="info">Deployment Info</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
                        </div>
                    </div>

                    <div className="bg-neutral-950 rounded-3xl border border-neutral-800 overflow-hidden shadow-2xl">
                        <div className="p-4 bg-neutral-900/50 border-b border-neutral-800 flex items-center justify-between">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                                <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50" />
                                <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
                            </div>
                            <span className="text-[10px] font-mono text-neutral-600 uppercase tracking-widest">system_monitor_v4.0.1.sh</span>
                        </div>
                        <div className="overflow-x-auto min-h-[400px] max-h-[600px] scrollbar-thin scrollbar-thumb-neutral-800">
                            {logs.length === 0 ? (
                                <div className="p-20 text-center flex flex-col items-center gap-4">
                                    <Terminal size={40} className="text-neutral-800" />
                                    <p className="text-xs font-mono text-neutral-600 uppercase tracking-widest">Waiting for incoming telemetry packets...</p>
                                </div>
                            ) : (
                                <table className="w-full font-mono text-[11px] leading-relaxed">
                                    <thead className="sticky top-0 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800 z-10">
                                        <tr>
                                            <th className="text-left py-3 px-6 text-neutral-600 font-black uppercase tracking-widest w-40">Absolute Time</th>
                                            <th className="text-left py-3 px-6 text-neutral-600 font-black uppercase tracking-widest w-24">Vector</th>
                                            <th className="text-left py-3 px-6 text-neutral-600 font-black uppercase tracking-widest">Payload Message</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-900/50">
                                        {logs.map((log, i) => (
                                            <tr key={log.id || i} className="hover:bg-neutral-900/50 transition-colors group">
                                                <td className="py-2.5 px-6 text-neutral-500 tabular-nums">
                                                    [{new Date(log.createdAt).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}.{(new Date(log.createdAt).getMilliseconds()).toString().padStart(3, '0')}]
                                                </td>
                                                <td className="py-2.5 px-6">
                                                    <span className={cn("px-2 py-0.5 rounded-[4px] font-black uppercase text-[9px] tracking-widest",
                                                        log.level === 'error' ? 'bg-red-500/10 text-red-500' :
                                                            log.level === 'warn' ? 'bg-amber-500/10 text-amber-500' :
                                                                'bg-blue-500/10 text-blue-500'
                                                    )}>
                                                        {log.level}
                                                    </span>
                                                </td>
                                                <td className="py-2.5 px-6 text-neutral-400 group-hover:text-neutral-200 transition-colors break-all">
                                                    {log.message}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>

                {/* Secure Service Matrix */}
                <div className="space-y-4">
                    <div className="bg-white dark:bg-neutral-900 p-4 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-neutral-900 dark:bg-white flex items-center justify-center text-white dark:text-neutral-900 shadow-lg">
                                <Database size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-neutral-900 dark:text-white uppercase tracking-tighter">Cloud Node Health</h2>
                                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Strategic infrastructure status</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 space-y-6 shadow-sm">
                        {[
                            { name: 'Primary API Gateway', icon: Server, status: 'HEALTHY', color: 'emerald' },
                            { name: 'PostgreSQL Relational', icon: Database, status: 'CONNECTED', color: 'emerald' },
                            { name: 'Redis Cache Cluster', icon: Zap, status: 'HEALTHY', color: 'emerald' },
                            { name: 'Neural Index Processor', icon: TrendingUp, status: 'INDEXING', color: 'amber' },
                        ].map((service, i) => (
                            <div key={i} className="flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-inner transition-transform group-hover:scale-110", `bg-${service.color}-500/10 text-${service.color}-600 dark:text-${service.color}-400`)}>
                                        <service.icon size={20} />
                                    </div>
                                    <span className="text-sm font-black text-neutral-800 dark:text-neutral-200 uppercase tracking-tight">{service.name}</span>
                                </div>
                                <span className={cn("text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest shadow-sm border",
                                    service.color === 'emerald' ? 'bg-emerald-500/5 text-emerald-600 border-emerald-500/20' : 'bg-amber-500/5 text-amber-600 border-amber-500/20'
                                )}>
                                    {service.status}
                                </span>
                            </div>
                        ))}

                        <div className="pt-8 mt-8 border-t border-neutral-100 dark:border-neutral-800">
                            <div className="flex items-center justify-between text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-3">
                                <span>Compute Overhead</span>
                                <span className="text-red-600 dark:text-red-500 tabular-nums">{(resources?.cpu.loadAvg[0] || 0 * 10).toFixed(1)}% Saturation</span>
                            </div>
                            <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden border border-neutral-200 dark:border-neutral-700">
                                <div
                                    className="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-1000 shadow-[0_0_12px_rgba(239,68,68,0.4)]"
                                    style={{ width: `${Math.min(100, (resources?.cpu.loadAvg[0] || 0) * 10)}%` }}
                                />
                            </div>
                            <p className="text-[9px] text-neutral-400 font-bold uppercase mt-3 leading-relaxed">
                                Alert generated if overhead exceeds 85.0% for more than 300 seconds.
                            </p>
                        </div>
                    </div>

                    <Button className="w-full h-14 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-red-600/20 active:scale-95 transition-all">
                        <AlertTriangle size={18} className="mr-3" />
                        Platform Lockdown
                    </Button>
                </div>
            </div>
        </div>
    );
}

