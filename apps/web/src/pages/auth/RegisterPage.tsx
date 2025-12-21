import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Mail, User, Lock, Check, X } from 'lucide-react';
import { m } from 'framer-motion';
import { authApi } from '../../lib/api';
import { Button, Input, Alert } from '../../components/ui';
import { PremiumAuthLayout } from '../../components/auth/PremiumAuthLayout';

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
    <PremiumAuthLayout
      title={t('auth.register.title')}
      subtitle={t('auth.register.description')}
    >
      <form
        id="register-form"
        name="register"
        onSubmit={handleSubmit(onSubmit)}
        method="POST"
        className="space-y-5"
      >
        {error && (
          <Alert variant="error" className="animate-in fade-in slide-in-from-top-1 duration-200">
            {error}
          </Alert>
        )}

        {/* Name Fields */}
        <m.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <Input
            id="register-first-name"
            label={t('auth.register.firstName')}
            placeholder={t('auth.register.firstNamePlaceholder')}
            error={errors.firstName?.message}
            leftIcon={<User size={18} />}
            autoComplete="given-name"
            className="h-12 text-base rounded-xl transition-all"
            {...register('firstName', {
              required: t('auth.validation.firstNameRequired'),
            })}
          />
          <Input
            id="register-last-name"
            label={t('auth.register.lastName')}
            placeholder={t('auth.register.lastNamePlaceholder')}
            error={errors.lastName?.message}
            leftIcon={<User size={18} />}
            autoComplete="family-name"
            className="h-12 text-base rounded-xl transition-all"
            {...register('lastName', {
              required: t('auth.validation.lastNameRequired'),
            })}
          />
        </m.div>

        {/* Email Field */}
        <m.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="space-y-2"
        >
          <Input
            id="register-email"
            type="email"
            label={t('auth.register.email')}
            placeholder={t('auth.register.emailPlaceholder')}
            error={errors.email?.message}
            autoComplete="email"
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

        {/* Password Field with Strength Indicator */}
        <m.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="space-y-2"
        >
          <Input
            id="register-password"
            type="password"
            label={t('auth.register.password')}
            placeholder={t('auth.register.passwordPlaceholder')}
            error={errors.password?.message}
            autoComplete="new-password"
            leftIcon={<Lock size={18} />}
            className="h-12 text-base rounded-xl transition-all"
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
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 text-[11px]">
                <PasswordCheck passed={checks.length} label="8+ chars" />
                <PasswordCheck passed={checks.lowercase} label="Lowercase" />
                <PasswordCheck passed={checks.uppercase} label="Uppercase" />
                <PasswordCheck passed={checks.number} label="Number" />
                <PasswordCheck passed={checks.special} label="Special char" />
              </div>
            </div>
          )}
        </m.div>

        {/* Confirm Password Field */}
        <m.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="space-y-2"
        >
          <Input
            id="register-confirm-password"
            type="password"
            label={t('auth.register.confirmPassword')}
            placeholder={t('auth.register.confirmPasswordPlaceholder')}
            error={errors.confirmPassword?.message}
            autoComplete="new-password"
            leftIcon={<Lock size={18} />}
            className="h-12 text-base rounded-xl transition-all"
            {...register('confirmPassword', {
              required: t('auth.validation.passwordRequired'),
              validate: (value) => value === password || t('auth.validation.passwordsDoNotMatch'),
            })}
          />
        </m.div>

        {/* Submit Button */}
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="pt-2"
        >
          <Button
            type="submit"
            isLoading={isLoading}
            className="relative w-full h-12 text-base font-semibold bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 shadow-soft-lg hover:shadow-primary-500/30 overflow-hidden group rounded-xl transition-all"
          >
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
              {isLoading ? t('auth.register.creatingAccount') : t('auth.register.createAccount')}
            </span>
          </Button>
        </m.div>

        {/* Sign In Link */}
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="text-center pt-2"
        >
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {t('auth.register.hasAccount')}{' '}
            <Link
              to="/login"
              className="font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors hover:underline"
            >
              {t('auth.register.signIn')}
            </Link>
          </p>
        </m.div>
      </form>
    </PremiumAuthLayout>
  );
}
