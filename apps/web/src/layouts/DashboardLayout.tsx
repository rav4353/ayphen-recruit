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
  Send,
  ChevronLeft,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/auth';
import { useOrganizationStore } from '../stores/organization';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeToggle, LanguageSwitcher, NotificationDrawer } from '../components/ui';
import { ForcedPasswordChangeModal } from '../components/auth/ForcedPasswordChangeModal';
import { cn } from '../lib/utils';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { ApiStatusIndicator } from '../components/common/ApiStatusIndicator';

import { preferencesApi, settingsApi } from '../lib/api';
import { useGlobalShortcuts } from '../hooks/useKeyboardShortcuts';
import logoLight from '../assets/branding/logo_light_theme.png';
import logoDark from '../assets/branding/logo_dark_theme.png';
import ayphenLogo from '../assets/branding/ayphenLogo.6c65cf0b138677af.png';

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const { user, logout, isAuthenticated, requirePasswordChange } = useAuthStore();
  const { settings: orgSettings, setSettings: setOrgSettings, setLogoUrl, reset } = useOrganizationStore();
  const { setThemeFromApi, resolvedTheme } = useTheme();
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const { tenantId } = useParams<{ tenantId: string }>();

  // Enable global keyboard shortcuts
  useGlobalShortcuts();

  // Validate tenantId - if it's a route segment like "onboarding", "jobs", etc., redirect to login
  useEffect(() => {
    const invalidTenantIds = ['onboarding', 'jobs', 'candidates', 'dashboard', 'settings', 'pipeline', 'interviews', 'offers', 'inbox', 'campaigns', 'reports', 'sourcing', 'talent-pools', 'referrals', 'background-checks'];

    if (tenantId && invalidTenantIds.includes(tenantId.toLowerCase())) {
      console.error('Invalid tenantId detected:', tenantId);
      logout();
      navigate('/login', { replace: true });
    }
  }, [tenantId, logout, navigate]);

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
    { name: 'Background Checks', href: `/${tenantId}/background-checks`, icon: Shield, roles: ['ADMIN', 'RECRUITER'] },
    { name: 'inbox.title', href: `/${tenantId}/inbox`, icon: Mail, roles: ['ADMIN', 'RECRUITER'] },
    { name: 'campaigns.title', href: `/${tenantId}/campaigns`, icon: Send, roles: ['ADMIN', 'RECRUITER', 'HR'] },
    { name: 'reports.title', href: `/${tenantId}/reports`, icon: BarChart, roles: ['ADMIN', 'RECRUITER'] },
    { name: 'settings.title', href: `/${tenantId}/settings`, icon: Settings, roles: ['ADMIN'] },
  ];

  const navigation = allNavigation.filter(item => user?.role && item.roles.includes(user.role));

  // Load user preferences and organization settings on mount
  useEffect(() => {
    if (isAuthenticated && !preferencesLoaded) {
      // Load user preferences
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

      // Load organization settings (including logo)
      settingsApi.getAll()
        .then((response) => {
          // Safely extract data handling both wrapped and unwrapped scenarios if needed,
          // but assuming response.data.data based on earlier findings + fix.
          const settings = response.data?.data || [];

          const orgProfile = Array.isArray(settings) ? settings.find((s: any) => s.key === 'organization_profile') : null;

          if (orgProfile?.value) {
            setOrgSettings(orgProfile.value);
            if (orgProfile.value.logoUrl) {
              setLogoUrl(orgProfile.value.logoUrl);
            }
          } else {
            // If organization profile is not found (e.g., db flushed), reset the store
            reset();
          }
        })
        .catch((error) => {
          console.error('Failed to load organization settings:', error);
        });
    }
  }, [isAuthenticated, preferencesLoaded, setThemeFromApi, i18n, setOrgSettings, setLogoUrl, reset]);

  const handleLogout = () => {
    logout();
    localStorage.removeItem('talentx-language');
    i18n.changeLanguage('en');
    navigate('/login');
  };

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', String(newState));
  };

  return (
    <div className="h-screen overflow-hidden flex bg-neutral-50 dark:bg-neutral-950 transition-colors duration-150">
      {/* Forced Password Change Modal */}
      <ForcedPasswordChangeModal isOpen={requirePasswordChange} />

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-200"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:sticky lg:top-0 lg:h-screen inset-y-0 left-0 z-50 bg-white dark:bg-neutral-900 border-r border-neutral-200/60 dark:border-neutral-800/60 overflow-hidden',
          'transform transition-all duration-300 ease-in-out shadow-soft-lg lg:shadow-none',
          isCollapsed ? 'w-20' : 'w-64',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={cn(
            'relative flex items-center h-16 border-b border-neutral-200/60 dark:border-neutral-800/60 transition-all duration-300',
            isCollapsed ? 'px-4 justify-center' : 'px-6'
          )}>
            <Link to={`/${tenantId}/dashboard`} className={cn(
              "flex items-center gap-3 transition-opacity duration-300",
              isCollapsed && "overflow-hidden"
            )}>
              {/* Organization Logo - show uploaded logo or default Ayphen logo */}
              {orgSettings.logoUrl ? (
                <img
                  src={orgSettings.logoUrl}
                  alt={orgSettings.name || 'Organization'}
                  className={cn(
                    "h-10 w-auto object-contain transition-all",
                    isCollapsed ? "max-w-[40px]" : "max-w-[100px]"
                  )}
                />
              ) : (
                <img
                  src={ayphenLogo}
                  alt="Ayphen"
                  className="h-10 w-auto"
                />
              )}

              {!isCollapsed && (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                  <div className="h-6 w-px bg-neutral-300 dark:bg-neutral-700" />
                  <img
                    src={resolvedTheme === 'dark' ? logoDark : logoLight}
                    alt={t('common.appName')}
                    className="h-16 w-auto"
                  />
                </div>
              )}
            </Link>
            <button
              className="absolute right-6 lg:hidden text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto overscroll-contain scrollbar-thin">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 py-2.5 rounded-lg transition-all duration-150 group relative',
                    isCollapsed ? 'px-0 justify-center' : 'px-3.5',
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium shadow-soft'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                  )
                }
                title={isCollapsed ? t(item.name) : ''}
              >
                <item.icon size={isCollapsed ? 22 : 18} className="transition-transform group-hover:scale-110 shrink-0" />
                {!isCollapsed && <span className="text-sm font-medium truncate animate-in fade-in slide-in-from-left-2 duration-300">{t(item.name)}</span>}
              </NavLink>
            ))}
          </nav>

          {/* Collapse Toggle (Desktop) */}
          <div className="hidden lg:flex border-t border-neutral-200/60 dark:border-neutral-800/60 p-2 justify-center">
            <button
              onClick={toggleSidebar}
              className="w-full flex items-center justify-center p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isCollapsed ? <ChevronRight size={20} /> : <div className="flex items-center gap-2"><ChevronLeft size={20} /></div>}
            </button>
          </div>

          {/* User section */}
          <div className="p-4 border-t border-neutral-200/60 dark:border-neutral-800/60">
            <div className={cn(
              "flex items-center gap-3",
              isCollapsed ? "justify-center" : "px-3 py-2.5"
            )}>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-600 to-primary-400 flex items-center justify-center text-white font-semibold shadow-soft shrink-0">
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0 animate-in fade-in slide-in-from-left-2 duration-300">
                  <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{user?.email}</p>
                </div>
              )}
              {!isCollapsed && (
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-danger-600 dark:hover:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-950/30 transition-all duration-150"
                  title={t('common.logout')}
                >
                  <LogOut size={18} />
                </button>
              )}
            </div>
            {isCollapsed && (
              <button
                onClick={handleLogout}
                className="mt-4 w-full flex justify-center p-2 rounded-lg text-neutral-500 hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-950/30 transition-all duration-150"
                title={t('common.logout')}
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 sm:h-16 flex items-center justify-between px-3 sm:px-6 border-b border-neutral-200/60 dark:border-neutral-800/60 bg-white dark:bg-neutral-900 shadow-soft flex-shrink-0">
          <button
            className="lg:hidden p-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-150"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>

          {/* Right side controls */}
          <div className="flex items-center gap-2 ml-auto">
            <ApiStatusIndicator />
            <NotificationDrawer />
            <LanguageSwitcher variant="icon" />
            <ThemeToggle />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto bg-neutral-50 dark:bg-neutral-950 scroll-smooth-mobile">

          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
