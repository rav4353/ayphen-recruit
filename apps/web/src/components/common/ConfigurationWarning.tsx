import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Check, ChevronDown, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { settingsApi, extractData } from '../../lib/api';
import { Button } from '../ui';

interface ConfigurationStatus {
  [key: string]: {
    configured: boolean;
    label: string;
    category: string;
  };
}

export function ConfigurationWarning() {
  const navigate = useNavigate();
  const { tenantId } = useParams<{ tenantId: string }>();
  
  // Persist open state
  const [isOpen, setIsOpen] = useState(() => {
    const saved = localStorage.getItem('configuration-warning-open');
    return saved === null ? true : saved === 'true';
  });

  const toggleOpen = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    localStorage.setItem('configuration-warning-open', String(newState));
  };

  const { data: configStatus } = useQuery({
    queryKey: ['configuration-status'],
    queryFn: async () => {
      const response = await settingsApi.getConfigurationStatus();
      return extractData(response) as ConfigurationStatus;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  if (!configStatus) return null;

  const allConfigs = Object.entries(configStatus).map(([key, value]) => ({
    key,
    ...value,
  }));

  const totalConfigs = allConfigs.length;
  const completedConfigs = allConfigs.filter((c) => c.configured).length;
  const progress = Math.round((completedConfigs / totalConfigs) * 100);

  if (completedConfigs === totalConfigs) return null;

  const handleConfigure = (e: React.MouseEvent, configKey: string) => {
    e.stopPropagation();
    
    let tab = 'general';
    if (configKey === 'smtp_config') {
      tab = 'integrations';
    } else if (configKey.includes('id_settings')) { // candidate_id_settings, job_id_settings, etc.
      tab = 'idConfig';
    }
    
    navigate(`/${tenantId}/settings?tab=${tab}`);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm mb-6 overflow-hidden">
      <div 
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        onClick={toggleOpen}
      >
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
          Configuration Status
        </h3>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-32 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[3ch]">
              {progress}%
            </span>
            <div className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
              <ChevronDown className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      <div 
        className={`transition-all duration-300 ease-in-out border-t border-gray-100 dark:border-gray-700 overflow-hidden ${
          isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-4 space-y-4">
          <div className="space-y-0 relative">
             {/* Vertical line connecting items */}
             <div className="absolute left-[11px] top-6 bottom-4 w-0.5 bg-gray-100 dark:bg-gray-700 z-0" style={{ display: allConfigs.length > 1 ? 'block' : 'none' }}></div>

            {allConfigs.map((config) => (
              <div key={config.key} className="relative z-10 flex items-start group">
                <div className="mr-4 mt-0.5 shrink-0 bg-white dark:bg-gray-800 py-1"> 
                  {/* Background added to hide line behind icon */}
                  {config.configured ? (
                    <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-sm ring-2 ring-white dark:ring-gray-800">
                      <Check className="h-3.5 w-3.5 text-white" />
                    </div>
                  ) : (
                    <div className="h-6 w-6 rounded-full border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 flex items-center justify-center ring-2 ring-white dark:ring-gray-800">
                      <div className="h-2 w-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 py-1">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${
                      config.configured 
                        ? 'text-gray-500 dark:text-gray-400 line-through' 
                        : 'text-gray-900 dark:text-gray-100'
                    }`}>
                      {config.category}: {config.label}
                    </span>
                    
                    {!config.configured && (
                      <Button
                        size="sm"
                        variant="ghost" 
                        className="h-7 text-xs text-primary hover:text-primary/80 hover:bg-primary/5 -my-1 ml-2"
                        onClick={(e) => handleConfigure(e, config.key)}
                      >
                        Configure
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface SmtpWarningProps {
  onDismiss?: () => void;
}

export function SmtpConfigurationWarning({ onDismiss }: SmtpWarningProps) {
  const navigate = useNavigate();
  const { tenantId } = useParams<{ tenantId: string }>();

  const { data: configStatus } = useQuery({
    queryKey: ['configuration-status'],
    queryFn: async () => {
      const response = await settingsApi.getConfigurationStatus();
      return extractData(response) as ConfigurationStatus;
    },
    staleTime: 5 * 60 * 1000,
  });

  const smtpConfigured = configStatus?.smtp_config?.configured;

  if (smtpConfigured !== false) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-amber-700 dark:text-amber-300">
            <strong>Email not configured.</strong> Please configure SMTP settings to send emails.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            className="text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40"
            onClick={() => navigate(`/${tenantId}/settings`)}
          >
            Configure
          </Button>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1 text-amber-500 hover:text-amber-700 dark:hover:text-amber-300"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
