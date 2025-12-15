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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-neutral-50 transition-colors">
      <div className="mb-2 text-center">
        <img
          src={lightLogo}
          alt={t('common.appName')}
          className="h-48 mx-auto"
        />
      </div>
      <Outlet />
    </div>
  );
}

