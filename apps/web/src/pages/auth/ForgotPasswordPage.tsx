import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Mail, CheckCircle, KeyRound } from 'lucide-react';
import { authApi } from '../../lib/api';
import { Button, Input, Alert } from '../../components/ui';
import { PremiumAuthLayout } from '../../components/auth/PremiumAuthLayout';

interface ForgotPasswordForm {
  email: string;
}

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>();

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    setError('');

    try {
      await authApi.forgotPassword({
        email: data.email,
      });
      setIsSuccess(true);
    } catch (err) {
      setError(t('auth.forgotPassword.error', 'Something went wrong. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <PremiumAuthLayout
        title={t('auth.forgotPassword.checkEmail', 'Check your email')}
        subtitle={t(
          'auth.forgotPassword.successMessage',
          "If an account exists for that email, we've sent password reset instructions."
        )}
      >
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>

        <Link to="/login" className="block">
          <Button
            variant="outline"
            className="w-full h-11 gap-2.5 font-medium border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600 transition-all rounded-xl"
          >
            <ArrowLeft size={18} />
            {t('auth.forgotPassword.backToLogin', 'Back to login')}
          </Button>
        </Link>
      </PremiumAuthLayout>
    );
  }

  return (
    <PremiumAuthLayout
      title={t('auth.forgotPassword.title', 'Forgot password?')}
      subtitle={t('auth.forgotPassword.description', "Enter your email and we'll send you a reset link")}
    >
      <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary-500/20 to-primary-600/20 flex items-center justify-center">
        <KeyRound className="w-8 h-8 text-primary-500" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <Alert variant="error" className="animate-in fade-in slide-in-from-top-1 duration-200">
            {error}
          </Alert>
        )}

        {/* Email Field */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">
            {t('auth.forgotPassword.email', 'Email')}
          </label>
          <div className="relative group">
            <Mail
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-primary-500 transition-colors"
            />
            <Input
              type="email"
              placeholder={t('auth.forgotPassword.emailPlaceholder', 'you@company.com')}
              error={errors.email?.message}
              className="pl-11 h-12 text-base border-neutral-200 dark:border-neutral-700 focus:border-primary-500 focus:ring-primary-500/20 rounded-xl"
              {...register('email', {
                required: t('auth.validation.emailRequired', 'Email is required'),
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: t('auth.validation.emailInvalid', 'Invalid email address'),
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
          {t('auth.forgotPassword.sendResetLink', 'Send reset link')}
        </Button>

        <div className="text-center pt-2">
          <Link
            to="/login"
            className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200 text-sm inline-flex items-center gap-2 transition-colors"
          >
            <ArrowLeft size={16} />
            {t('auth.forgotPassword.backToLogin', 'Back to login')}
          </Link>
        </div>
      </form>
    </PremiumAuthLayout>
  );
}

