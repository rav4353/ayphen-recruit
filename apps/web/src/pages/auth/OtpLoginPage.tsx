import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Mail, ArrowLeft, KeyRound, Shield, Lock } from 'lucide-react';
import { authApi } from '../../lib/api';
import { useAuthStore } from '../../stores/auth';
import { Button, Input, Card, CardContent, Alert, Divider, OtpInput } from '../../components/ui';

interface EmailForm {
  email: string;
}

export function OtpLoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailForm>();

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const requestOtp = async (data: EmailForm) => {
    setIsLoading(true);
    setError('');

    try {
      await authApi.requestOtp({
        email: data.email,
        tenantId: 'demo-tenant',
        type: 'LOGIN',
      });
      setEmail(data.email);
      setStep('otp');
      setCountdown(60);
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (newOtp: string[]) => {
    setOtp(newOtp);
  };

  const handleOtpComplete = (code: string) => {
    verifyOtp(code);
  };

  const verifyOtp = async (code: string) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await authApi.verifyOtp({
        email,
        tenantId: 'demo-tenant',
        code,
        type: 'LOGIN',
      });

      // API returns { success, data: { accessToken, refreshToken } }
      const responseData = response.data.data || response.data;
      const { accessToken, refreshToken } = responseData;
      const payload = JSON.parse(atob(accessToken.split('.')[1]));

      setAuth(
        {
          id: payload.sub,
          email: payload.email,
          firstName: 'User',
          lastName: '',
          role: payload.role,
          tenantId: payload.tenantId,
        },
        accessToken,
        refreshToken
      );

      navigate(`/${payload.tenantId}/dashboard`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; data?: { message?: string } } } };
      setError(error.response?.data?.data?.message || error.response?.data?.message || 'Invalid OTP. Please try again.');
      setOtp(['', '', '', '', '', '']);
    } finally {
      setIsLoading(false);
    }
  };

  const resendOtp = async () => {
    if (countdown > 0) return;

    setIsLoading(true);
    setError('');

    try {
      await authApi.requestOtp({
        email,
        tenantId: 'demo-tenant',
        type: 'LOGIN',
      });
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
    } catch (err) {
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'otp') {
    return (
      <Card className="w-full max-w-md mx-4 sm:mx-0 shadow-2xl border-0 dark:border-0 bg-white dark:bg-white overflow-hidden">
        {/* Header Section with gradient accent */}
        <div className="relative px-8 pt-8 pb-6 text-center">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-500" />

          {/* Icon */}
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-500/20 to-primary-600/20 flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary-500" />
          </div>

          <h1 className="text-2xl font-bold text-neutral-900">
            {t('auth.otp.enterCode')}
          </h1>
          <p className="mt-2 text-neutral-500 text-sm">
            {t('auth.otp.codeSent', { email })}
          </p>
        </div>

        <CardContent className="px-8 pb-8 pt-0">
          {error && (
            <Alert variant="error" className="mb-6 animate-in fade-in slide-in-from-top-1 duration-200">
              {error}
            </Alert>
          )}

          <OtpInput
            value={otp}
            onChange={handleOtpChange}
            onComplete={handleOtpComplete}
            disabled={isLoading}
            error={!!error}
            className="mb-8"
            inputClassName="bg-white dark:bg-white border-neutral-300 dark:border-neutral-300 text-neutral-900 dark:text-neutral-900 focus:border-primary-500 focus:ring-0 dark:focus:border-primary-500 dark:focus:ring-0"
          />

          <div className="text-center space-y-5">
            <p className="text-neutral-500 text-sm">
              {t('auth.otp.didntReceive')}{' '}
              {countdown > 0 ? (
                <span className="text-neutral-400 font-medium">
                  {t('auth.otp.resendIn', { seconds: countdown })}
                </span>
              ) : (
                <button
                  onClick={resendOtp}
                  disabled={isLoading}
                  className="font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                >
                  {t('auth.otp.resendOtp')}
                </button>
              )}
            </p>

            <button
              onClick={() => {
                setStep('email');
                setOtp(['', '', '', '', '', '']);
                setError('');
              }}
              className="text-neutral-500 hover:text-neutral-900 text-sm inline-flex items-center gap-2 mx-auto transition-colors"
            >
              <ArrowLeft size={16} />
              {t('auth.otp.changeEmail')}
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-4 sm:mx-0 shadow-2xl border-0 dark:border-0 bg-white dark:bg-white overflow-hidden">
      {/* Header Section with gradient accent */}
      <div className="relative px-8 pt-8 pb-6 text-center">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-500" />

        {/* Icon */}
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-500/20 to-primary-600/20 flex items-center justify-center">
          <KeyRound className="w-8 h-8 text-primary-500" />
        </div>

        <h1 className="text-2xl font-bold text-neutral-900">
          {t('auth.otp.title')}
        </h1>
        <p className="mt-2 text-neutral-500 text-sm">
          {t('auth.otp.description')}
        </p>
      </div>

      <CardContent className="px-8 pb-8 pt-0">
        <form onSubmit={handleSubmit(requestOtp)} className="space-y-6">
          {error && (
            <Alert variant="error" className="animate-in fade-in slide-in-from-top-1 duration-200">
              {error}
            </Alert>
          )}

          {/* Email Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700">
              {t('auth.otp.email')}
            </label>
            <div className="relative group">
              <Mail
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-primary-500 transition-colors"
              />
              <Input
                type="email"
                placeholder={t('auth.otp.emailPlaceholder')}
                error={errors.email?.message}
                className="pl-11 h-12 text-base bg-white dark:bg-white border-neutral-300 dark:border-neutral-300 text-neutral-900 dark:text-neutral-900 placeholder:text-neutral-400 dark:placeholder:text-neutral-400 focus:border-primary-500 focus:ring-0 dark:focus:border-primary-500 dark:focus:ring-0"
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

          <Button
            type="submit"
            isLoading={isLoading}
            className="w-full h-12 text-base font-semibold shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-shadow"
          >
            {isLoading ? t('auth.otp.sending') : t('auth.otp.sendOtp')}
          </Button>

          <Divider
            text={t('common.or')}
            className="[&_span]:dark:bg-white [&_div]:dark:border-neutral-200"
          />

          <Link to="/login" className="block">
            <Button
              variant="outline"
              className="w-full h-11 gap-2.5 font-medium hover:bg-neutral-50 transition-colors bg-white dark:bg-white text-neutral-700 dark:text-neutral-700 border-neutral-200 dark:border-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-50 hover:text-neutral-900 dark:hover:text-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-300"
            >
              <Lock size={18} />
              {t('auth.otp.signInWithPassword')}
            </Button>
          </Link>
        </form>
      </CardContent>
    </Card>
  );
}

