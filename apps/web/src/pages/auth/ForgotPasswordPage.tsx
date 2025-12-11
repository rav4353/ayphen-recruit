import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { authApi } from '../../lib/api';
import { Button, Input, Card, CardHeader, Alert } from '../../components/ui';

interface ForgotPasswordForm {
  email: string;
}

export function ForgotPasswordPage() {
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
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className="w-full max-w-md text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/10 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-emerald-400" />
        </div>
        <h1 className="text-2xl font-semibold text-white mb-2">Check your email</h1>
        <p className="text-neutral-400 mb-6">
          If an account exists for that email, we've sent password reset instructions.
        </p>
        <Link to="/login">
          <Button variant="secondary" leftIcon={<ArrowLeft size={18} />}>
            Back to login
          </Button>
        </Link>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader
        title="Forgot password?"
        description="Enter your email and we'll send you a reset link"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {error && <Alert variant="error">{error}</Alert>}

        <Input
          label="Email"
          type="email"
          placeholder="you@company.com"
          leftIcon={<Mail size={18} />}
          error={errors.email?.message}
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address',
            },
          })}
        />

        <Button type="submit" isLoading={isLoading} className="w-full">
          Send reset link
        </Button>

        <div className="text-center">
          <Link to="/login" className="text-neutral-400 hover:text-white text-sm inline-flex items-center gap-2">
            <ArrowLeft size={16} />
            Back to login
          </Link>
        </div>
      </form>
    </Card>
  );
}
