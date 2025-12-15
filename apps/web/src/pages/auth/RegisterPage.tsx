import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Mail, User, Lock, Check, X } from 'lucide-react';
import { authApi } from '../../lib/api';
import { Button, Input, Card, CardContent, Alert, Divider } from '../../components/ui';

interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// Password strength checker
const usePasswordStrength = (password: string) => {
  return useMemo(() => {
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&]/.test(password),
    };

    const passedChecks = Object.values(checks).filter(Boolean).length;
    const strength = passedChecks === 0 ? 0 : passedChecks <= 2 ? 1 : passedChecks <= 4 ? 2 : 3;

    return { checks, strength, passedChecks };
  }, [password]);
};

// Password requirement component
const PasswordCheck = ({ passed, label }: { passed: boolean; label: string }) => (
  <div className={`flex items-center gap-2 text-xs ${passed ? 'text-green-600' : 'text-neutral-400'}`}>
    {passed ? <Check size={12} className="shrink-0" /> : <X size={12} className="shrink-0" />}
    <span>{label}</span>
  </div>
);

export function RegisterPage() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>();

  const password = watch('password') || '';
  const { checks, strength } = usePasswordStrength(password);

  const strengthColors = ['bg-neutral-200', 'bg-red-500', 'bg-yellow-500', 'bg-green-500'];
  const strengthLabels = ['', 'Weak', 'Medium', 'Strong'];

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    setError('');

    try {
      await authApi.register({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      });

      navigate('/auth/verify-email', { state: { email: data.email } });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || t('auth.register.registrationFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-4 sm:mx-0 shadow-2xl border-0 dark:border-0 bg-white dark:bg-white overflow-hidden">
      {/* Header Section with gradient accent - Compact padding */}
      <div className="relative px-6 pt-6 pb-4 text-center">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-500" />
        <h1 className="text-xl font-bold text-neutral-900">
          {t('auth.register.title')}
        </h1>
        <p className="mt-1.5 text-neutral-500 text-sm">
          {t('auth.register.description')}
        </p>
      </div>

      <CardContent className="px-6 pb-6 pt-0">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
          {error && (
            <Alert variant="error" className="animate-in fade-in slide-in-from-top-1 duration-200">
              {error}
            </Alert>
          )}

          {/* Name Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-700">
                {t('auth.register.firstName')}
              </label>
              <div className="relative group">
                <User
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-primary-500 transition-colors"
                />
                <Input
                  placeholder={t('auth.register.firstNamePlaceholder')}
                  error={errors.firstName?.message}
                  className="pl-10 h-10 text-sm bg-white dark:bg-white border-neutral-300 dark:border-neutral-300 text-neutral-900 dark:text-neutral-900 placeholder:text-neutral-400 dark:placeholder:text-neutral-400 focus:border-primary-500 focus:ring-0 dark:focus:border-primary-500 dark:focus:ring-0"
                  {...register('firstName', {
                    required: t('auth.validation.firstNameRequired'),
                  })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-700">
                {t('auth.register.lastName')}
              </label>
              <div className="relative group">
                <User
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-primary-500 transition-colors"
                />
                <Input
                  placeholder={t('auth.register.lastNamePlaceholder')}
                  error={errors.lastName?.message}
                  className="pl-10 h-10 text-sm bg-white dark:bg-white border-neutral-300 dark:border-neutral-300 text-neutral-900 dark:text-neutral-900 placeholder:text-neutral-400 dark:placeholder:text-neutral-400 focus:border-primary-500 focus:ring-0 dark:focus:border-primary-500 dark:focus:ring-0"
                  {...register('lastName', {
                    required: t('auth.validation.lastNameRequired'),
                  })}
                />
              </div>
            </div>
          </div>

          {/* Email Field */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-700">
              {t('auth.register.email')}
            </label>
            <div className="relative group">
              <Mail
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-primary-500 transition-colors"
              />
              <Input
                type="email"
                placeholder={t('auth.register.emailPlaceholder')}
                error={errors.email?.message}
                className="pl-10 h-10 text-sm bg-white dark:bg-white border-neutral-300 dark:border-neutral-300 text-neutral-900 dark:text-neutral-900 placeholder:text-neutral-400 dark:placeholder:text-neutral-400 focus:border-primary-500 focus:ring-0 dark:focus:border-primary-500 dark:focus:ring-0"
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

          {/* Password Field with Strength Indicator */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-700">
              {t('auth.register.password')}
            </label>
            <div className="relative group">
              <Lock
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-primary-500 transition-colors"
              />
              <Input
                type="password"
                placeholder={t('auth.register.passwordPlaceholder')}
                error={errors.password?.message}
                className="pl-10 h-10 text-sm bg-white dark:bg-white border-neutral-300 dark:border-neutral-300 text-neutral-900 dark:text-neutral-900 placeholder:text-neutral-400 dark:placeholder:text-neutral-400 focus:border-primary-500 focus:ring-0 dark:focus:border-primary-500 dark:focus:ring-0"
                {...register('password', {
                  required: t('auth.validation.passwordRequired'),
                  minLength: {
                    value: 8,
                    message: t('auth.validation.passwordMin'),
                  },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                    message: t('auth.validation.passwordWeak'),
                  },
                })}
              />
            </div>

            {/* Password Strength Bar */}
            {password && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex gap-1">
                    {[1, 2, 3].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors ${strength >= level ? strengthColors[strength] : 'bg-neutral-200'
                          }`}
                      />
                    ))}
                  </div>
                  {strength > 0 && (
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${strength === 1 ? 'text-red-500' : strength === 2 ? 'text-yellow-500' : 'text-green-500'
                      }`}>
                      {strengthLabels[strength]}
                    </span>
                  )}
                </div>

                {/* Password Requirements - Compact */}
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 p-2 rounded-md bg-neutral-50 text-[11px]">
                  <PasswordCheck passed={checks.length} label="8+ chars" />
                  <PasswordCheck passed={checks.lowercase} label="Lowercase" />
                  <PasswordCheck passed={checks.uppercase} label="Uppercase" />
                  <PasswordCheck passed={checks.number} label="Number" />
                  <PasswordCheck passed={checks.special} label="Special char" />
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-700">
              {t('auth.register.confirmPassword')}
            </label>
            <div className="relative group">
              <Lock
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-primary-500 transition-colors"
              />
              <Input
                type="password"
                placeholder={t('auth.register.confirmPasswordPlaceholder')}
                error={errors.confirmPassword?.message}
                className="pl-10 h-10 text-sm bg-white dark:bg-white border-neutral-300 dark:border-neutral-300 text-neutral-900 dark:text-neutral-900 placeholder:text-neutral-400 dark:placeholder:text-neutral-400 focus:border-primary-500 focus:ring-0 dark:focus:border-primary-500 dark:focus:ring-0"
                {...register('confirmPassword', {
                  required: t('auth.validation.passwordRequired'),
                  validate: (value) => value === password || t('auth.validation.passwordsDoNotMatch'),
                })}
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            isLoading={isLoading}
            className="w-full h-11 text-sm font-semibold shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-shadow mt-2"
          >
            {isLoading ? t('auth.register.creatingAccount') : t('auth.register.createAccount')}
          </Button>

          <Divider
            text={t('common.or')}
            className="my-3 [&_span]:dark:bg-white [&_div]:dark:border-neutral-200"
          />

          {/* Sign In Link */}
          <p className="text-center text-neutral-600 text-sm">
            {t('auth.register.hasAccount')}{' '}
            <Link
              to="/login"
              className="font-semibold text-primary-600 hover:text-primary-700 transition-colors"
            >
              {t('auth.register.signIn')}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
