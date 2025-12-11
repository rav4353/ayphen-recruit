import { Clock, X } from 'lucide-react';

interface SessionTimeoutWarningProps {
  remainingSeconds: number;
  onExtend: () => void;
  onLogout: () => void;
  onDismiss: () => void;
}

export function SessionTimeoutWarning({
  remainingSeconds,
  onExtend,
  onLogout,
  onDismiss,
}: SessionTimeoutWarningProps) {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/10 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Session Expiring</h2>
          </div>
          <button
            onClick={onDismiss}
            className="text-white/40 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-white/70 mb-4">
          Your session will expire in{' '}
          <span className="font-mono font-bold text-yellow-400">
            {minutes}:{seconds.toString().padStart(2, '0')}
          </span>
          . Would you like to stay signed in?
        </p>

        <div className="flex gap-3">
          <button
            onClick={onLogout}
            className="flex-1 px-4 py-2 rounded-lg border border-white/10 text-white/70 hover:bg-white/5 transition-colors"
          >
            Log out
          </button>
          <button
            onClick={onExtend}
            className="flex-1 px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors"
          >
            Stay signed in
          </button>
        </div>
      </div>
    </div>
  );
}
