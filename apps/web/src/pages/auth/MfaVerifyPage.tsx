import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, Shield, ArrowLeft } from 'lucide-react';
import { authApi } from '../../lib/api';
import { useAuthStore } from '../../stores/auth';

export function MfaVerifyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((state) => state.setAuth);

  const mfaToken = location.state?.mfaToken;

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberDevice, setRememberDevice] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newCode.every((digit) => digit) && newCode.join('').length === 6) {
      verifyMfa(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newCode = [...code];
    pastedData.split('').forEach((digit, index) => {
      if (index < 6) newCode[index] = digit;
    });
    setCode(newCode);

    if (pastedData.length === 6) {
      verifyMfa(pastedData);
    }
  };

  const verifyMfa = async (verificationCode: string) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await authApi.verifyMfa(verificationCode, rememberDevice);
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
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Invalid verification code');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  if (!mfaToken) {
    return (
      <div className="glass-card text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Session Expired</h1>
        <p className="text-white/60 mb-6">
          Please log in again to continue.
        </p>
        <button onClick={() => navigate('/login')} className="btn-primary">
          Go to login
        </button>
      </div>
    );
  }

  return (
    <div className="glass-card">
      <div className="text-center mb-8">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary-500/20 flex items-center justify-center">
          <Shield className="w-6 h-6 text-primary-400" />
        </div>
        <h1 className="text-2xl font-bold text-white">Two-Factor Authentication</h1>
        <p className="text-white/60 mt-2">
          Enter the 6-digit code from your authenticator app
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm mb-5">
          {error}
        </div>
      )}

      <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
        {code.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleCodeChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            className="w-12 h-14 text-center text-2xl font-bold bg-white/5 border border-white/10 rounded-lg text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all"
            disabled={isLoading}
          />
        ))}
      </div>

      {isLoading && (
        <div className="flex justify-center mb-4">
          <Loader2 className="w-6 h-6 text-primary-400 animate-spin" />
        </div>
      )}

      <label className="flex items-center gap-2 justify-center mb-6 cursor-pointer">
        <input
          type="checkbox"
          checked={rememberDevice}
          onChange={(e) => setRememberDevice(e.target.checked)}
          className="w-4 h-4 rounded border-white/20 bg-white/5 text-primary-500 focus:ring-primary-500"
        />
        <span className="text-white/60 text-sm">Remember this device for 30 days</span>
      </label>

      <button
        onClick={() => navigate('/login')}
        className="flex items-center justify-center gap-2 text-white/60 hover:text-white transition-colors mx-auto"
      >
        <ArrowLeft size={18} />
        Back to login
      </button>
    </div>
  );
}
