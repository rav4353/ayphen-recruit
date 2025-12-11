import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Mail } from 'lucide-react';
import { authApi } from '../../lib/api';
import { Button, Input, Card, CardHeader, Alert, Divider, OtpInput } from '../../components/ui';

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
    <Card className="w-full max-w-md">
      <CardHeader
        title={t('auth.verifyEmail.title')}
        description={t('auth.verifyEmail.description')}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {error && <Alert variant="error">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <Input
          label={t('auth.verifyEmail.email')}
          type="email"
          placeholder={t('auth.verifyEmail.emailPlaceholder')}
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

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            {t('auth.verifyEmail.code')}
          </label>
          <OtpInput
            length={6}
            value={code}
            onChange={(value: string[]) => {
              setCode(value);
              setValue('code', value.join(''));
            }}
          />
        </div>

        <Button type="submit" isLoading={isSubmitting} className="w-full">
          {isSubmitting ? t('auth.verifyEmail.verifying') : t('auth.verifyEmail.verify')}
        </Button>

        <div className="flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400">
          <button
            type="button"
            className="underline"
            onClick={() => handleResend((document.querySelector('input[name="email"]') as HTMLInputElement)?.value || '')}
            disabled={isResending}
          >
            {isResending ? t('auth.verifyEmail.resending') : t('auth.verifyEmail.resend')}
          </button>

          <Link to="/login" className="underline">
            {t('auth.verifyEmail.backToLogin')}
          </Link>
        </div>

        <Divider text={t('common.or')} />

        <p className="text-center text-neutral-500 dark:text-neutral-400 text-sm">
          {t('auth.verifyEmail.alreadyVerified')}{' '}
          <Link to="/login" className="text-neutral-900 dark:text-white hover:underline">
            {t('auth.register.signIn')}
          </Link>
        </p>
      </form>
    </Card>
  );
}
