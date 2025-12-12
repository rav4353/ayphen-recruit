import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Mail, KeyRound } from 'lucide-react';
import { useAuthStore } from '../../stores/auth';
import { authApi } from '../../lib/api';
import { Button, Input, Card, CardHeader, CardContent, Alert, Divider } from '../../components/ui';

interface LoginForm {
  email: string;
  password: string;
}

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
    <Card className="w-full max-w-md mx-4 sm:mx-0 shadow-xl border-neutral-200/50 dark:border-neutral-800">
      <CardHeader
        title={t('auth.login.title')}
        description={t('auth.login.description')}
        align="center"
        className="pb-2"
      />
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {error && <Alert variant="error">{error}</Alert>}

        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('auth.login.email')}</label>
          <div className="relative">
            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <Input
              type="email"
              placeholder={t('auth.login.emailPlaceholder')}
              error={errors.email?.message}
              autoComplete="username"
              className="pl-10"
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

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {t('auth.login.password')}
            </label>
          </div>
          <Input
            type="password"
            placeholder={t('auth.login.passwordPlaceholder')}
            error={errors.password?.message}
            autoComplete="current-password"
            {...register('password', {
              required: t('auth.validation.passwordRequired'),
              minLength: {
                value: 6,
                message: t('auth.validation.passwordMin'),
              },
            })}
          />
        </div>

        <div className="flex items-center justify-between">
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

          <Link to="/forgot-password" className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
            {t('auth.login.forgotPassword')}
          </Link>
        </div>

        <Button type="submit" isLoading={isLoading} className="w-full h-11">
          {isLoading ? t('auth.login.signingIn') : t('auth.login.signIn')}
        </Button>

        <Divider text={t('auth.login.orContinueWith')} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            className="w-full h-10"
            onClick={() => {
              window.location.href = '/api/v1/auth/google';
            }}
          >
            {t('auth.login.signInWithGoogle')}
          </Button>
          <Link to="/auth/otp" className="w-full">
            <Button variant="outline" className="w-full h-10 gap-2">
              <KeyRound size={16} />
              {t('auth.login.otp')}
            </Button>
          </Link>
        </div>

        <p className="text-center text-neutral-500 dark:text-neutral-400 text-sm pt-2">
          {t('auth.login.noAccount')}{' '}
          <Link to="/register" className="font-medium text-primary-600 dark:text-primary-400 hover:underline">
            {t('auth.login.signUp')}
          </Link>
        </p>
        </form>
      </CardContent>
    </Card>
  );
}
