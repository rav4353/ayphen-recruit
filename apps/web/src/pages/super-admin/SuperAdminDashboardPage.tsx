import { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Activity,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Briefcase,
  FileText,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { superAdminDashboardApi } from '../../lib/superAdminApi';
import { Button } from '../../components/ui';
import toast from 'react-hot-toast';
import { cn } from '../../lib/utils';

interface DashboardStats {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalJobs: number;
  totalCandidates: number;
  tenantsGrowth: number;
  usersGrowth: number;
  revenueGrowth: number;
}

interface RecentActivity {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId?: string;
  tenantId?: string;
  tenantName?: string;
  userName?: string;
  createdAt: string;
  details?: Record<string, unknown>;
}

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  database: 'up' | 'down';
  redis: 'up' | 'down';
  email: 'up' | 'down';
  storage: 'up' | 'down';
  lastChecked: string;
}

export function SuperAdminDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<RecentActivity[]>([]);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, activityRes, healthRes] = await Promise.all([
        superAdminDashboardApi.getStats(),
        superAdminDashboardApi.getRecentActivity(10),
        superAdminDashboardApi.getSystemHealth(),
      ]);

      setStats(statsRes.data.data);
      setActivity(activityRes.data.data || []);
      setHealth(healthRes.data.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
      toast.error('Failed to fetch dashboard overview');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'up':
        return 'text-green-600 dark:text-green-500';
      case 'degraded':
        return 'text-amber-600 dark:text-amber-500';
      default:
        return 'text-red-600 dark:text-red-500';
    }
  };

  const getActivityIcon = (action: string) => {
    if (action.includes('create')) return <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500"><CheckCircle size={16} /></div>;
    if (action.includes('delete')) return <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500"><AlertTriangle size={16} /></div>;
    if (action.includes('update')) return <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500"><Activity size={16} /></div>;
    return <div className="w-8 h-8 rounded-lg bg-neutral-500/10 flex items-center justify-center text-neutral-500"><Clock size={16} /></div>;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-black text-neutral-500 uppercase tracking-widest">Aggregating Global Intelligence...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tight uppercase">Control Center</h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1 font-medium transition-colors">
            Aggregate performance telemetry and platform health metrics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 h-11 px-5 rounded-xl font-bold transition-all active:scale-95"
            onClick={fetchDashboardData}
          >
            <Zap size={18} className="mr-2 text-amber-500" />
            Live Sync
          </Button>
        </div>
      </div>

      {/* System Health Status Bar */}
      {health && (
        <div className={cn(
          "rounded-2xl p-4 border shadow-sm transition-all animate-pulse-subtle",
          health.status === 'healthy'
            ? 'bg-emerald-500/[0.03] border-emerald-500/20'
            : health.status === 'degraded'
              ? 'bg-amber-500/[0.03] border-amber-500/20'
              : 'bg-red-500/[0.03] border-red-500/20'
        )}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shadow-inner",
                health.status === 'healthy' ? 'bg-emerald-500/10 text-emerald-600' :
                  health.status === 'degraded' ? 'bg-amber-500/10 text-amber-600' : 'bg-red-500/10 text-red-600'
              )}>
                <ShieldCheck size={20} />
              </div>
              <div>
                <p className={cn("font-black text-sm uppercase tracking-wider", getHealthStatusColor(health.status))}>
                  Platform {health.status}
                </p>
                <p className="text-[10px] text-neutral-500 font-bold uppercase mt-0.5">Primary Node Infrastructure</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              {[
                { label: 'Database', key: 'database' as keyof SystemHealth },
                { label: 'Cache/Redis', key: 'redis' as keyof SystemHealth },
                { label: 'SMTP/Mail', key: 'email' as keyof SystemHealth },
                { label: 'S3/Storage', key: 'storage' as keyof SystemHealth },
              ].map((item) => (
                <div key={item.key} className="flex items-center gap-1.5 bg-white dark:bg-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-100 dark:border-neutral-800 shadow-sm">
                  <div className={cn("w-1.5 h-1.5 rounded-full", health[item.key] === 'up' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500')} />
                  <span className="text-[10px] font-black text-neutral-600 dark:text-neutral-400 uppercase tracking-widest">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Global Organizations', value: stats?.totalTenants, sub: `${stats?.activeTenants} Active Nodes`, icon: Building2, color: 'blue', growth: stats?.tenantsGrowth },
          { label: 'Identified Users', value: stats?.totalUsers, sub: `${stats?.activeUsers} MAU Active`, icon: Users, color: 'purple', growth: stats?.usersGrowth },
          { label: 'Monthly Recurring', value: formatCurrency(stats?.monthlyRevenue || 0), sub: `Total: ${formatCurrency(stats?.totalRevenue || 0)}`, icon: DollarSign, color: 'emerald', growth: stats?.revenueGrowth },
          { label: 'System Pipeline', value: stats?.totalJobs, sub: `${stats?.totalCandidates} Active Candidates`, icon: Briefcase, color: 'orange', growth: null },
        ].map((item, i) => (
          <div key={i} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[2rem] p-6 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
            <div className={cn("absolute top-0 right-0 w-32 h-32 blur-3xl opacity-10 transition-opacity group-hover:opacity-20", `bg-${item.color}-500`)} />
            <div className="flex items-center justify-between relative z-10">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110", `bg-${item.color === 'emerald' ? 'emerald' : item.color}-500/10 text-${item.color === 'emerald' ? 'emerald' : item.color}-600 dark:text-${item.color === 'emerald' ? 'emerald' : item.color}-400`)}>
                <item.icon size={24} />
              </div>
              {item.growth !== null && (
                <div className={cn("flex items-center gap-1 text-xs font-black px-2 py-1 rounded-lg border",
                  (item.growth || 0) >= 0
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                    : 'bg-red-50 text-red-600 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                )}>
                  {(item.growth || 0) >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {Math.abs(item.growth || 0)}%
                </div>
              )}
            </div>
            <div className="mt-6 relative z-10">
              <h3 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tighter tabular-nums leading-none">
                {item.value}
              </h3>
              <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mt-3 opacity-80">{item.label}</p>
              <p className="text-xs font-bold text-neutral-400 mt-1">{item.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Strategic Nav Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[
          { label: 'Network Distribution', sub: 'Global organization cluster management', icon: Building2, color: 'blue', path: '/super-admin/tenants' },
          { label: 'Revenue Streams', sub: 'Subscription analytics and billing hooks', icon: CreditCard, color: 'emerald', path: '/super-admin/subscriptions' },
          { label: 'Immutable Audit', sub: 'Cryptographic system activity verification', icon: FileText, color: 'purple', path: '/super-admin/audit-logs' },
        ].map((action, i) => (
          <button
            key={i}
            onClick={() => navigate(action.path)}
            className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 hover:border-neutral-400 dark:hover:border-neutral-600 transition-all text-left group shadow-sm hover:shadow-xl hover:-translate-y-1"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all group-hover:rotate-6", `bg-${action.color === 'emerald' ? 'emerald' : action.color}-500/10 text-${action.color === 'emerald' ? 'emerald' : action.color}-600`)}>
                  <action.icon size={28} />
                </div>
                <div>
                  <h3 className="text-neutral-900 dark:text-white font-black text-lg uppercase tracking-tight">{action.label}</h3>
                  <p className="text-neutral-500 text-xs font-bold mt-1 leading-relaxed">{action.sub}</p>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 text-neutral-400 group-hover:bg-neutral-900 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-neutral-900 transition-all">
                <ArrowUpRight size={20} />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Telemetry Stream / Recent Activity */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="px-8 py-6 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-transparent transition-colors">
          <div>
            <h2 className="text-xl font-black text-neutral-900 dark:text-white uppercase tracking-tighter">Event Telemetry Feed</h2>
            <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest mt-1">Real-time platform activity stream</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-neutral-400 hover:text-red-500 font-black uppercase tracking-widest text-xs h-10 px-4 rounded-xl hover:bg-red-500/5 transition-all"
            onClick={() => navigate('/super-admin/audit-logs')}
          >
            Terminal Access
            <ArrowUpRight size={14} className="ml-2" />
          </Button>
        </div>
        <div className="divide-y divide-neutral-50 dark:divide-neutral-800">
          {activity.length === 0 ? (
            <div className="px-8 py-16 text-center text-neutral-400 font-medium italic">
              System silence: no recent telemetry packets detected.
            </div>
          ) : (
            activity.map((item) => (
              <div key={item.id} className="px-8 py-5 flex items-center gap-6 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/10 transition-colors">
                <div className="flex-shrink-0">
                  {getActivityIcon(item.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200 leading-relaxed">
                    <span className="text-neutral-900 dark:text-white font-black underline decoration-red-500/20 underline-offset-4">{item.userName || 'Root Node'}</span>
                    {' '}<span className="text-neutral-500 uppercase text-[10px] font-black tracking-widest mx-1">{item.action.replace('_', ' ')}</span>{' '}
                    <span className="text-neutral-500 font-medium">{item.entityType}</span>
                  </p>
                  {item.tenantName && (
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                      <Building2 size={12} className="opacity-50" />
                      Cluster: {item.tenantName}
                    </p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] font-black text-neutral-900 dark:text-white uppercase tabular-nums">
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </p>
                  <p className="text-[9px] font-bold text-neutral-400 uppercase mt-0.5">
                    {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
