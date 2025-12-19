import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  Activity,
  Bell,
  ChevronDown,
  FileText,
  BarChart3,
  AlertTriangle,
  MessageSquare,
  Receipt,
  Database,
  Webhook,
  Sun,
  Moon,
} from 'lucide-react';
import { useSuperAdminStore } from '../stores/superAdmin';
import { cn } from '../lib/utils';
import { NotificationDropdown } from '../components/super-admin/NotificationDropdown';
import { useSuperAdminSocket } from '../hooks/useSuperAdminSocket';
import logoLight from '../assets/branding/logo_light_theme.png';

const navigation = [
  { name: 'Dashboard', href: '/super-admin/dashboard', icon: LayoutDashboard },
  { name: 'Monitoring', href: '/super-admin/monitoring', icon: Activity },
  { name: 'Security', href: '/super-admin/security', icon: Shield },
  { name: 'Organizations', href: '/super-admin/tenants', icon: Building2 },
  { name: 'Users', href: '/super-admin/users', icon: Users },
  { name: 'Support', href: '/super-admin/support', icon: MessageSquare },
  { name: 'Announcements', href: '/super-admin/announcements', icon: Bell },
  { name: 'Subscriptions', href: '/super-admin/subscriptions', icon: CreditCard },
  { name: 'Billing', href: '/super-admin/billing', icon: Receipt },
  { name: 'Analytics', href: '/super-admin/analytics', icon: BarChart3 },
  { name: 'Data', href: '/super-admin/data', icon: Database },
  { name: 'API', href: '/super-admin/api', icon: Webhook },
  { name: 'Audit Logs', href: '/super-admin/audit-logs', icon: FileText },
  { name: 'System Settings', href: '/super-admin/settings', icon: Settings },
];

export function SuperAdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { superAdmin, logout, isSessionValid, updateActivity, theme, toggleTheme } = useSuperAdminStore();
  const navigate = useNavigate();

  // Initialize WebSocket connection for real-time notifications
  const { isConnected, requestNotificationPermission } = useSuperAdminSocket();

  // Request browser notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, [requestNotificationPermission]);

  // Theme support
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Update activity on user interaction
  useEffect(() => {
    const handleActivity = () => {
      updateActivity();
    };

    // Listen to various user interactions
    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    return () => {
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, [updateActivity]);

  // Session check
  useEffect(() => {
    const checkSession = () => {
      if (!isSessionValid()) {
        logout();
        navigate('/super-admin/login');
      }
    };

    checkSession();
    const interval = setInterval(checkSession, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [isSessionValid, logout, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/super-admin/login');
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 transition-colors duration-200">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-72 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 transform transition-all duration-300 ease-in-out lg:translate-x-0 flex flex-col',
          sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex-none flex items-center justify-between px-6 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/20">
              <Shield size={18} className="text-white" />
            </div>
            <div>
              <span className="text-neutral-900 dark:text-white font-bold text-lg">Super Admin</span>
              <span className="block text-[10px] text-red-500 dark:text-red-400 font-medium uppercase tracking-wider">Control Panel</span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin min-h-0">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group',
                  isActive
                    ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 shadow-sm shadow-red-500/5'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
                )
              }
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon size={20} className={cn('transition-colors')} />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Section Wrapper */}
        <div className="flex-none bg-white dark:bg-neutral-900 z-10">
          {/* Warning banner */}
          <div className="px-4 pb-4">
            <div className="bg-yellow-500/5 dark:bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-500 uppercase tracking-tight">Privileged Access</p>
                  <p className="text-[11px] text-yellow-700/70 dark:text-yellow-500/70 mt-1 leading-relaxed">
                    Every action is logged. Unauthorized use is prohibited.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Admin info */}
          <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-transparent">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-semibold shadow-inner">
                {superAdmin?.name?.[0] || 'S'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-neutral-900 dark:text-white truncate">{superAdmin?.name || 'Super Admin'}</p>
                <p className="text-xs text-neutral-500 truncate">{superAdmin?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-72 flex flex-col min-h-screen">
        {/* Top header */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
          <div className="h-full px-4 sm:px-6 flex items-center justify-between">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
            >
              <Menu size={20} />
            </button>

            {/* Breadcrumb / Title area */}
            <div className="hidden lg:flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                <img src={logoLight} alt="TalentX" className="h-4 dark:invert-0 light:invert" style={{ filter: theme === 'light' ? 'invert(1)' : 'none' }} />
                <span className="text-neutral-400 dark:text-neutral-600 mx-1">/</span>
                <span className="text-xs font-bold text-red-500 dark:text-red-400 uppercase tracking-widest">Super Admin</span>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* System status - shows WebSocket connection state */}
              <div className={cn(
                "hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border",
                isConnected
                  ? "bg-green-500/5 dark:bg-green-500/10 border-green-500/20"
                  : "bg-yellow-500/5 dark:bg-yellow-500/10 border-yellow-500/20"
              )}>
                <div className={cn(
                  "w-2 h-2 rounded-full animate-pulse",
                  isConnected
                    ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"
                    : "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]"
                )} />
                <span className={cn(
                  "text-xs font-bold uppercase tracking-wider",
                  isConnected
                    ? "text-green-600 dark:text-green-500"
                    : "text-yellow-600 dark:text-yellow-500"
                )}>
                  {isConnected ? 'Live' : 'Connecting'}
                </span>
              </div>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white border border-neutral-200 dark:border-neutral-800 transition-all hover:scale-105 active:scale-95"
                title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </button>

              <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-800 mx-1" />

              {/* Activity indicator */}
              <button className="p-2 rounded-xl text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                <Activity size={20} />
              </button>

              {/* Notifications */}
              <NotificationDropdown />

              {/* Profile menu */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 p-1 pl-2 sm:p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white text-sm font-bold shadow-md">
                    {superAdmin?.name?.[0] || 'S'}
                  </div>
                  <ChevronDown size={14} className={cn('text-neutral-500 transition-transform duration-200', showProfileMenu && 'rotate-180')} />
                </button>

                {showProfileMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowProfileMenu(false)}
                    />
                    <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl shadow-black/10 z-50 py-3 overflow-hidden animate-slide-in">
                      <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/20">
                        <p className="text-sm font-bold text-neutral-900 dark:text-white">{superAdmin?.name}</p>
                        <p className="text-xs text-neutral-500 mt-0.5 truncate">{superAdmin?.email}</p>
                      </div>
                      <div className="p-2 space-y-0.5">
                        <NavLink
                          to="/super-admin/settings"
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all font-medium"
                          onClick={() => setShowProfileMenu(false)}
                        >
                          <Settings size={18} className="opacity-70" />
                          Profile Settings
                        </NavLink>
                        <NavLink
                          to="/super-admin/security"
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all font-medium"
                          onClick={() => setShowProfileMenu(false)}
                        >
                          <Shield size={18} className="opacity-70" />
                          Security Controls
                        </NavLink>
                      </div>
                      <div className="px-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all font-bold"
                        >
                          <LogOut size={18} />
                          Sign Out Platform
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
