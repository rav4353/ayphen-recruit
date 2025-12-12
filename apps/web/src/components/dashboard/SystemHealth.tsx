import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { healthApi } from '../../lib/api';
import {
    LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
    Activity, Database, Mail, Cpu, CheckCircle, XCircle, AlertTriangle,
    Clock, TrendingUp, Zap, HardDrive, Server, Wifi, WifiOff, BarChart3
} from 'lucide-react';
import { Card, CardHeader } from '../ui';

interface ServiceStatus {
    service: string;
    status: 'healthy' | 'unhealthy' | 'degraded';
    responseTime?: number;
    message?: string;
    lastChecked: string;
}

interface HealthData {
    status: 'healthy' | 'unhealthy' | 'degraded';
    timestamp: string;
    services: ServiceStatus[];
    uptime: number;
    database?: {
        candidates: number;
        jobs: number;
        applications: number;
        interviews: number;
    };
    environment?: {
        nodeVersion: string;
        platform: string;
        memory: {
            used: number;
            total: number;
        };
    };
}

interface HistoricalDataPoint {
    time: string;
    database: number;
    aiService: number;
    email: number;
    memory: number;
}

const MAX_DATA_POINTS = 20; // Keep last 20 data points

const getStatusConfig = (status: string) => {
    switch (status) {
        case 'healthy':
            return {
                icon: <CheckCircle className="w-5 h-5" />,
                color: 'text-green-500',
                bg: 'bg-green-50 dark:bg-green-900/10',
                border: 'border-green-200 dark:border-green-800',
                pulse: 'animate-pulse',
                label: 'Healthy',
            };
        case 'degraded':
            return {
                icon: <AlertTriangle className="w-5 h-5" />,
                color: 'text-yellow-500',
                bg: 'bg-yellow-50 dark:bg-yellow-900/10',
                border: 'border-yellow-200 dark:border-yellow-800',
                pulse: '',
                label: 'Degraded',
            };
        case 'unhealthy':
            return {
                icon: <XCircle className="w-5 h-5" />,
                color: 'text-red-500',
                bg: 'bg-red-50 dark:bg-red-900/10',
                border: 'border-red-200 dark:border-red-800',
                pulse: 'animate-pulse',
                label: 'Unhealthy',
            };
        default:
            return {
                icon: <Activity className="w-5 h-5" />,
                color: 'text-gray-400',
                bg: 'bg-gray-50 dark:bg-gray-900/10',
                border: 'border-gray-200 dark:border-gray-700',
                pulse: '',
                label: 'Unknown',
            };
    }
};

const getServiceConfig = (serviceName: string) => {
    if (serviceName.includes('Database')) {
        return {
            icon: <Database className="w-6 h-6" />,
            gradient: 'from-blue-500 to-indigo-600',
            color: 'text-blue-600 dark:text-blue-400',
            chartColor: '#3b82f6',
        };
    }
    if (serviceName.includes('Email')) {
        return {
            icon: <Mail className="w-6 h-6" />,
            gradient: 'from-purple-500 to-pink-600',
            color: 'text-purple-600 dark:text-purple-400',
            chartColor: '#a855f7',
        };
    }
    if (serviceName.includes('AI')) {
        return {
            icon: <Cpu className="w-6 h-6" />,
            gradient: 'from-green-500 to-emerald-600',
            color: 'text-green-600 dark:text-green-400',
            chartColor: '#22c55e',
        };
    }
    return {
        icon: <Server className="w-6 h-6" />,
        gradient: 'from-gray-500 to-gray-600',
        color: 'text-gray-600 dark:text-gray-400',
        chartColor: '#6b7280',
    };
};

const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds < 60) parts.push(`${secs}s`);

    return parts.join(' ') || '0s';
};

const getResponseTimeColor = (ms?: number) => {
    if (!ms) return 'text-gray-400';
    if (ms < 50) return 'text-green-500';
    if (ms < 200) return 'text-yellow-500';
    return 'text-red-500';
};

const ProgressBar = ({ value, max, color }: { value: number; max: number; color: string }) => {
    const percentage = Math.min((value / max) * 100, 100);
    return (
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
                className={`h-full ${color} transition-all duration-500 ease-out`}
                style={{ width: `${percentage}%` }}
            />
        </div>
    );
};

export function SystemHealth() {
    const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);

    const { data: healthResponse, isLoading, error } = useQuery({
        queryKey: ['system-health'],
        queryFn: async () => {
            try {
                const response = await healthApi.getDetailedHealth();
                // Handle wrapped response safely
                if (response.data && response.data.success && response.data.data) {
                    return response.data.data;
                }
                return response.data;
            } catch (err) {
                console.error('Health check failed:', err);
                throw err;
            }
        },
        refetchInterval: 5000,
    });

    const health = healthResponse as HealthData | undefined;
    const statusConfig = getStatusConfig(health?.status || 'unknown');

    // Update historical data when new health data arrives
    useEffect(() => {
        if (health && health.services) {
            const now = new Date();
            const timeStr = now.toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });

            const dbService = health.services.find(s => s.service.includes('Database'));
            const aiService = health.services.find(s => s.service.includes('AI'));
            const emailService = health.services.find(s => s.service.includes('Email'));

            const newPoint: HistoricalDataPoint = {
                time: timeStr,
                database: dbService?.responseTime || 0,
                aiService: aiService?.responseTime || 0,
                email: emailService?.responseTime || 0,
                memory: health.environment?.memory ?
                    Math.round((health.environment.memory.used / health.environment.memory.total) * 100) : 0,
            };

            setHistoricalData(prev => {
                const updated = [...prev, newPoint];
                // Keep only last MAX_DATA_POINTS
                return updated.slice(-MAX_DATA_POINTS);
            });
        }
    }, [health]);

    if (isLoading) {
        return (
            <Card>
                <CardHeader title="System Health Monitor" />
                <div className="p-6">
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <div className="relative">
                            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600"></div>
                            <Activity className="w-6 h-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                        </div>
                        <p className="text-sm text-gray-500">Checking system status...</p>
                    </div>
                </div>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardHeader title="System Health Monitor" />
                <div className="p-6">
                    <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
                        <div className="relative">
                            <WifiOff className="w-16 h-16 text-red-500" />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900 dark:text-white">Connection Lost</p>
                            <p className="text-sm text-gray-500 mt-1">Unable to fetch system health data</p>
                        </div>
                    </div>
                </div>
            </Card>
        );
    }

    const memoryPercentage = health?.environment?.memory
        ? (health.environment.memory.used / health.environment.memory.total) * 100
        : 0;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader
                    title={
                        <span className="flex items-center gap-3">
                            <span className={`p-2 rounded-lg bg-gradient-to-br ${statusConfig.bg} ${statusConfig.border} border-2`}>
                                <Activity className="w-5 h-5" />
                            </span>
                            <span>System Health Monitor</span>
                        </span>
                    }
                    action={
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                                <Wifi className="w-4 h-4 text-green-500 animate-pulse" />
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Live</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <Clock className="w-4 h-4" />
                                <span className="font-mono">{formatUptime(health?.uptime || 0)}</span>
                            </div>
                        </div>
                    }
                />

                <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
                    {/* Overall Status Banner */}
                    <div className={`relative overflow-hidden rounded-xl sm:rounded-2xl border-2 ${statusConfig.border} ${statusConfig.bg} p-4 sm:p-6`}>
                        <div className="absolute top-0 right-0 w-32 sm:w-64 h-32 sm:h-64 bg-gradient-to-br from-white/20 to-transparent rounded-full -mr-16 sm:-mr-32 -mt-16 sm:-mt-32"></div>
                        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                            <div className="flex items-center gap-4">
                                <div className={`${statusConfig.color} ${statusConfig.pulse}`}>
                                    {statusConfig.icon}
                                </div>
                                <div>
                                    <h3 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                                        System {statusConfig.label}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        {health?.services.length || 0} services monitored • Last checked {new Date(health?.timestamp || '').toLocaleTimeString()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-green-500" />
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">99.9% Uptime</span>
                            </div>
                        </div>
                    </div>

                    {/* Live Charts */}
                    {historicalData.length > 1 && (
                        <div className="grid grid-cols-1 gap-4 sm:gap-6">
                            {/* Response Time Chart */}
                            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 sm:p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Response Times (ms)
                                    </h4>
                                </div>
                                <ResponsiveContainer width="100%" height={180}>
                                    <LineChart data={historicalData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                                        <XAxis
                                            dataKey="time"
                                            tick={{ fontSize: 10 }}
                                            stroke="#6b7280"
                                        />
                                        <YAxis
                                            tick={{ fontSize: 10 }}
                                            stroke="#6b7280"
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#1f2937',
                                                border: 'none',
                                                borderRadius: '8px',
                                                color: '#fff'
                                            }}
                                        />
                                        <Legend
                                            wrapperStyle={{ fontSize: '12px' }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="database"
                                            stroke="#3b82f6"
                                            strokeWidth={2}
                                            dot={{ fill: '#3b82f6', r: 3 }}
                                            activeDot={{ r: 5 }}
                                            name="Database"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="aiService"
                                            stroke="#22c55e"
                                            strokeWidth={2}
                                            dot={{ fill: '#22c55e', r: 3 }}
                                            activeDot={{ r: 5 }}
                                            name="AI Service"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="email"
                                            stroke="#a855f7"
                                            strokeWidth={2}
                                            dot={{ fill: '#a855f7', r: 3 }}
                                            activeDot={{ r: 5 }}
                                            name="Email"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Memory Usage Chart */}
                            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 sm:p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <HardDrive className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Memory Usage (%)
                                    </h4>
                                </div>
                                <ResponsiveContainer width="100%" height={180}>
                                    <AreaChart data={historicalData}>
                                        <defs>
                                            <linearGradient id="memoryGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#a855f7" stopOpacity={0.1} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                                        <XAxis
                                            dataKey="time"
                                            tick={{ fontSize: 10 }}
                                            stroke="#6b7280"
                                        />
                                        <YAxis
                                            tick={{ fontSize: 10 }}
                                            stroke="#6b7280"
                                            domain={[0, 100]}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#1f2937',
                                                border: 'none',
                                                borderRadius: '8px',
                                                color: '#fff'
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="memory"
                                            stroke="#a855f7"
                                            strokeWidth={2}
                                            fill="url(#memoryGradient)"
                                            name="Memory"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Services Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        {health?.services.map((service) => {
                            const serviceConfig = getServiceConfig(service.service);
                            const serviceStatus = getStatusConfig(service.status);

                            return (
                                <div
                                    key={service.service}
                                    className="group relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-5 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] sm:hover:scale-105"
                                >
                                    {/* Gradient Background */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${serviceConfig.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>

                                    <div className="relative space-y-3">
                                        {/* Header */}
                                        <div className="flex items-center justify-between">
                                            <div className={`p-2 rounded-lg bg-gradient-to-br ${serviceConfig.gradient} text-white`}>
                                                {serviceConfig.icon}
                                            </div>
                                            <div className={serviceStatus.color}>
                                                {serviceStatus.icon}
                                            </div>
                                        </div>

                                        {/* Service Name */}
                                        <div>
                                            <h4 className="font-semibold text-gray-900 dark:text-white">
                                                {service.service}
                                            </h4>
                                            <p className={`text-xs font-medium mt-1 ${serviceStatus.color}`}>
                                                {serviceStatus.label}
                                            </p>
                                        </div>

                                        {/* Metrics */}
                                        <div className="space-y-2">
                                            {service.responseTime && (
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                        <Zap className="w-3 h-3" />
                                                        Response
                                                    </span>
                                                    <span className={`font-mono font-semibold ${getResponseTimeColor(service.responseTime)}`}>
                                                        {service.responseTime}ms
                                                    </span>
                                                </div>
                                            )}
                                            {service.message && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                                                    {service.message}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* System Resources */}
                    {health?.environment && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Memory Usage</h4>
                                    <span className="text-xs font-mono text-gray-500">
                                        {health.environment.memory.used}MB / {health.environment.memory.total}MB
                                    </span>
                                </div>
                                <ProgressBar
                                    value={health.environment.memory.used}
                                    max={health.environment.memory.total}
                                    color={memoryPercentage > 80 ? 'bg-red-500' : memoryPercentage > 60 ? 'bg-yellow-500' : 'bg-green-500'}
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                    {memoryPercentage.toFixed(1)}% utilized
                                </p>
                            </div>

                            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Environment</h4>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-500 dark:text-gray-400">Node Version</span>
                                        <span className="font-mono text-gray-700 dark:text-gray-300">{health.environment.nodeVersion}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-500 dark:text-gray-400">Platform</span>
                                        <span className="font-mono text-gray-700 dark:text-gray-300 capitalize">{health.environment.platform}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
