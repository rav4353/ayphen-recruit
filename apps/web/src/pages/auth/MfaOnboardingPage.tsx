import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Copy, Check, ArrowLeft, AlertTriangle, Smartphone, Key, Lock } from 'lucide-react';
import { authApi } from '../../lib/api';
import { PremiumAuthLayout } from '../../components/auth/PremiumAuthLayout';
import { Button } from '../../components/ui';

interface MfaSetupData {
    otpauthUrl: string;
    secret: string;
    qrCode: string;
}

export function MfaOnboardingPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const mfaToken = location.state?.mfaToken;

    const [step, setStep] = useState<'intro' | 'setup' | 'verify' | 'backup'>('intro');
    const [setupData, setSetupData] = useState<MfaSetupData | null>(null);
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (!mfaToken) {
            navigate('/login');
        }
    }, [mfaToken, navigate]);

    const initiateMfaSetup = async () => {
        setIsLoading(true);
        setError('');

        try {
            const response = await authApi.setupMfa(mfaToken);
            setSetupData(response.data.data || response.data);
            setStep('setup');
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setError(error.response?.data?.message || 'Failed to initiate MFA setup');
        } finally {
            setIsLoading(false);
        }
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
            const response = await authApi.confirmMfa(verificationCode, mfaToken);
            setBackupCodes(response.data.data?.backupCodes || response.data.backupCodes);
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

    const handleFinish = () => {
        // After finishing setup, we need to log in the user with the new tokens
        // But verifyMfa usually returns tokens. confirmMfa setup doesn't necessarily.
        // However, if we are in onboarding, we should probably allow them to login now.
        // Let's assume they have to log in again or we can get tokens here.
        // In this implementation, let's redirect to login for simplicity and security 
        // to ensure a fresh session with MFA verified.
        navigate('/login', { state: { message: 'MFA setup complete. Please sign in.' } });
    };

    const copySecret = () => {
        if (setupData?.secret) {
            navigator.clipboard.writeText(setupData.secret);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleCodeChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        const newCode = [...code];
        newCode[index] = value.slice(-1);
        setCode(newCode);
        if (value && index < 5) inputRefs.current[index + 1]?.focus();
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
        pastedData.split('').forEach((digit, index) => { if (index < 6) newCode[index] = digit; });
        setCode(newCode);
    };

    // Intro Step
    if (step === 'intro') {
        return (
            <PremiumAuthLayout
                title="Secure Your Account"
                subtitle="MFA is required by your organization's security policy."
            >
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-primary-500/5 border border-primary-500/10 rounded-2xl p-6 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center text-primary-600 flex-shrink-0">
                            <Shield size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-neutral-900 dark:text-white">Why is this required?</h3>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                                Multi-Factor Authentication adds an extra layer of protection to your account, preventing unauthorized access even if your password is stolen.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {[
                            { icon: Smartphone, title: 'Install an App', desc: 'Use Google Authenticator, Authy, or Microsoft Authenticator.' },
                            { icon: Key, title: 'Scan & Sync', desc: 'Scan the secure QR code to pair your device.' },
                            { icon: Lock, title: 'Stay Protected', desc: 'Enter a dynamic code every time you sign in.' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800">
                                <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500">
                                    <item.icon size={16} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-neutral-900 dark:text-white">{item.title}</p>
                                    <p className="text-xs text-neutral-500">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <Button
                        onClick={initiateMfaSetup}
                        isLoading={isLoading}
                        className="w-full h-12 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-500/20"
                    >
                        Start Setup Process
                    </Button>

                    <button onClick={() => navigate('/login')} className="w-full text-center text-sm font-semibold text-neutral-500 hover:text-neutral-900 transition-colors">
                        Cancel and Sign Out
                    </button>
                </div>
            </PremiumAuthLayout>
        );
    }

    // Setup Step (QR Code)
    if (step === 'setup') {
        return (
            <PremiumAuthLayout
                title="Scan QR Code"
                subtitle="Open your authenticator app and scan the code below."
            >
                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                    {setupData && (
                        <div className="flex flex-col items-center">
                            <div className="bg-white p-4 rounded-[2rem] shadow-xl border border-neutral-100 mb-6">
                                {/* QR Code Placeholder with actual base64 if available */}
                                {setupData.qrCode ? (
                                    <img src={setupData.qrCode} alt="MFA QR Code" className="w-48 h-48" />
                                ) : (
                                    <div className="w-48 h-48 bg-neutral-100 flex items-center justify-center rounded-xl font-mono text-[10px] text-neutral-400 p-4 text-center">
                                        Scan secret:<br />{setupData.secret}
                                    </div>
                                )}
                            </div>

                            <div className="w-full space-y-4">
                                <div className="text-center">
                                    <p className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">Manual Entry Key</p>
                                    <div className="flex items-center justify-center gap-2 bg-neutral-50 dark:bg-neutral-800/50 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800">
                                        <code className="font-mono text-sm font-bold text-neutral-700 dark:text-neutral-300">{setupData.secret}</code>
                                        <button onClick={copySecret} className="text-neutral-400 hover:text-primary-500 transition-colors">
                                            {copied ? <Check size={16} /> : <Copy size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <Button
                                    onClick={() => setStep('verify')}
                                    className="w-full h-12 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold rounded-xl"
                                >
                                    I've Scanned the Code
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </PremiumAuthLayout>
        );
    }

    // Verify Step
    if (step === 'verify') {
        return (
            <PremiumAuthLayout
                title="Verify Device"
                subtitle="Enter the 6-digit code currently shown in your app."
            >
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                    {error && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm font-bold text-center">{error}</div>}

                    <div className="flex justify-center gap-3" onPaste={handlePaste}>
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
                                className="w-12 h-16 text-center text-3xl font-black bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-2xl text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all"
                            />
                        ))}
                    </div>

                    <Button
                        onClick={verifyAndEnable}
                        isLoading={isLoading}
                        disabled={code.some(d => !d)}
                        className="w-full h-14 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-2xl shadow-xl shadow-primary-500/20"
                    >
                        Confirm and Enable
                    </Button>

                    <button onClick={() => setStep('setup')} className="w-full text-center text-sm font-semibold text-neutral-500 flex items-center justify-center gap-2">
                        <ArrowLeft size={16} /> Back to QR Code
                    </button>
                </div>
            </PremiumAuthLayout>
        );
    }

    // Backup Step
    if (step === 'backup') {
        return (
            <PremiumAuthLayout
                title="Setup Complete"
                subtitle="Your account is now protected with MFA."
            >
                <div className="space-y-6 animate-in fade-in scale-in-95 duration-500">
                    <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                        <div className="flex items-center gap-3 text-amber-600 mb-3">
                            <AlertTriangle size={20} />
                            <span className="font-black uppercase tracking-widest text-[10px]">Security Notice</span>
                        </div>
                        <p className="text-sm text-amber-700 dark:text-amber-400 leading-relaxed font-medium">
                            Store these backup codes in a secure location. If you lose access to your authenticator app, these are the ONLY way to regain access to your account.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {backupCodes.map((code, i) => (
                            <div key={i} className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-center font-mono text-sm font-bold text-neutral-700 dark:text-neutral-300">
                                {code}
                            </div>
                        ))}
                    </div>

                    <Button
                        onClick={handleFinish}
                        className="w-full h-14 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold rounded-2xl"
                    >
                        Finish and Sign In
                    </Button>
                </div>
            </PremiumAuthLayout>
        );
    }

    return null;
}
