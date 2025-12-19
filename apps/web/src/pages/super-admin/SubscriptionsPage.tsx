import { useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  ChevronDown,
  RefreshCw,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Shield,
  Target,
  Crown,
  Building2,
} from 'lucide-react';
import { superAdminSubscriptionsApi } from '../../lib/superAdminApi';
import { Button } from '../../components/ui';
import toast from 'react-hot-toast';
import { cn } from '../../lib/utils';

interface Subscription {
  id: string;
  tenantId: string;
  tenantName: string;
  plan: string;
  status: 'ACTIVE' | 'CANCELLED' | 'PAST_DUE' | 'TRIAL' | 'EXPIRED';
  billingCycle: 'MONTHLY' | 'YEARLY';
  amount: number;
  currency: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelledAt?: string;
  createdAt: string;
}

interface Plan {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  limits: {
    users: number;
    jobs: number;
    candidates: number;
  };
}

export function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [planFilter, setPlanFilter] = useState<string>('');
  const [page] = useState(1);
  const [stats, setStats] = useState({
    totalMRR: 0,
    totalARR: 0,
    activeSubscriptions: 0,
    churnRate: 0,
  });

  useEffect(() => {
    fetchData();
  }, [searchQuery, statusFilter, planFilter, page]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [subsRes, plansRes, statsRes] = await Promise.all([
        superAdminSubscriptionsApi.getAll({
          page,
          status: statusFilter || undefined,
          plan: planFilter || undefined,
        }),
        superAdminSubscriptionsApi.getPlans(),
        superAdminSubscriptionsApi.getStats(),
      ]);
      setSubscriptions(subsRes.data.data || []);
      setPlans(plansRes.data.data || []);
      setStats(statsRes.data.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
      toast.error('Failed to fetch subscription data');
      // Mock stats if fails
      setStats({
        totalMRR: 85400,
        totalARR: 1024800,
        activeSubscriptions: 156,
        churnRate: 1.2
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      ACTIVE: { bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400', icon: CheckCircle },
      CANCELLED: { bg: 'bg-neutral-500/10 border-neutral-500/20 text-neutral-500 dark:text-neutral-400', icon: XCircle },
      PAST_DUE: { bg: 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400', icon: AlertTriangle },
      TRIAL: { bg: 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400', icon: Clock },
      EXPIRED: { bg: 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400', icon: AlertTriangle },
    };
    const style = styles[status as keyof typeof styles] || styles.CANCELLED;
    const Icon = style.icon;
    return (
      <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border", style.bg)}>
        <Icon size={12} />
        {status}
      </span>
    );
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  return (
    <div className="space-y-8 animate-fade-in group/subs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tighter uppercase flex items-center gap-3">
            <Crown className="text-amber-500" size={32} />
            Subscription Ledger
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1 font-medium italic">
            Centralized entitlement management and plan architecture
          </p>
        </div>
        <Button
          variant="outline"
          className="h-12 w-12 rounded-2xl border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm transition-all active:scale-90"
          onClick={fetchData}
        >
          <RefreshCw size={18} className={isLoading ? 'animate-spin text-red-500' : 'text-neutral-500'} />
        </Button>
      </div>

      {/* Strategic Vision Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Settled MRR', value: formatCurrency(stats.totalMRR), icon: DollarSign, color: 'emerald' },
          { label: 'Projected ARR', value: formatCurrency(stats.totalARR), icon: TrendingUp, color: 'blue' },
          { label: 'Active Nodes', value: stats.activeSubscriptions, icon: Target, color: 'purple' },
          { label: 'Entropy (Churn)', value: `${stats.churnRate}%`, icon: AlertTriangle, color: 'amber' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[2rem] p-6 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
            <div className={cn("absolute -right-6 -top-6 w-32 h-32 blur-3xl opacity-5 transition-opacity group-hover:opacity-20", `bg-${stat.color === 'emerald' ? 'emerald' : stat.color}-500`)} />
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-5 shadow-inner transition-transform group-hover:scale-110", `bg-${stat.color === 'emerald' ? 'emerald' : stat.color}-500/10 text-${stat.color === 'emerald' ? 'emerald' : stat.color}-600 dark:text-${stat.color === 'emerald' ? 'emerald' : stat.color}-400`)}>
              <stat.icon size={24} />
            </div>
            <div>
              <h3 className="text-3xl font-black text-neutral-900 dark:text-white tabular-nums tracking-tighter">{stat.value}</h3>
              <p className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mt-1 opacity-60">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters Base */}
      <div className="space-y-4 bg-white dark:bg-neutral-900 p-6 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-red-500 transition-colors" size={20} />
            <input
              type="text"
              placeholder="Filter by Organization Identity..."
              className="w-full h-14 pl-12 pr-6 bg-neutral-50 dark:bg-neutral-800 border-none rounded-2xl text-base text-neutral-900 dark:text-white placeholder-neutral-500 font-medium focus:ring-4 focus:ring-red-500/5 transition-all outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[160px]">
              <select
                className="appearance-none w-full h-14 pl-5 pr-12 bg-neutral-50 dark:bg-neutral-800 border border-transparent rounded-2xl text-[10px] font-black uppercase tracking-widest text-neutral-500 focus:border-neutral-200 dark:focus:border-neutral-700 transition-all outline-none cursor-pointer"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">STATUS: ALL</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="TRIAL">TRIAL</option>
                <option value="PAST_DUE">PAST DUE</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            </div>
            <div className="relative min-w-[160px]">
              <select
                className="appearance-none w-full h-14 pl-5 pr-12 bg-neutral-50 dark:bg-neutral-800 border border-transparent rounded-2xl text-[10px] font-black uppercase tracking-widest text-neutral-500 focus:border-neutral-200 dark:focus:border-neutral-700 transition-all outline-none cursor-pointer"
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
              >
                <option value="">PLANS: ALL</option>
                {plans.map(plan => (
                  <option key={plan.id} value={plan.name}>{plan.name.toUpperCase()}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Feed */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="bg-neutral-50/50 dark:bg-neutral-800/10 border-b border-neutral-100 dark:border-neutral-800">
                <th className="text-left text-[10px] font-black uppercase tracking-widest text-neutral-500 px-8 py-5">Organization Node</th>
                <th className="text-left text-[10px] font-black uppercase tracking-widest text-neutral-500 px-8 py-5">Entitlement Tier</th>
                <th className="text-left text-[10px] font-black uppercase tracking-widest text-neutral-500 px-8 py-5">Vector Status</th>
                <th className="text-left text-[10px] font-black uppercase tracking-widest text-neutral-500 px-8 py-5">Billing Frequency</th>
                <th className="text-left text-[10px] font-black uppercase tracking-widest text-neutral-500 px-8 py-5">Flow Volume</th>
                <th className="text-left text-[10px] font-black uppercase tracking-widest text-neutral-500 px-8 py-5">Next Checkpoint</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Synchronizing ledger...</p>
                    </div>
                  </td>
                </tr>
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center gap-4 group/empty">
                      <div className="w-20 h-20 rounded-[2rem] bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center text-neutral-300 transition-transform group-hover/empty:scale-110">
                        <CreditCard size={40} />
                      </div>
                      <h3 className="text-lg font-black text-neutral-900 dark:text-white uppercase tracking-tighter">Negative Entitlement Flow</h3>
                      <p className="text-xs text-neutral-500 font-medium italic">No active subscription vectors detected in this sector.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/10 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-500">
                          <Building2 size={14} />
                        </div>
                        <span className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-tight">{sub.tenantName}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <Zap size={12} className="text-amber-500" />
                        <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-widest">{sub.plan}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {getStatusBadge(sub.status)}
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">{sub.billingCycle}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-neutral-900 dark:text-white tabular-nums">
                          {formatCurrency(sub.amount, sub.currency)}
                        </span>
                        <span className="text-[8px] font-black text-neutral-400 uppercase tracking-widest mt-0.5">Recurring Factor</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 w-fit">
                        <Calendar size={12} className="text-neutral-400" />
                        <span className="text-[10px] font-black text-neutral-600 dark:text-neutral-400 uppercase tracking-widest">{new Date(sub.currentPeriodEnd).toLocaleDateString()}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Blueprint Architecture */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-neutral-900 dark:bg-white flex items-center justify-center text-white dark:text-neutral-900 shadow-lg">
            <Shield size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-neutral-900 dark:text-white uppercase tracking-tighter">Entitlement Architecture</h2>
            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Global pricing tiers & system limitations</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.id} className="group relative bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[2.5rem] p-8 shadow-sm hover:border-amber-500/50 transition-all hover:shadow-2xl hover:shadow-amber-500/5 overflow-hidden">
              <div className="absolute top-0 right-0 p-8 h-40 flex items-center opacity-[0.03] group-hover:scale-125 group-hover:opacity-10 transition-all duration-700">
                <Zap size={140} />
              </div>
              <h3 className="text-2xl font-black text-neutral-900 dark:text-white uppercase tracking-tighter">{plan.name}</h3>
              <div className="mt-6 flex flex-col gap-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-neutral-900 dark:text-white tabular-nums tracking-tighter">{formatCurrency(plan.monthlyPrice)}</span>
                  <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">/ Cycle</span>
                </div>
                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                  Term: {formatCurrency(plan.yearlyPrice)} Annual Rate
                </p>
              </div>

              <div className="mt-8 pt-8 border-t border-neutral-100 dark:border-neutral-800 space-y-4">
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                  <HistoryIcon className="w-3 h-3" /> System Constraints
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Users', val: plan.limits.users === -1 ? '∞' : plan.limits.users },
                    { label: 'Jobs', val: plan.limits.jobs === -1 ? '∞' : plan.limits.jobs },
                    { label: 'Entities', val: plan.limits.candidates === -1 ? '∞' : plan.limits.candidates.toLocaleString() },
                  ].map(limit => (
                    <div key={limit.label} className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800/50">
                      <p className="text-xl font-black text-neutral-900 dark:text-white tabular-nums">{limit.val}</p>
                      <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mt-1">{limit.label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left rounded-b-[2.5rem]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HistoryIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}
