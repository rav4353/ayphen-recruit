import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, KeyRound } from 'lucide-react';
import { m } from 'framer-motion';
import { useAuthStore } from '../../stores/auth';
import { authApi } from '../../lib/api';
import { Button, Input, Alert } from '../../components/ui';
import { PremiumAuthLayout } from '../../components/auth/PremiumAuthLayout';


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

      // Check for functional errors (like account locked) returned with 200 OK
      if (responseData.error) {
        throw { response: { data: responseData } };
      }

      console.log('responseData.requirePasswordChange:', responseData.requirePasswordChange);

      if (responseData.requiresMfaSetup) {
        navigate('/auth/mfa-onboarding', { state: { mfaToken: responseData.mfaToken } });
        return;
      }

      if (responseData.requiresMfa) {
        navigate('/auth/mfa', { state: { mfaToken: responseData.mfaToken } });
        return;
      }

      const { accessToken, refreshToken, requirePasswordChange } = responseData;
      console.log('Destructured requirePasswordChange:', requirePasswordChange);

      if (!accessToken) {
        // Fallback if no token and no explicit error
        throw new Error('No access token received');
      }

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
    <PremiumAuthLayout
      title={t('auth.login.title')}
      subtitle={t('auth.login.description')}
    >
      <form
        id="login-form"
        name="login"
        onSubmit={handleSubmit(onSubmit)}
        method="POST"
        className="space-y-5"
      >
        {error && (
          <Alert variant="error" className="animate-in fade-in slide-in-from-top-1 duration-200">
            {error}
          </Alert>
        )}

        {/* Email Field */}
        <m.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="space-y-2"
        >
          <Input
            id="email-login"
            type="email"
            label={t('auth.login.email')}
            placeholder={t('auth.login.emailPlaceholder')}
            error={errors.email?.message}
            autoComplete="username"
            leftIcon={<Mail size={18} />}
            className="h-12 text-base rounded-xl transition-all"
            {...register('email', {
              required: t('auth.validation.emailRequired'),
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: t('auth.validation.emailInvalid'),
              },
            })}
          />
        </m.div>

        {/* Password Field */}
        <m.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="space-y-2"
        >
          <Input
            id="password-login"
            type="password"
            label={t('auth.login.password')}
            placeholder={t('auth.login.passwordPlaceholder')}
            error={errors.password?.message}
            autoComplete="current-password"
            leftIcon={<Lock size={18} />}
            className="h-12 text-base rounded-xl transition-all"
            {...register('password', {
              required: t('auth.validation.passwordRequired'),
              minLength: {
                value: 6,
                message: t('auth.validation.passwordMin'),
              },
            })}
          />
        </m.div>

        {/* Remember Me & Forgot Password */}
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="flex items-center justify-between pt-1"
        >
          <label className="flex items-center gap-2 cursor-pointer group">
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
            className="text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors hover:underline"
          >
            {t('auth.login.forgotPassword')}
          </Link>
        </m.div>

        {/* Sign In Button */}
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="pt-2"
        >
          <Button
            type="submit"
            isLoading={isLoading}
            className="relative w-full h-12 text-base font-semibold bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 shadow-soft-lg hover:shadow-primary-500/30 overflow-hidden group rounded-xl transition-all"
          >
            {/* Shine effect */}
            <m.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{
                x: ['-100%', '200%'],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                repeatDelay: 1,
              }}
            />
            <span className="relative">
              {isLoading ? t('auth.login.signingIn') : t('auth.login.signIn')}
            </span>
          </Button>
        </m.div>

        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="relative py-4"
        >
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-200 dark:border-neutral-700"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-neutral-900 px-3 text-neutral-500 dark:text-neutral-400 font-medium">
              {t('auth.login.orContinueWith')}
            </span>
          </div>
        </m.div>

        {/* Alternative Sign-in Methods */}
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="grid grid-cols-2 gap-3"
        >
          <Button
            type="button"
            variant="outline"
            className="h-11 gap-2 font-medium border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600 transition-all rounded-xl opacity-60 cursor-not-allowed"
            disabled
            title="Coming soon"
          >
            <GoogleIcon />
            <span className="hidden sm:inline text-sm">Google</span>
          </Button>
          <Link to="/auth/otp" className="w-full">
            <Button
              variant="outline"
              className="w-full h-11 gap-2 font-medium border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600 transition-all rounded-xl"
            >
              <KeyRound size={18} />
              <span className="hidden sm:inline text-sm">{t('auth.login.otp')}</span>
              <span className="sm:hidden text-sm">OTP</span>
            </Button>
          </Link>
        </m.div>

        {/* Sign Up Link */}
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.7 }}
          className="text-center pt-2"
        >
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {t('auth.login.noAccount')}{' '}
            <Link
              to="/register"
              className="font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors hover:underline"
            >
              {t('auth.login.signUp')}
            </Link>
          </p>
        </m.div>
      </form>
    </PremiumAuthLayout>
  );
}
