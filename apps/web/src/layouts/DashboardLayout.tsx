import { Outlet, NavLink, useNavigate, Link, useParams } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Search,
  Calendar,
  Mail,
  BarChart,
  Settings,
  LogOut,
  Menu,
  X,
  GitBranch,
  Share2,
  FileSignature,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/auth';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeToggle, LanguageSwitcher, NotificationDrawer } from '../components/ui';
import { ForcedPasswordChangeModal } from '../components/auth/ForcedPasswordChangeModal';
import { cn } from '../lib/utils';
import { preferencesApi } from '../lib/api';
import logoLight from '../assets/branding/logo_light_theme.png';
import logoDark from '../assets/branding/logo_dark_theme.png';
import ayphenLogo from '../assets/branding/ayphenLogo.6c65cf0b138677af.png';

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const { user, logout, isAuthenticated, requirePasswordChange } = useAuthStore();
  const { setThemeFromApi, resolvedTheme } = useTheme();
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const { tenantId } = useParams<{ tenantId: string }>();
  const allNavigation = [
    { name: 'dashboard.title', href: `/${tenantId}/dashboard`, icon: LayoutDashboard, roles: ['ADMIN', 'RECRUITER', 'HIRING_MANAGER'] },
    { name: 'jobs.title', href: `/${tenantId}/jobs`, icon: Briefcase, roles: ['ADMIN', 'RECRUITER', 'HIRING_MANAGER'] },
    { name: 'pipeline.title', href: `/${tenantId}/pipeline`, icon: GitBranch, roles: ['ADMIN', 'RECRUITER', 'HIRING_MANAGER'] },
    { name: 'candidates.title', href: `/${tenantId}/candidates`, icon: Users, roles: ['ADMIN', 'RECRUITER', 'HIRING_MANAGER'] },
    { name: 'referrals.title', href: `/${tenantId}/referrals`, icon: Share2, roles: ['ADMIN', 'RECRUITER', 'HIRING_MANAGER', 'EMPLOYEE'] },
    { name: 'sourcing.title', href: `/${tenantId}/sourcing`, icon: Search, roles: ['ADMIN', 'RECRUITER'] },
    { name: 'interviews.title', href: `/${tenantId}/interviews`, icon: Calendar, roles: ['ADMIN', 'RECRUITER', 'HIRING_MANAGER'] },
    { name: 'offers.title', href: `/${tenantId}/offers`, icon: FileSignature, roles: ['ADMIN', 'RECRUITER', 'HIRING_MANAGER'] },
    { name: 'onboarding.title', href: `/${tenantId}/onboarding`, icon: Users, roles: ['ADMIN', 'RECRUITER', 'HR'] }, // Story 9.1
    { name: 'inbox.title', href: `/${tenantId}/inbox`, icon: Mail, roles: ['ADMIN', 'RECRUITER'] },
    { name: 'reports.title', href: `/${tenantId}/reports`, icon: BarChart, roles: ['ADMIN', 'RECRUITER'] },
    { name: 'settings.title', href: `/${tenantId}/settings`, icon: Settings, roles: ['ADMIN'] },
  ];

  const navigation = allNavigation.filter(item => user?.role && item.roles.includes(user.role));

  // Load user preferences on mount
  useEffect(() => {
    if (isAuthenticated && !preferencesLoaded) {
      preferencesApi.get()
        .then((response) => {
          const prefs = response.data.data;
          if (prefs.theme) {
            setThemeFromApi(prefs.theme as 'light' | 'dark' | 'system' | 'auto');
          }
          if (prefs.language) {
            i18n.changeLanguage(prefs.language);
          }
          setPreferencesLoaded(true);
        })
        .catch((error) => {
          console.error('Failed to load preferences:', error);
          setPreferencesLoaded(true);
        });
    }
  }, [isAuthenticated, preferencesLoaded, setThemeFromApi, i18n]);

  const handleLogout = () => {
    logout();
    localStorage.removeItem('talentx-language');
    i18n.changeLanguage('en');
    navigate('/login');
  };

  return (
    <div className="h-screen overflow-hidden flex bg-neutral-50 dark:bg-neutral-950">
      {/* Forced Password Change Modal */}
      <ForcedPasswordChangeModal isOpen={requirePasswordChange} />

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800',
          'transform transition-transform duration-200 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="relative flex items-center h-16 px-6 border-b border-neutral-200 dark:border-neutral-800">
            <Link to={`/${tenantId}/dashboard`} className="mx-auto flex items-center gap-3">
              <img
                src={ayphenLogo}
                alt="Ayphen"
                className="h-12 w-auto"
              />
              <div className="h-8 w-px bg-neutral-300 dark:bg-neutral-700" />
              <img
                src={resolvedTheme === 'dark' ? logoDark : logoLight}
                alt={t('common.appName')}
                className="h-24 w-auto"
              />
            </Link>
            <button
              className="absolute right-6 lg:hidden text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1.5">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group',
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium shadow-sm'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                  )
                }
              >
                <item.icon size={20} className="transition-transform group-hover:scale-110" />
                <span className="font-medium">{t(item.name)}</span>
              </NavLink>
            ))}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-semibold">
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                {user?.employeeId && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                    ID: {user?.employeeId}
                  </p>
                )}
                <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                title={t('common.logout')}
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
          <button
            className="lg:hidden p-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>

          {/* Right side controls */}
          <div className="flex items-center gap-2 ml-auto">
            <NotificationDrawer />
            <LanguageSwitcher variant="icon" />
            <ThemeToggle />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto bg-neutral-50 dark:bg-neutral-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
