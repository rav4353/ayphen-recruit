import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Mail, ArrowLeft, KeyRound, Shield, Lock } from 'lucide-react';
import { authApi } from '../../lib/api';
import { useAuthStore } from '../../stores/auth';
import { Button, Input, Alert, Divider, OtpInput } from '../../components/ui';
import { PremiumAuthLayout } from '../../components/auth/PremiumAuthLayout';

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
      <PremiumAuthLayout
        title={t('auth.otp.enterCode')}
        subtitle={t('auth.otp.codeSent', { email })}
      >
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary-500/20 to-primary-600/20 flex items-center justify-center">
          <Shield className="w-8 h-8 text-primary-500" />
        </div>

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
          inputClassName="bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-primary-500/20"
        />

        <div className="text-center space-y-5">
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">
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
            className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200 text-sm inline-flex items-center gap-2 mx-auto transition-colors"
          >
            <ArrowLeft size={16} />
            {t('auth.otp.changeEmail')}
          </button>
        </div>
      </PremiumAuthLayout>
    );
  }

  return (
    <PremiumAuthLayout title={t('auth.otp.title')} subtitle={t('auth.otp.description')}>
      <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary-500/20 to-primary-600/20 flex items-center justify-center">
        <KeyRound className="w-8 h-8 text-primary-500" />
      </div>

      <form onSubmit={handleSubmit(requestOtp)} className="space-y-6">
        {error && (
          <Alert variant="error" className="animate-in fade-in slide-in-from-top-1 duration-200">
            {error}
          </Alert>
        )}

        {/* Email Field */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">
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
              className="pl-11 h-12 text-base border-neutral-200 dark:border-neutral-700 focus:border-primary-500 focus:ring-primary-500/20 rounded-xl"
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
          className="relative w-full h-12 text-base font-semibold bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 shadow-soft-lg hover:shadow-primary-500/30 overflow-hidden group rounded-xl transition-all"
        >
          {isLoading ? t('auth.otp.sending') : t('auth.otp.sendOtp')}
        </Button>

        <Divider text={t('common.or')} className="[&_span]:dark:bg-neutral-900 [&_div]:dark:border-neutral-700" />

        <Link to="/login" className="block">
          <Button
            variant="outline"
            className="w-full h-11 gap-2.5 font-medium border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600 transition-all rounded-xl"
          >
            <Lock size={18} />
            {t('auth.otp.signInWithPassword')}
          </Button>
        </Link>
      </form>
    </PremiumAuthLayout>
  );
}

