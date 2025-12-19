import { Zap, RefreshCw, Clock, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui';

export default function MaintenancePage() {
    const retry = () => {
        window.location.href = '/dashboard';
    };

    return (
        <div className="min-h-screen bg-white dark:bg-neutral-950 flex items-center justify-center p-6 font-sans overflow-hidden relative">
            {/* Dynamic Background Grid */}
            <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.05]"
                style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #000 1px, transparent 0)', backgroundSize: '40px 40px' }} />

            {/* Abstract Gradient Glows */}
            <div className="absolute top-1/4 -left-20 w-80 h-80 bg-red-500/10 blur-[100px] rounded-full" />
            <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-blue-500/10 blur-[100px] rounded-full" />

            <div className="max-w-2xl w-full relative z-10">
                {/* Main Card */}
                <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-[3rem] p-12 shadow-2xl shadow-neutral-200/50 dark:shadow-none animate-scale-in">
                    <div className="flex flex-col items-center text-center space-y-10">
                        {/* Animated Icon Cluster */}
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-[2.5rem] bg-neutral-900 dark:bg-white flex items-center justify-center text-white dark:text-neutral-900 shadow-2xl transition-transform group-hover:rotate-6 duration-500 relative z-10">
                                <Zap size={64} className="animate-pulse" />
                            </div>
                            <div className="absolute -top-4 -right-4 w-12 h-12 rounded-2xl bg-red-500 flex items-center justify-center text-white shadow-lg animate-bounce duration-[3000ms]">
                                <Clock size={24} />
                            </div>
                            <div className="absolute -bottom-2 -left-6 w-14 h-14 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-xl animate-pulse">
                                <ShieldCheck size={28} />
                            </div>
                        </div>

                        {/* Typography */}
                        <div className="space-y-4">
                            <h1 className="text-5xl font-black text-neutral-900 dark:text-white tracking-tighter uppercase leading-none">
                                Platform <span className="text-red-500">Lockdown</span>
                            </h1>
                            <div className="h-1 w-24 bg-neutral-200 dark:bg-neutral-800 mx-auto rounded-full" />
                            <p className="text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-widest text-[10px]">
                                Global Maintenance Orchestration in Progress
                            </p>
                        </div>

                        {/* Broadcast Terminal */}
                        <div className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 rounded-[2rem] p-8 text-left relative overflow-hidden group/terminal">
                            <div className="flex gap-1.5 mb-4">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500/20" />
                                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20" />
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20" />
                            </div>
                            <p className="text-neutral-600 dark:text-neutral-400 text-sm font-medium leading-relaxed italic">
                                "Technical teams are currently performing critical infrastructure upgrades. All application services are suspended to ensure data atomicity. We appreciate your patience during this strategic blackout."
                            </p>
                            <div className="absolute bottom-4 right-6 opacity-20 group-hover/terminal:opacity-100 transition-opacity">
                                <RefreshCw size={16} className="animate-spin duration-[4000ms]" />
                            </div>
                        </div>

                        {/* Action Group */}
                        <div className="flex flex-col sm:flex-row gap-4 w-full pt-4">
                            <Button
                                onClick={retry}
                                className="h-16 flex-1 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                            >
                                <RefreshCw size={18} />
                                Re-Establish Connection
                            </Button>
                        </div>
                    </div>
                </div>

                {/* System Status Footer */}
                <div className="mt-8 flex items-center justify-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Mainframe: Suspended</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Admin Hub: Active</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
