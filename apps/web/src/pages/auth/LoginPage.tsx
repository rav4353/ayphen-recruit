import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, KeyRound } from 'lucide-react';
import { useAuthStore } from '../../stores/auth';
import { authApi } from '../../lib/api';
import { Button, Input, Card, CardContent, Alert, Divider } from '../../components/ui';

interface LoginForm {
  email: string;
  password: string;
}

// Google Icon Component
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

export function LoginPage() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const setRequirePasswordChange = useAuthStore((state) => state.setRequirePasswordChange);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginForm>();

  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setValue('email', rememberedEmail);
      setRememberMe(true);
    }
  }, [setValue]);

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await authApi.login({
        ...data,
      });

      console.log('Full login response:', response);
      console.log('response.data:', response.data);

      // Handle Remember Me
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', data.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      // API returns { success, data: { accessToken, refreshToken } }
      const responseData = response.data.data || response.data;
      console.log('Extracted responseData:', responseData);
      console.log('responseData.requirePasswordChange:', responseData.requirePasswordChange);

      if (responseData.requiresMfa) {
        navigate('/auth/mfa', { state: { mfaToken: responseData.mfaToken } });
        return;
      }

      const { accessToken, refreshToken, requirePasswordChange } = responseData;
      console.log('Destructured requirePasswordChange:', requirePasswordChange);

      const payload = JSON.parse(atob(accessToken.split('.')[1]));

      const derivedFirstName =
        payload.firstName ||
        (payload.email && typeof payload.email === 'string'
          ? payload.email.split('@')[0]
          : 'User');

      // Check if user needs to change password BEFORE setting auth
      // This prevents automatic redirects that might happen in setAuth
      if (requirePasswordChange) {
        console.log('Password change required - setting flag and auth');
        // Set the password change flag
        setRequirePasswordChange(true);
        // Set auth so the user is authenticated
        setAuth(
          {
            id: payload.sub,
            email: payload.email,
            firstName: derivedFirstName,
            lastName: payload.lastName || '',
            role: payload.role,
            tenantId: payload.tenantId,
          },
          accessToken,
          refreshToken
        );
        // Navigate to dashboard - the modal will show there
        navigate(`/${payload.tenantId}/dashboard`);
        return;
      }

      // Normal login flow - set auth and redirect to dashboard
      setAuth(
        {
          id: payload.sub,
          email: payload.email,
          firstName: derivedFirstName,
          lastName: payload.lastName || '',
          role: payload.role,
          tenantId: payload.tenantId,
        },
        accessToken,
        refreshToken
      );

      navigate(`/${payload.tenantId}/dashboard`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; error?: string } } };
      // Display the actual error message from the backend
      const errorMessage = error.response?.data?.message || error.response?.data?.error;

      if (error.response?.data?.error === 'Account locked') {
        setError(errorMessage || t('auth.login.accountLocked'));
      } else if (errorMessage) {
        // Show the specific error message from backend (e.g., "Your account has been deactivated...")
        setError(errorMessage);
      } else {
        setError(t('auth.login.invalidCredentials'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-4 sm:mx-0 shadow-2xl border-0 dark:border dark:border-neutral-800/50 overflow-hidden">
      {/* Header Section with gradient accent */}
      <div className="relative px-8 pt-6 pb-5 text-center">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-500" />
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          {t('auth.login.title')}
        </h1>
        <p className="mt-2 text-neutral-500 dark:text-neutral-400 text-sm">
          {t('auth.login.description')}
        </p>
      </div>

      <CardContent className="px-8 pb-6 pt-0">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {error && (
            <Alert variant="error" className="animate-in fade-in slide-in-from-top-1 duration-200">
              {error}
            </Alert>
          )}

          {/* Email Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {t('auth.login.email')}
            </label>
            <div className="relative group">
              <Mail
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-primary-500 transition-colors"
              />
              <Input
                type="email"
                placeholder={t('auth.login.emailPlaceholder')}
                error={errors.email?.message}
                autoComplete="username"
                className="pl-11 h-12 text-base"
                {...register('email', {
                  required: t('auth.validation.emailRequired'),
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: t('auth.validation.emailInvalid'),
                  },
                })}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {t('auth.login.password')}
            </label>
            <div className="relative group">
              <Lock
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-primary-500 transition-colors"
              />
              <Input
                type="password"
                placeholder={t('auth.login.passwordPlaceholder')}
                error={errors.password?.message}
                autoComplete="current-password"
                className="pl-11 h-12 text-base"
                {...register('password', {
                  required: t('auth.validation.passwordRequired'),
                  minLength: {
                    value: 6,
                    message: t('auth.validation.passwordMin'),
                  },
                })}
              />
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-600 text-primary-600 focus:ring-primary-500 focus:ring-offset-0 transition-colors"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className="text-sm text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-neutral-200 transition-colors">
                {t('auth.login.rememberMe', 'Remember me')}
              </span>
            </label>

            <Link
              to="/forgot-password"
              className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
            >
              {t('auth.login.forgotPassword')}
            </Link>
          </div>

          {/* Sign In Button */}
          <Button
            type="submit"
            isLoading={isLoading}
            className="w-full h-12 text-base font-semibold shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-shadow"
          >
            {isLoading ? t('auth.login.signingIn') : t('auth.login.signIn')}
          </Button>

          <Divider text={t('auth.login.orContinueWith')} />

          {/* Alternative Sign-in Methods */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-11 gap-2.5 font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors opacity-60 cursor-not-allowed"
              disabled
              title="Coming soon"
            >
              <GoogleIcon />
              <span className="hidden sm:inline">Google</span>
            </Button>
            <Link to="/auth/otp" className="w-full">
              <Button
                variant="outline"
                className="w-full h-11 gap-2.5 font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
              >
                <KeyRound size={18} />
                <span className="hidden sm:inline">{t('auth.login.otp')}</span>
                <span className="sm:hidden">OTP</span>
              </Button>
            </Link>
          </div>

          {/* Sign Up Link */}
          <p className="text-center text-neutral-600 dark:text-neutral-400 text-sm pt-2">
            {t('auth.login.noAccount')}{' '}
            <Link
              to="/register"
              className="font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
            >
              {t('auth.login.signUp')}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
