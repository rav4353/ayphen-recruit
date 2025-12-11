import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Shield, Copy, Check, ArrowLeft, AlertTriangle } from 'lucide-react';
import { authApi } from '../../lib/api';
import { useAuthStore } from '../../stores/auth';

interface MfaSetupData {
  otpauthUrl: string;
  secret: string;
  qrCode: string;
}

export function MfaSetupPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [step, setStep] = useState<'setup' | 'verify' | 'backup'>('setup');
  const [setupData, setSetupData] = useState<MfaSetupData | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [backupCodesCopied, setBackupCodesCopied] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    initiateMfaSetup();
  }, []);

  const initiateMfaSetup = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await authApi.setupMfa();
      setSetupData(response.data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to initiate MFA setup');
    } finally {
      setIsLoading(false);
    }
  };

  const copySecret = () => {
    if (setupData?.secret) {
      navigator.clipboard.writeText(setupData.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setBackupCodesCopied(true);
    setTimeout(() => setBackupCodesCopied(false), 2000);
  };

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
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
  };

  const verifyAndEnable = async () => {
    const verificationCode = code.join('');
    if (verificationCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await authApi.confirmMfa(verificationCode);
      setBackupCodes(response.data.backupCodes);
      setStep('backup');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Invalid verification code');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !setupData) {
    return (
      <div className="glass-card text-center">
        <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary-400 animate-spin" />
        <h1 className="text-2xl font-bold text-white mb-2">Setting up MFA...</h1>
      </div>
    );
  }

  if (step === 'backup') {
    return (
      <div className="glass-card">
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
            <Check className="w-6 h-6 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">MFA Enabled!</h1>
          <p className="text-white/60 mt-2">
            Save these backup codes in a secure place
          </p>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-200">
              <p className="font-medium mb-1">Important!</p>
              <p className="text-yellow-200/80">
                Each backup code can only be used once. Store them securely - you won't be able to see them again.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-2 gap-2">
            {backupCodes.map((code, index) => (
              <div
                key={index}
                className="font-mono text-sm text-white/80 bg-white/5 rounded px-3 py-2 text-center"
              >
                {code}
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={copyBackupCodes}
          className="btn-secondary w-full flex items-center justify-center gap-2 mb-6"
        >
          {backupCodesCopied ? (
            <>
              <Check size={18} />
              Copied!
            </>
          ) : (
            <>
              <Copy size={18} />
              Copy backup codes
            </>
          )}
        </button>

        <button
          onClick={() => navigate(`/${user?.tenantId}/dashboard`)}
          className="btn-primary w-full"
        >
          Done
        </button>
      </div>
    );
  }

  if (step === 'verify') {
    return (
      <div className="glass-card">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">Verify Setup</h1>
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

        <button
          onClick={verifyAndEnable}
          disabled={isLoading || code.join('').length !== 6}
          className="btn-primary w-full flex items-center justify-center gap-2 mb-4"
        >
          {isLoading && <Loader2 size={18} className="animate-spin" />}
          Verify and Enable
        </button>

        <button
          onClick={() => setStep('setup')}
          className="flex items-center justify-center gap-2 text-white/60 hover:text-white transition-colors mx-auto"
        >
          <ArrowLeft size={18} />
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="glass-card">
      <div className="text-center mb-6">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary-500/20 flex items-center justify-center">
          <Shield className="w-6 h-6 text-primary-400" />
        </div>
        <h1 className="text-2xl font-bold text-white">Set Up Two-Factor Authentication</h1>
        <p className="text-white/60 mt-2">
          Scan the QR code with your authenticator app
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm mb-5">
          {error}
        </div>
      )}

      {setupData && (
        <>
          <div className="bg-white rounded-lg p-4 mb-6 flex justify-center">
            {/* QR Code placeholder - in production, render actual QR code */}
            <div className="w-48 h-48 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
              <div className="text-center">
                <p className="mb-2">QR Code</p>
                <p className="text-xs break-all px-2">{setupData.secret}</p>
              </div>
            </div>
          </div>

          <div className="text-center mb-6">
            <p className="text-white/60 text-sm mb-2">Or enter this code manually:</p>
            <div className="flex items-center justify-center gap-2">
              <code className="bg-white/5 px-3 py-2 rounded font-mono text-white">
                {setupData.secret}
              </code>
              <button
                onClick={copySecret}
                className="p-2 text-white/60 hover:text-white transition-colors"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
          </div>

          <button
            onClick={() => {
              setStep('verify');
              setTimeout(() => inputRefs.current[0]?.focus(), 100);
            }}
            className="btn-primary w-full mb-4"
          >
            Continue
          </button>
        </>
      )}

      <button
        onClick={() => navigate(-1)}
        className="flex items-center justify-center gap-2 text-white/60 hover:text-white transition-colors mx-auto"
      >
        <ArrowLeft size={18} />
        Cancel
      </button>
    </div>
  );
}
