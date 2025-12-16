import { Outlet, Navigate, useLocation } from 'react-router-dom';
// import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/auth';

import lightLogo from '../assets/branding/logo_light_theme.png';
// import darkLogo from '../assets/branding/logo_dark_theme.png';

export function AuthLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { t } = useTranslation();
  const location = useLocation();

  // Ensure login/auth screens default to English when not authenticated
  // useEffect(() => {
  //   if (!isAuthenticated && i18n.language !== 'en') {
  //     localStorage.removeItem('talentx-language');
  //     i18n.changeLanguage('en');
  //   }
  // }, [isAuthenticated, i18n]);

  // Allow authenticated users to access change-password page
  // but redirect from other auth pages
  if (isAuthenticated && location.pathname !== '/change-password') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-neutral-50 via-primary-50/20 to-neutral-50 dark:from-neutral-950 dark:via-primary-950/10 dark:to-neutral-950 transition-colors duration-300">
      <div className="mb-8 text-center animate-fade-in">
        <img
          src={lightLogo}
          alt={t('common.appName')}
          className="h-40 mx-auto"
        />
      </div>
      <div className="w-full animate-slide-up">
        <Outlet />
      </div>
    </div>
  );
}

