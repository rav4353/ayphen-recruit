import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Mail, User } from 'lucide-react';
import { authApi } from '../../lib/api';
import { Button, Input, Card, CardHeader, Alert, Divider } from '../../components/ui';

interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

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

  const password = watch('password');

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
    <Card className="w-full max-w-md">
      <CardHeader
        title={t('auth.register.title')}
        description={t('auth.register.description')}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {error && <Alert variant="error">{error}</Alert>}

        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t('auth.register.firstName')}
            placeholder={t('auth.register.firstNamePlaceholder')}
            leftIcon={<User size={18} />}
            error={errors.firstName?.message}
            {...register('firstName', {
              required: t('auth.validation.firstNameRequired'),
            })}
          />
          <Input
            label={t('auth.register.lastName')}
            placeholder={t('auth.register.lastNamePlaceholder')}
            error={errors.lastName?.message}
            {...register('lastName', {
              required: t('auth.validation.lastNameRequired'),
            })}
          />
        </div>

        <Input
          label={t('auth.register.email')}
          type="email"
          placeholder={t('auth.register.emailPlaceholder')}
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

        <Input
          label={t('auth.register.password')}
          type="password"
          placeholder={t('auth.register.passwordPlaceholder')}
          error={errors.password?.message}
          hint={t('auth.register.passwordRequirements')}
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

        <Input
          label={t('auth.register.confirmPassword')}
          type="password"
          placeholder={t('auth.register.confirmPasswordPlaceholder')}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword', {
            required: t('auth.validation.passwordRequired'),
            validate: (value) => value === password || t('auth.validation.passwordsDoNotMatch'),
          })}
        />

        <Button type="submit" isLoading={isLoading} className="w-full">
          {isLoading ? t('auth.register.creatingAccount') : t('auth.register.createAccount')}
        </Button>

        <Divider text={t('common.or')} />

        <p className="text-center text-neutral-500 dark:text-neutral-400 text-sm">
          {t('auth.register.hasAccount')}{' '}
          <Link to="/login" className="text-neutral-900 dark:text-white hover:underline">
            {t('auth.register.signIn')}
          </Link>
        </p>
      </form>
    </Card>
  );
}
