import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Mail, ArrowLeft, KeyRound } from 'lucide-react';
import { authApi } from '../../lib/api';
import { useAuthStore } from '../../stores/auth';
import { Button, Input, Card, CardHeader, Alert, Divider, OtpInput } from '../../components/ui';

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
      <Card className="w-full max-w-md">
        <CardHeader
          icon={<KeyRound className="w-6 h-6 text-neutral-400" />}
          title={t('auth.otp.enterCode')}
          description={<>{t('auth.otp.codeSent', { email })}</>}
        />

        {error && <Alert variant="error" className="mb-5">{error}</Alert>}

        <OtpInput
          value={otp}
          onChange={handleOtpChange}
          onComplete={handleOtpComplete}
          disabled={isLoading}
          error={!!error}
          className="mb-6"
        />

        <div className="text-center space-y-4">
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">
            {t('auth.otp.didntReceive')}{' '}
            {countdown > 0 ? (
              <span className="text-neutral-400 dark:text-neutral-500">{t('auth.otp.resendIn', { seconds: countdown })}</span>
            ) : (
              <button
                onClick={resendOtp}
                disabled={isLoading}
                className="text-neutral-900 dark:text-white hover:underline"
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
            className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white text-sm inline-flex items-center gap-2 mx-auto"
          >
            <ArrowLeft size={16} />
            {t('auth.otp.changeEmail')}
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader
        icon={<KeyRound className="w-6 h-6 text-neutral-400" />}
        title={t('auth.otp.title')}
        description={t('auth.otp.description')}
      />

      <form onSubmit={handleSubmit(requestOtp)} className="space-y-5">
        {error && <Alert variant="error">{error}</Alert>}

        <Input
          label={t('auth.otp.email')}
          type="email"
          placeholder={t('auth.otp.emailPlaceholder')}
          leftIcon={<Mail size={18} />}
          error={errors.email?.message}
          {...register('email', {
            required: t('auth.validation.emailRequired'),
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: t('auth.validation.emailInvalid'),
            },
          })}
        />

        <Button type="submit" isLoading={isLoading} className="w-full">
          {isLoading ? t('auth.otp.sending') : t('auth.otp.sendOtp')}
        </Button>

        <Divider text={t('common.or')} />

        <Link to="/login">
          <Button variant="secondary" className="w-full">
            {t('auth.otp.signInWithPassword')}
          </Button>
        </Link>
      </form>
    </Card>
  );
}
