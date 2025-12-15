import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Mail, CheckCircle, KeyRound } from 'lucide-react';
import { authApi } from '../../lib/api';
import { Button, Input, Card, CardContent, Alert } from '../../components/ui';

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
      <Card className="w-full max-w-md mx-4 sm:mx-0 shadow-2xl border-0 dark:border-0 bg-white dark:bg-white overflow-hidden">
        {/* Header Section with gradient accent */}
        <div className="relative px-8 pt-8 pb-6 text-center">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-green-500" />

          {/* Success Icon */}
          <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>

          <h1 className="text-2xl font-bold text-neutral-900">
            {t('auth.forgotPassword.checkEmail', 'Check your email')}
          </h1>
          <p className="mt-3 text-neutral-500 text-sm leading-relaxed max-w-sm mx-auto">
            {t('auth.forgotPassword.successMessage', "If an account exists for that email, we've sent password reset instructions.")}
          </p>
        </div>

        <CardContent className="px-8 pb-8 pt-2">
          <Link to="/login" className="block">
            <Button
              variant="outline"
              className="w-full h-11 gap-2.5 font-medium hover:bg-neutral-50 transition-colors bg-white dark:bg-white text-neutral-700 dark:text-neutral-700 border-neutral-200 dark:border-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-50 hover:text-neutral-900 dark:hover:text-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-300"
            >
              <ArrowLeft size={18} />
              {t('auth.forgotPassword.backToLogin', 'Back to login')}
            </Button>
          </Link>
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
          {t('auth.forgotPassword.title', 'Forgot password?')}
        </h1>
        <p className="mt-2 text-neutral-500 text-sm">
          {t('auth.forgotPassword.description', "Enter your email and we'll send you a reset link")}
        </p>
      </div>

      <CardContent className="px-8 pb-8 pt-0">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <Alert variant="error" className="animate-in fade-in slide-in-from-top-1 duration-200">
              {error}
            </Alert>
          )}

          {/* Email Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700">
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
                className="pl-11 h-12 text-base bg-white dark:bg-white border-neutral-300 dark:border-neutral-300 text-neutral-900 dark:text-neutral-900 placeholder:text-neutral-400 dark:placeholder:text-neutral-400 focus:border-primary-500 focus:ring-0 dark:focus:border-primary-500 dark:focus:ring-0"
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
            className="w-full h-12 text-base font-semibold shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-shadow"
          >
            {t('auth.forgotPassword.sendResetLink', 'Send reset link')}
          </Button>

          <div className="text-center pt-2">
            <Link
              to="/login"
              className="text-neutral-500 hover:text-neutral-900 text-sm inline-flex items-center gap-2 transition-colors"
            >
              <ArrowLeft size={16} />
              {t('auth.forgotPassword.backToLogin', 'Back to login')}
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

