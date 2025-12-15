import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Mail } from 'lucide-react';
import { authApi } from '../../lib/api';
import { Button, Input, Card, CardContent, Alert, Divider, OtpInput } from '../../components/ui';

interface VerifyEmailForm {
  email: string;
  code: string;
}

export function VerifyEmailPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const initialEmail = (location.state as { email?: string } | null)?.email || '';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [code, setCode] = useState<string[]>(Array(6).fill(''));

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<VerifyEmailForm>({
    defaultValues: {
      email: initialEmail,
      code: '',
    },
  });

  const onSubmit = async (data: VerifyEmailForm) => {
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    const codeStr = code.join('');

    try {
      await authApi.verifyOtp({
        email: data.email,
        code: codeStr,
        type: 'EMAIL_VERIFY',
      });
      setSuccess(t('auth.verifyEmail.success'));
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      setError(t('auth.verifyEmail.invalidCode'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async (email: string) => {
    setIsResending(true);
    setError('');
    setSuccess('');

    try {
      await authApi.requestOtp({
        email,
        tenantId: 'demo-tenant',
        type: 'EMAIL_VERIFY',
      });
      setSuccess(t('auth.verifyEmail.resent'));
    } catch (err) {
      setError(t('auth.verifyEmail.resendFailed'));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-4 sm:mx-0 shadow-2xl border-0 dark:border-0 bg-white dark:bg-white overflow-hidden">
      {/* Header Section with gradient accent */}
      <div className="relative px-8 pt-8 pb-6 text-center">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-500" />

        {/* Icon */}
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-500/20 to-primary-600/20 flex items-center justify-center">
          <Mail className="w-8 h-8 text-primary-500" />
        </div>

        <h1 className="text-2xl font-bold text-neutral-900">
          {t('auth.verifyEmail.title')}
        </h1>
        <p className="mt-2 text-neutral-500 text-sm">
          {t('auth.verifyEmail.description')}
        </p>
      </div>

      <CardContent className="px-8 pb-8 pt-0">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && <Alert variant="error">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          {/* Email Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700">
              {t('auth.verifyEmail.email')}
            </label>
            <div className="relative group">
              <Mail
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-primary-500 transition-colors"
              />
              <Input
                type="email"
                placeholder={t('auth.verifyEmail.emailPlaceholder')}
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

          {/* OTP Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-700 text-center mb-1">
              {t('auth.verifyEmail.code')}
            </label>
            <OtpInput
              length={6}
              value={code}
              onChange={(value: string[]) => {
                setCode(value);
                setValue('code', value.join(''));
              }}
              inputClassName="bg-white dark:bg-white border-neutral-300 dark:border-neutral-300 text-neutral-900 dark:text-neutral-900 focus:border-primary-500 focus:ring-0 dark:focus:border-primary-500 dark:focus:ring-0"
            />
          </div>

          <Button
            type="submit"
            isLoading={isSubmitting}
            className="w-full h-12 text-base font-semibold shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-shadow"
          >
            {isSubmitting ? t('auth.verifyEmail.verifying') : t('auth.verifyEmail.verify')}
          </Button>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              className="text-neutral-500 hover:text-neutral-900 transition-colors"
              onClick={() => handleResend((document.querySelector('input[name="email"]') as HTMLInputElement)?.value || '')}
              disabled={isResending}
            >
              {isResending ? t('auth.verifyEmail.resending') : t('auth.verifyEmail.resend')}
            </button>

            <Link
              to="/login"
              className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              {t('auth.verifyEmail.backToLogin')}
            </Link>
          </div>

          <Divider
            text={t('common.or')}
            className="[&_span]:dark:bg-white [&_div]:dark:border-neutral-200"
          />

          <p className="text-center text-neutral-500 text-sm">
            {t('auth.verifyEmail.alreadyVerified')}{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium hover:underline">
              {t('auth.register.signIn')}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
