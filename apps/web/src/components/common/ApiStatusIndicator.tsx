import { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../stores/auth';
import api from '../../lib/api';

type ApiStatus = 'online' | 'offline' | 'unauthorized' | 'checking';

export function ApiStatusIndicator() {
  const [status, setStatus] = useState<ApiStatus>('checking');
  const [showTooltip, setShowTooltip] = useState(false);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const response = await api.get('/health', { timeout: 5000 });
        if (response.status === 200) {
          setStatus('online');
        } else if (response.status === 401) {
          setStatus('unauthorized');
        } else {
          setStatus('offline');
        }
      } catch (error: any) {
        if (error.response?.status === 401) {
          setStatus('unauthorized');
        } else {
          setStatus('offline');
        }
      }
    };

    // Initial check
    checkApiStatus();

    // Check every 30 seconds
    const interval = setInterval(checkApiStatus, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const getStatusConfig = () => {
    switch (status) {
      case 'online':
        return {
          icon: Wifi,
          color: 'text-success-600 dark:text-success-400',
          bg: 'bg-success-500',
          label: 'API Connected',
          description: 'All systems operational',
        };
      case 'offline':
        return {
          icon: WifiOff,
          color: 'text-danger-600 dark:text-danger-400',
          bg: 'bg-danger-500',
          label: 'API Offline',
          description: 'Cannot reach the server. Check if the API is running.',
        };
      case 'unauthorized':
        return {
          icon: AlertCircle,
          color: 'text-warning-600 dark:text-warning-400',
          bg: 'bg-warning-500',
          label: 'Session Expired',
          description: 'Your session may have expired. Try logging in again.',
        };
      case 'checking':
      default:
        return {
          icon: Wifi,
          color: 'text-neutral-400',
          bg: 'bg-neutral-400',
          label: 'Checking...',
          description: 'Checking API connection',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  // Don't show indicator if everything is fine (reduce visual clutter)
  if (status === 'online' || status === 'checking') {
    return null;
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        className={`p-2 rounded-lg transition-all duration-150 ${config.color} hover:bg-neutral-100 dark:hover:bg-neutral-800`}
        aria-label={config.label}
      >
        <Icon size={18} />
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute right-0 top-full mt-2 z-50 w-64 p-3 bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-lg shadow-soft-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className={`w-2 h-2 rounded-full ${config.bg} shadow-soft`} />
            <span className="text-sm font-semibold text-neutral-900 dark:text-white tracking-tight">
              {config.label}
            </span>
          </div>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
            {config.description}
          </p>
        </div>
      )}
    </div>
  );
}

export default ApiStatusIndicator;
