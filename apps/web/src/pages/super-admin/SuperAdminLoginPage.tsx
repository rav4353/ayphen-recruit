import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Shield, Eye, EyeOff, AlertTriangle, Lock } from 'lucide-react';
import { useSuperAdminStore } from '../../stores/superAdmin';
import { superAdminAuthApi } from '../../lib/superAdminApi';
import { Button, Input, Modal } from '../../components/ui';
import toast from 'react-hot-toast';

interface LoginForm {
  email: string;
  password: string;
}

export function SuperAdminLoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [forcePasswordChangeOpen, setForcePasswordChangeOpen] = useState(false);
  const [forcePasswordEmail, setForcePasswordEmail] = useState('');
  const [forcePasswordCurrent, setForcePasswordCurrent] = useState('');
  const [forcePasswordNew, setForcePasswordNew] = useState('');
  const [forcePasswordConfirm, setForcePasswordConfirm] = useState('');
  const [forcePasswordError, setForcePasswordError] = useState('');
  const [forcePasswordLoading, setForcePasswordLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useSuperAdminStore((state) => state.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    console.log('[SuperAdmin] Login attempt:', { email: data.email });
    setIsLoading(true);
    setError('');

    try {
      console.log('[SuperAdmin] Calling API...');
      const response = await superAdminAuthApi.login(data.email, data.password);
      console.log('[SuperAdmin] API response:', response);

      const payload = response.data.data;
      if (payload?.requirePasswordChange) {
        setForcePasswordEmail(data.email);
        setForcePasswordCurrent(data.password);
        setForcePasswordNew('');
        setForcePasswordConfirm('');
        setForcePasswordError('');
        setForcePasswordChangeOpen(true);
        toast('Password update required');
        return;
      }

      const { superAdmin, accessToken, refreshToken } = payload;
      console.log('[SuperAdmin] Extracted data:', { superAdmin, hasToken: !!accessToken });

      setAuth({
        superAdmin,
        accessToken,
        refreshToken,
      });

      console.log('[SuperAdmin] Auth set, navigating...');
      toast.success('Welcome back, Super Admin');
      navigate('/super-admin/dashboard');
    } catch (err: unknown) {
      console.error('[SuperAdmin] Login error:', err);
      const error = err as { response?: { data?: { message?: string } } };
      const errorMessage = error.response?.data?.message || 'Invalid credentials';
      console.error('[SuperAdmin] Error message:', errorMessage);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      console.log('[SuperAdmin] Login attempt complete');
      setIsLoading(false);
    }
  };

  const handleForcePasswordChange = async () => {
    setForcePasswordLoading(true);
    setForcePasswordError('');
    try {
      if (forcePasswordNew !== forcePasswordConfirm) {
        setForcePasswordError('Passwords do not match');
        return;
      }

      const response = await superAdminAuthApi.forceChangePassword(
        forcePasswordEmail,
        forcePasswordCurrent,
        forcePasswordNew,
      );

      const { superAdmin, accessToken, refreshToken } = response.data.data;
      setAuth({
        superAdmin,
        accessToken,
        refreshToken,
      });

      setForcePasswordCurrent('');
      setForcePasswordChangeOpen(false);

      toast.success('Password updated');
      navigate('/super-admin/dashboard');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setForcePasswordError(error.response?.data?.message || 'Failed to update password');
    } finally {
      setForcePasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <Modal
        isOpen={forcePasswordChangeOpen}
        onClose={() => {}}
        title="Change your password"
        disableClose
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            For security, you must change your password before continuing.
          </p>

          <Input
            type="password"
            label="New Password"
            value={forcePasswordNew}
            onChange={(e) => setForcePasswordNew(e.target.value)}
            placeholder="At least 16 chars with upper/lower/number/special"
          />

          <Input
            type="password"
            label="Confirm New Password"
            value={forcePasswordConfirm}
            onChange={(e) => setForcePasswordConfirm(e.target.value)}
            placeholder="Repeat new password"
          />

          {forcePasswordError && (
            <p className="text-sm text-red-400">{forcePasswordError}</p>
          )}

          <div className="flex justify-end">
            <Button onClick={handleForcePasswordChange} isLoading={forcePasswordLoading}>
              Update Password
            </Button>
          </div>
        </div>
      </Modal>

      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Security notice */}
        <div className="mb-6 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-500">Restricted Access</p>
              <p className="text-xs text-yellow-500/70 mt-1">
                This portal is for authorized super administrators only. All access attempts are logged and monitored.
              </p>
            </div>
          </div>
        </div>

        {/* Login card */}
        <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-800 rounded-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/20">
              <Shield size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Super Admin Portal</h1>
            <p className="text-neutral-400 text-sm mt-2">Sign in to access the control panel</p>
          </div>

          {/* Error display */}
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
              <Lock size={18} className="text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="admin@talentx.com"
                className="bg-neutral-800/50 border-neutral-700 text-white placeholder-neutral-500 focus:border-red-500 focus:ring-red-500/20"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
              />
              {errors.email && (
                <p className="text-sm text-red-400 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  className="bg-neutral-800/50 border-neutral-700 text-white placeholder-neutral-500 focus:border-red-500 focus:ring-red-500/20 pr-12"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters',
                    },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-400 mt-1">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold py-3 rounded-xl"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Shield size={18} />
                  Sign In as Super Admin
                </span>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-neutral-800">
            <p className="text-xs text-neutral-500 text-center">
              Protected by TalentX Security. Session timeout: 30 minutes.
            </p>
          </div>
        </div>

        {/* Back to main app */}
        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            ← Back to TalentX
          </a>
        </div>
      </div>
    </div>
  );
}
