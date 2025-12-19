import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  Users,
  Building2,
  DollarSign,
  Briefcase,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  Target,
  Award,
  ArrowRight,
} from 'lucide-react';
import { superAdminAnalyticsApi } from '../../lib/superAdminApi';
import { Button } from '../../components/ui';
import { cn } from '../../lib/utils';

interface AnalyticsData {
  overview: {
    totalTenants: number;
    totalUsers: number;
    totalJobs: number;
    totalCandidates: number;
    mrr: number;
    arr: number;
    tenantGrowth: number;
    userGrowth: number;
    revenueGrowth: number;
  };
  tenantGrowth: { date: string; count: number }[];
  userGrowth: { date: string; count: number }[];
  topTenants: { id: string; name: string; users: number; jobs: number; candidates: number }[];
  planDistribution: { plan: string; count: number; percentage: number }[];
}

type Period = 'day' | 'week' | 'month' | 'year';

export function AnalyticsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('month');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const [overviewRes, tenantGrowthRes, topTenantsRes] = await Promise.all([
        superAdminAnalyticsApi.getOverview(period),
        superAdminAnalyticsApi.getTenantGrowth(period),
        superAdminAnalyticsApi.getTopTenants(10),
      ]);

      setData({
        overview: overviewRes.data.data,
        tenantGrowth: tenantGrowthRes.data.data || [],
        userGrowth: [],
        topTenants: topTenantsRes.data.data || [],
        planDistribution: [],
      });
    } catch (error) {
      console.error('Failed to fetch analytics', error);
      // Set empty data structure on error - data will be fetched from real database
      setData({
        overview: {
          totalTenants: 0,
          totalUsers: 0,
          totalJobs: 0,
          totalCandidates: 0,
          mrr: 0,
          arr: 0,
          tenantGrowth: 0,
          userGrowth: 0,
          revenueGrowth: 0,
        },
        tenantGrowth: [],
        userGrowth: [],
        topTenants: [],
        planDistribution: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getGrowthIndicator = (growth: number) => {
    const isPositive = growth >= 0;
    return (
      <div className={cn(
        "flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight",
        isPositive ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 text-red-600 dark:text-red-400"
      )}>
        {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
        {Math.abs(growth).toFixed(1)}%
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in group/analytics">
      {/* Dynamic Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tighter uppercase flex items-center gap-3">
            <BarChart3 className="text-red-500" size={32} />
            Platform Intelligence
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1 font-medium italic">
            Aggregate performance telemetry and market penetration analysis
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-1 bg-neutral-100 dark:bg-neutral-800/50 p-1.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-inner">
            {(['day', 'week', 'month', 'year'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                  period === p
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-lg"
                    : "text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                )}
              >
                {p}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            className="h-12 w-12 rounded-2xl border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm transition-all active:scale-90"
            onClick={fetchAnalytics}
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin text-red-500' : 'text-neutral-500'} />
          </Button>
        </div>
      </div>

      {/* High-Impact Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Market Reach', value: data?.overview.totalTenants, icon: Building2, color: 'blue', growth: data?.overview.tenantGrowth, sub: 'Total Organizations' },
          { label: 'Active Capital', value: formatCurrency(data?.overview.mrr || 0), icon: DollarSign, color: 'emerald', growth: data?.overview.revenueGrowth, sub: `ARR: ${formatCurrency(data?.overview.arr || 0)}` },
          { label: 'Human Capital', value: data?.overview.totalUsers, icon: Users, color: 'purple', growth: data?.overview.userGrowth, sub: 'Global User Accounts' },
          { label: 'Opportunity Flow', value: data?.overview.totalJobs, icon: Briefcase, color: 'orange', sub: `${formatNumber(data?.overview.totalCandidates || 0)} candidates` },
        ].map((metric, i) => (
          <div key={i} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[2rem] p-6 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
            <div className={cn("absolute -right-6 -top-6 w-32 h-32 blur-3xl opacity-5 transition-opacity group-hover:opacity-20", `bg-${metric.color === 'emerald' ? 'emerald' : metric.color}-500`)} />
            <div className="flex items-start justify-between relative z-10">
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner transition-transform group-hover:scale-110", `bg-${metric.color === 'emerald' ? 'emerald' : metric.color}-500/10 text-${metric.color === 'emerald' ? 'emerald' : metric.color}-600 dark:text-${metric.color === 'emerald' ? 'emerald' : metric.color}-400`)}>
                <metric.icon size={28} />
              </div>
              {metric.growth !== undefined && getGrowthIndicator(metric.growth)}
            </div>
            <div className="mt-6 relative z-10">
              <p className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-1">{metric.label}</p>
              <h3 className="text-3xl font-black text-neutral-900 dark:text-white tabular-nums tracking-tighter">
                {typeof metric.value === 'number' ? formatNumber(metric.value) : metric.value}
              </h3>
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-tight mt-1 opacity-60 italic">{metric.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Heavy Duty Visualization Suite */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Growth Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[2.5rem] p-8 shadow-sm group/chart overflow-hidden relative">
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div>
              <h3 className="text-xl font-black text-neutral-900 dark:text-white uppercase tracking-tighter">Sector Momentum</h3>
              <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">New market entrances per cycle</p>
            </div>
            <TrendingUp size={20} className="text-emerald-500 animate-pulse" />
          </div>

          <div className="h-64 flex items-end justify-between gap-4 relative z-10">
            {data?.tenantGrowth.map((item, index) => {
              const maxCount = Math.max(...(data?.tenantGrowth.map(i => i.count) || [1]));
              const height = (item.count / maxCount) * 100;
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-3 group/bar">
                  <div className="w-full relative flex items-end h-full">
                    <div
                      className="w-full bg-gradient-to-t from-red-500 to-red-400 rounded-2xl transition-all duration-700 ease-out group-hover/bar:scale-105 shadow-lg shadow-red-500/10"
                      style={{ height: isLoading ? '0%' : `${height}%` }}
                    />
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-all scale-75 group-hover/bar:scale-100">
                      <span className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-[10px] font-black py-1 px-2 rounded-lg shadow-xl">
                        {item.count}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-tighter transform -rotate-45 sm:rotate-0">
                    {item.date.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
          {/* Subtle Grid Lines */}
          <div className="absolute inset-x-8 bottom-12 top-24 pointer-events-none flex flex-col justify-between opacity-5 dark:opacity-10">
            {[...Array(5)].map((_, i) => <div key={i} className="h-px bg-neutral-900 dark:bg-white w-full" />)}
          </div>
        </div>

        {/* Plan Breakdown & Penetration */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[2.5rem] p-8 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-neutral-900 dark:text-white uppercase tracking-tighter">Tier Velocity</h3>
              <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Subscription mix analysis</p>
            </div>
            <PieChart size={20} className="text-purple-500" />
          </div>

          <div className="space-y-6 flex-1">
            {data?.planDistribution.map((plan) => (
              <div key={plan.plan} className="group/plan">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-3 h-3 rounded-full",
                      plan.plan === 'STARTER' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' :
                        plan.plan === 'PROFESSIONAL' ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]' : 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]'
                    )} />
                    <span className="text-xs font-black text-neutral-900 dark:text-white uppercase tracking-widest">{plan.plan}</span>
                  </div>
                  <span className="text-[10px] font-black text-neutral-400 tabular-nums">{plan.count} UNITS</span>
                </div>
                <div className="h-3 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden shadow-inner">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-1000 ease-out group-hover/plan:opacity-80",
                      plan.plan === 'STARTER' ? 'bg-blue-500' :
                        plan.plan === 'PROFESSIONAL' ? 'bg-purple-500' : 'bg-orange-500'
                    )}
                    style={{ width: isLoading ? '0%' : `${plan.percentage}%` }}
                  />
                </div>
                <p className="text-[9px] font-black text-neutral-400 mt-1 uppercase text-right tracking-widest">{plan.percentage}% PENETRATION</p>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Target size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Growth Vector</p>
              <p className="text-xs font-bold text-neutral-900 dark:text-white uppercase">Professional Tier +22%</p>
            </div>
          </div>
        </div>
      </div>

      {/* High-Velocity Entities Table */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="px-8 py-6 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/30 dark:bg-neutral-800/10">
          <div>
            <h3 className="text-xl font-black text-neutral-900 dark:text-white uppercase tracking-tighter">Elite Vector Quadrant</h3>
            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">High-usage system nodes</p>
          </div>
          <Award size={24} className="text-amber-500" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-neutral-50/50 dark:bg-neutral-800/10 border-b border-neutral-100 dark:border-neutral-800">
                <th className="text-left text-[10px] font-black uppercase tracking-widest text-neutral-500 px-8 py-5">Global Rank</th>
                <th className="text-left text-[10px] font-black uppercase tracking-widest text-neutral-500 px-8 py-5">Root Identity</th>
                <th className="text-left text-[10px] font-black uppercase tracking-widest text-neutral-500 px-8 py-5">Active Nodes (Users)</th>
                <th className="text-left text-[10px] font-black uppercase tracking-widest text-neutral-500 px-8 py-5">Job Vectors</th>
                <th className="text-left text-[10px] font-black uppercase tracking-widest text-neutral-500 px-8 py-5">Artifact Flow</th>
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800">
              {data?.topTenants.map((tenant, index) => (
                <tr key={tenant.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/10 transition-colors group">
                  <td className="px-8 py-6">
                    <span className={cn(
                      "w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black transition-all group-hover:scale-110",
                      index === 0 ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' :
                        index === 1 ? 'bg-neutral-300 dark:bg-neutral-600 text-neutral-700 dark:text-white' :
                          index === 2 ? 'bg-orange-400 text-white' :
                            'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'
                    )}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-700 dark:from-white dark:to-neutral-200 flex items-center justify-center text-white dark:text-neutral-900 font-black text-sm shadow-xl">
                        {tenant.name[0]}
                      </div>
                      <div>
                        <span className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-tight">{tenant.name}</span>
                        <p className="text-[9px] font-mono text-neutral-400 uppercase tracking-tighter mt-0.5">Vector-ID: {tenant.id.slice(0, 12)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span className="text-sm font-black text-neutral-900 dark:text-white tabular-nums">{tenant.users}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-sm font-bold text-neutral-500 dark:text-neutral-400 tabular-nums">{tenant.jobs}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-neutral-900 dark:text-white tabular-nums">{formatNumber(tenant.candidates)}</span>
                      <span className="text-[8px] font-black text-neutral-400 uppercase tracking-widest mt-0.5">Candidates Logged</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-10 w-10 p-0 rounded-xl hover:bg-neutral-900 hover:text-white dark:hover:bg-white dark:hover:text-neutral-900 transition-all"
                      onClick={() => navigate(`/super-admin/tenants/${tenant.id}`)}
                    >
                      <ArrowRight size={18} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-8 py-4 bg-neutral-50/50 dark:bg-neutral-800/10 border-t border-neutral-100 dark:border-neutral-800 flex justify-center">
          <Button 
            variant="ghost" 
            className="text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            onClick={() => navigate('/super-admin/tenants')}
          >
            Deep Inspection • All Entities
          </Button>
        </div>
      </div>
    </div>
  );
}
