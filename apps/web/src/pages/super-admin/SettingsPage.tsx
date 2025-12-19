import { useState, useEffect } from 'react';
import {
  Settings,
  Mail,
  Shield,
  Key,
  Save,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Zap,
  Server,
  Lock,
  Globe,
  Cpu,
  Send,
  Plus,
  ShieldCheck,
  Activity,
} from 'lucide-react';
import { superAdminSettingsApi } from '../../lib/superAdminApi';
import { Button, Input } from '../../components/ui';
import toast from 'react-hot-toast';
import { cn } from '../../lib/utils';

interface EmailConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  fromEmail: string;
  fromName: string;
  secure: boolean;
}

interface SystemSettings {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  allowNewRegistrations: boolean;
  requireEmailVerification: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  global_mfa_enforced: boolean;
}

interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
}

type TabType = 'general' | 'email' | 'security' | 'features' | 'maintenance';

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [emailConfig, setEmailConfig] = useState<EmailConfig>({
    host: '',
    port: 587,
    user: '',
    password: '',
    fromEmail: '',
    fromName: '',
    secure: true,
  });

  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    maintenanceMode: false,
    maintenanceMessage: '',
    allowNewRegistrations: true,
    requireEmailVerification: true,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    global_mfa_enforced: false,
  });

  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [testEmailTo, setTestEmailTo] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const [settingsRes, emailRes, flagsRes] = await Promise.all([
        superAdminSettingsApi.getAll(),
        superAdminSettingsApi.getEmailConfig(),
        superAdminSettingsApi.getFeatureFlags(),
      ]);

      if (settingsRes.data.data) {
        setSystemSettings(prev => ({ ...prev, ...settingsRes.data.data }));
      }
      if (emailRes.data.data) {
        setEmailConfig(prev => ({ ...prev, ...emailRes.data.data }));
      }
      if (flagsRes.data.data) {
        setFeatureFlags(flagsRes.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch settings', error);
      toast.error('Failed to load settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEmailConfig = async () => {
    setIsSaving(true);
    try {
      await superAdminSettingsApi.updateEmailConfig(emailConfig as unknown as Record<string, unknown>);
      toast.success('Email protocols updated');
    } catch (error) {
      toast.error('Failed to commit email config');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmailTo) {
      toast.error('Please enter an email address');
      return;
    }
    try {
      await superAdminSettingsApi.testEmail(testEmailTo);
      toast.success(`Test transmission sent to ${testEmailTo}`);
    } catch (error) {
      toast.error('Failed to send test transmission');
    }
  };

  const handleSaveSystemSettings = async () => {
    setIsSaving(true);
    try {
      for (const [key, value] of Object.entries(systemSettings)) {
        await superAdminSettingsApi.update(key, value);
      }
      toast.success('System configuration saved');
    } catch (error) {
      toast.error('Failed to save system config');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleFeature = async (flag: FeatureFlag) => {
    try {
      await superAdminSettingsApi.updateFeatureFlag(flag.key, !flag.enabled);
      setFeatureFlags(flags =>
        flags.map(f => f.key === flag.key ? { ...f, enabled: !f.enabled } : f)
      );
      toast.success(`${flag.name} ${!flag.enabled ? 'activated' : 'deactivated'}`);
    } catch (error) {
      toast.error('Failed to update feature state');
    }
  };

  const handleToggleMaintenance = async () => {
    try {
      await superAdminSettingsApi.setMaintenanceMode(
        !systemSettings.maintenanceMode,
        systemSettings.maintenanceMessage
      );
      setSystemSettings(prev => ({
        ...prev,
        maintenanceMode: !prev.maintenanceMode,
      }));
      toast.success(`Maintenance mode ${!systemSettings.maintenanceMode ? 'ENGAGED' : 'DISENGAGED'}`);
    } catch (error) {
      toast.error('Failed to toggle maintenance state');
    }
  };

  const tabs = [
    { id: 'general' as TabType, name: 'System Core', icon: Settings, desc: 'Global orchestration' },
    { id: 'email' as TabType, name: 'Comms Stack', icon: Mail, desc: 'SMTP & Notification routes' },
    { id: 'security' as TabType, name: 'Security Posture', icon: Shield, desc: 'Auth & Session policies' },
    { id: 'features' as TabType, name: 'Feature Matrix', icon: Zap, desc: 'Modular capabilities' },
    { id: 'maintenance' as TabType, name: 'Platform Ops', icon: Activity, desc: 'Service & Maintenance' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in group/settings">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tighter uppercase flex items-center gap-3">
            <Settings className="text-red-500" size={32} />
            System Configuration
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1 font-medium italic">
            Core engine tuning and platform-wide policy orchestration
          </p>
        </div>
        <Button
          variant="outline"
          className="h-12 w-12 rounded-2xl border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm transition-all active:scale-90"
          onClick={fetchSettings}
        >
          <RefreshCw size={18} className={isLoading ? 'animate-spin text-red-500' : 'text-neutral-500'} />
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 min-h-0">
        {/* Navigation Sidebar */}
        <div className="w-full lg:w-72 shrink-0">
          <div className="flex flex-col gap-2 bg-white dark:bg-neutral-900 p-2 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-800 shadow-sm">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-4 px-5 py-4 rounded-[2rem] transition-all relative group",
                  activeTab === tab.id
                    ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-xl"
                    : "text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-white"
                )}
              >
                <tab.icon size={18} />
                <div className="text-left">
                  <p className="text-[10px] font-black uppercase tracking-widest leading-none">{tab.name}</p>
                  <p className={cn("text-[8px] font-bold uppercase mt-1 opacity-60 tracking-tight", activeTab === tab.id ? "text-white/70 dark:text-neutral-400" : "text-neutral-400")}>{tab.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col h-full">
            <div className="flex-1 p-8 space-y-10 custom-scrollbar overflow-y-auto max-h-[calc(100vh-280px)]">
              {/* General Section */}
              {activeTab === 'general' && (
                <div className="space-y-10 animate-slide-in">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <Server className="text-red-500" size={20} />
                      <h3 className="text-lg font-black text-neutral-900 dark:text-white uppercase tracking-tighter">Maintenance Protocol</h3>
                    </div>
                    <div className={cn(
                      "p-8 rounded-[2rem] border transition-all",
                      systemSettings.maintenanceMode ? "bg-red-500/5 border-red-500/20 shadow-lg shadow-red-500/5" : "bg-emerald-500/5 border-emerald-500/20"
                    )}>
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner",
                            systemSettings.maintenanceMode ? "bg-red-500 text-white" : "bg-emerald-500 text-white"
                          )}>
                            {systemSettings.maintenanceMode ? <AlertTriangle size={28} /> : <CheckCircle size={28} />}
                          </div>
                          <div>
                            <p className="text-xs font-black text-neutral-900 dark:text-white uppercase tracking-widest">{systemSettings.maintenanceMode ? 'SYSTEM TERMINATED (MAINTENANCE)' : 'SYSTEM OPERATIONAL'}</p>
                            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-tight mt-1">Status: Primary Node Active</p>
                          </div>
                        </div>
                        <button
                          onClick={handleToggleMaintenance}
                          className={cn(
                            "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg",
                            systemSettings.maintenanceMode ? "bg-emerald-500 text-white shadow-emerald-500/20" : "bg-red-500 text-white shadow-red-500/20"
                          )}
                        >
                          {systemSettings.maintenanceMode ? 'REACTIVATE SYSTEM' : 'ENGAGE MAINTENANCE'}
                        </button>
                      </div>
                      <textarea
                        className="w-full h-24 px-6 py-4 bg-white dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-2xl text-sm font-medium text-neutral-900 dark:text-white placeholder-neutral-400 focus:ring-4 focus:ring-red-500/5 transition-all outline-none resize-none"
                        placeholder="Broadcast maintenance message..."
                        value={systemSettings.maintenanceMessage}
                        onChange={(e) => setSystemSettings(prev => ({ ...prev, maintenanceMessage: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <Globe className="text-blue-500" size={20} />
                      <h3 className="text-lg font-black text-neutral-900 dark:text-white uppercase tracking-tighter">Registration & Entry</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[
                        { id: 'allowNewRegistrations', label: 'Organization Entry', desc: 'Permit new entity signups', icon: Plus },
                        { id: 'requireEmailVerification', label: 'Identity Verification', desc: 'Enforce protocol handshakes', icon: ShieldCheck },
                      ].map((field) => (
                        <div key={field.id} className="p-6 rounded-[2rem] bg-neutral-50 dark:bg-neutral-800/30 border border-neutral-100 dark:border-neutral-800 transition-all hover:border-neutral-200 dark:hover:border-neutral-700 group/item">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-white dark:bg-neutral-900 flex items-center justify-center text-neutral-400 group-hover/item:text-neutral-900 dark:group-hover/item:text-white shadow-sm transition-colors">
                                <field.icon size={18} />
                              </div>
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-900 dark:text-white">{field.label}</p>
                                <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest mt-0.5">{field.desc}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => setSystemSettings(prev => ({ ...prev, [field.id]: !prev[field.id as keyof SystemSettings] }))}
                              className={cn(
                                "w-12 h-6 rounded-full transition-all relative",
                                systemSettings[field.id as keyof SystemSettings] ? 'bg-emerald-500' : 'bg-neutral-300 dark:bg-neutral-700'
                              )}
                            >
                              <div className={cn(
                                "w-5 h-5 rounded-full bg-white shadow-lg transform transition-transform",
                                systemSettings[field.id as keyof SystemSettings] ? 'translate-x-6' : 'translate-x-1'
                              )} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Email Section */}
              {activeTab === 'email' && (
                <div className="space-y-10 animate-slide-in">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <Send className="text-purple-500" size={20} />
                      <h3 className="text-lg font-black text-neutral-900 dark:text-white uppercase tracking-tighter">Communications Engine (SMTP)</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[
                        { label: 'Network Host', id: 'host', placeholder: 'smtp.provider.net' },
                        { label: 'Bridge Port', id: 'port', placeholder: '587', type: 'number' },
                        { label: 'Access Node (User)', id: 'user', placeholder: 'api_node_01' },
                        { label: 'Secret Token', id: 'password', placeholder: '••••••••', type: 'password' },
                        { label: 'Outbound Entity', id: 'fromName', placeholder: 'TalentX System' },
                        { label: 'Broadcast Address', id: 'fromEmail', placeholder: 'relay@system.com' },
                      ].map((field) => (
                        <div key={field.id} className="space-y-2">
                          <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">{field.label}</label>
                          <div className="relative">
                            <input
                              type={field.type === 'password' && !showPassword ? 'password' : 'text'}
                              value={emailConfig[field.id as keyof EmailConfig] as string}
                              onChange={(e) => setEmailConfig(prev => ({ ...prev, [field.id]: field.type === 'number' ? parseInt(e.target.value) : e.target.value }))}
                              placeholder={field.placeholder}
                              className="w-full h-12 px-5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 rounded-xl text-sm font-bold placeholder-neutral-400 focus:ring-4 focus:ring-red-500/5 transition-all outline-none"
                            />
                            {field.type === 'password' && (
                              <button
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-900 transition-colors"
                              >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-8 rounded-[2rem] bg-neutral-50 dark:bg-neutral-800/30 border border-neutral-100 dark:border-neutral-800">
                    <h4 className="text-[10px] font-black text-neutral-900 dark:text-white uppercase tracking-widest mb-6 border-b border-neutral-100 dark:border-neutral-800 pb-4">Verification Handshake</h4>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Input
                        placeholder="Recipient for test packet..."
                        value={testEmailTo}
                        onChange={(e) => setTestEmailTo(e.target.value)}
                        className="h-12 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 rounded-xl shadow-inner px-5 flex-1"
                      />
                      <Button variant="outline" onClick={handleTestEmail} className="h-12 border-neutral-200 dark:border-neutral-800 text-[10px] font-black uppercase tracking-widest px-8 rounded-xl bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 shadow-sm transition-all active:scale-95">
                        Engage Test
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Section */}
              {activeTab === 'security' && (
                <div className="space-y-10 animate-slide-in">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <Lock className="text-amber-500" size={20} />
                      <h3 className="text-lg font-black text-neutral-900 dark:text-white uppercase tracking-tighter">Authentication Firewall</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[
                        { label: 'Session Velocity (Mins)', id: 'sessionTimeout', sub: 'Entropy Threshold' },
                        { label: 'Breach Tolerance', id: 'maxLoginAttempts', sub: 'Max Retries' },
                      ].map((field) => (
                        <div key={field.id} className="p-6 rounded-[2rem] bg-neutral-50 dark:bg-neutral-800/30 border border-neutral-100 dark:border-neutral-800">
                          <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-4">{field.label}</label>
                          <Input
                            type="number"
                            value={systemSettings[field.id as keyof SystemSettings] as number}
                            onChange={(e) => setSystemSettings(prev => ({ ...prev, [field.id]: parseInt(e.target.value) || 0 }))}
                            className="h-14 bg-white dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800 rounded-2xl text-xl font-black tabular-nums shadow-inner px-6"
                          />
                          <p className="text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-2 ml-1">{field.sub}</p>
                        </div>
                      ))}

                      {/* Global MFA Toggle */}
                      <div className="p-6 rounded-[2rem] bg-neutral-50 dark:bg-neutral-800/30 border border-neutral-100 dark:border-neutral-800 flex flex-col justify-between">
                        <div>
                          <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-2">Global MFA Enforcement</label>
                          <p className="text-[8px] font-bold text-neutral-500 uppercase tracking-widest">Mandatory secondary factor for all users</p>
                        </div>
                        <div className="mt-6 flex justify-end">
                          <button
                            onClick={() => setSystemSettings(prev => ({ ...prev, global_mfa_enforced: !prev.global_mfa_enforced }))}
                            className={cn(
                              "w-14 h-7 rounded-full transition-all relative",
                              (systemSettings as any).global_mfa_enforced ? 'bg-amber-500 shadow-lg shadow-amber-500/30' : 'bg-neutral-300 dark:bg-neutral-700'
                            )}
                          >
                            <div className={cn(
                              "w-5 h-5 rounded-full bg-white shadow-lg transform transition-transform",
                              (systemSettings as any).global_mfa_enforced ? 'translate-x-8' : 'translate-x-1'
                            )} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-8 rounded-[2rem] bg-red-500/5 border border-red-500/10 flex items-center justify-between group">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-[2rem] bg-red-500/10 flex items-center justify-center text-red-500 shadow-inner group-hover:scale-110 transition-transform">
                        <Key size={32} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-tight">Root Credentials Reset</h4>
                        <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-1">Force immediate secret lifecycle renewal</p>
                      </div>
                    </div>
                    <Button 
                      className="h-12 bg-red-500 hover:bg-red-600 text-white px-8 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-500/20 active:scale-95 transition-all"
                      onClick={async () => {
                        try {
                          await superAdminSettingsApi.update('force_password_reset', true);
                          toast.success('Password reset protocol initiated for all users');
                        } catch (error) {
                          toast.error('Failed to initiate password reset');
                        }
                      }}
                    >
                      Renew Hash
                    </Button>
                  </div>
                </div>
              )}

              {/* Features Section */}
              {activeTab === 'features' && (
                <div className="space-y-8 animate-slide-in">
                  <div className="flex items-center gap-3 mb-4">
                    <Cpu className="text-emerald-500" size={20} />
                    <h3 className="text-lg font-black text-neutral-900 dark:text-white uppercase tracking-tighter">Feature Module Matrix</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {featureFlags.map((flag) => (
                      <div key={flag.key} className="p-5 rounded-[2rem] border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/10 hover:border-neutral-200 dark:hover:border-neutral-700 transition-all group/flag relative overflow-hidden">
                        <div className="flex items-center justify-between relative z-10">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-inner",
                              flag.enabled ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-white dark:bg-neutral-900 text-neutral-300"
                            )}>
                              <Zap size={20} className={flag.enabled ? 'animate-pulse' : ''} />
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-900 dark:text-white">{flag.name}</p>
                              <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest mt-0.5 line-clamp-1 group-hover/flag:line-clamp-none transition-all">{flag.description}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleToggleFeature(flag)}
                            className={cn(
                              "w-12 h-6 rounded-full transition-all relative",
                              flag.enabled ? 'bg-emerald-500' : 'bg-neutral-300 dark:bg-neutral-700'
                            )}
                          >
                            <div className={cn(
                              "w-5 h-5 rounded-full bg-white shadow-lg transform transition-transform",
                              flag.enabled ? 'translate-x-6' : 'translate-x-1'
                            )} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {activeTab === 'maintenance' && (
                <div className="space-y-10 animate-slide-in">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <Activity className="text-red-500" size={20} />
                      <h3 className="text-lg font-black text-neutral-900 dark:text-white uppercase tracking-tighter">Emergency Lockdown</h3>
                    </div>

                    <div className="p-8 rounded-[2rem] bg-neutral-50 dark:bg-neutral-800/30 border border-neutral-100 dark:border-neutral-800 space-y-8">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-tight">Maintenance Mode</h4>
                          <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-1">Suspend platform throughput for all tenants</p>
                        </div>
                        <button
                          onClick={handleToggleMaintenance}
                          className={cn(
                            "w-20 h-10 rounded-full transition-all relative border-4",
                            systemSettings.maintenanceMode
                              ? 'bg-red-500 border-red-500/20'
                              : 'bg-neutral-300 dark:bg-neutral-700 border-neutral-200 dark:border-neutral-800'
                          )}
                        >
                          <div className={cn(
                            "w-6 h-6 rounded-full bg-white shadow-lg transform transition-transform",
                            systemSettings.maintenanceMode ? 'translate-x-10' : 'translate-x-1'
                          )} />
                        </button>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block">Broadcast Message</label>
                        <textarea
                          placeholder="Platform is currently undergoing scheduled maintenance..."
                          value={systemSettings.maintenanceMessage}
                          onChange={(e) => setSystemSettings(prev => ({ ...prev, maintenanceMessage: e.target.value }))}
                          className="w-full h-32 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-5 text-sm font-medium focus:ring-0 focus:border-red-500 transition-colors resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-8 rounded-[2rem] border-2 border-dashed border-neutral-200 dark:border-neutral-800 text-center">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest leading-loose max-w-md mx-auto">
                      Lockdown will immediately terminate all active tenant sessions and display the broadcast message on the login bulkhead.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Constant Action Footer */}
            <div className="px-8 py-6 bg-neutral-50 dark:bg-neutral-800/30 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Configuration Buffer: Ready</span>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  className="text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-neutral-900 transition-all font-sans"
                  onClick={() => fetchSettings()}
                >
                  Reset Buffer
                </Button>
                <Button
                  onClick={activeTab === 'email' ? handleSaveEmailConfig : handleSaveSystemSettings}
                  disabled={isSaving}
                  className="h-12 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-neutral-900/10 dark:shadow-white/5 active:scale-95 transition-all flex items-center gap-2"
                >
                  {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                  {isSaving ? 'Synching...' : 'Commit Changes'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
