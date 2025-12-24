import { useQuery } from '@tanstack/react-query';
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  FileText,
} from 'lucide-react';
import { bgvApi, extractData } from '../../lib/api';
import { Button } from '../ui';

type BGVStatus = 'PENDING' | 'INITIATED' | 'IN_PROGRESS' | 'COMPLETED' | 'CLEAR' | 'CONSIDER' | 'FAILED' | 'CANCELLED';

interface BGVCheck {
  id: string;
  provider: string;
  status: BGVStatus;
  packageType: string;
  checkTypes: string[];
  externalId?: string;
  reportUrl?: string;
  result?: any;
  initiatedAt: string;
  completedAt?: string;
  application?: {
    id: string;
    applicationId?: string;
    job: {
      title: string;
    };
  };
  initiatedBy?: {
    firstName: string;
    lastName: string;
  };
}

const statusConfig: Record<BGVStatus, { icon: typeof CheckCircle; color: string; bgColor: string; label: string }> = {
  PENDING: { icon: Clock, color: 'text-gray-500', bgColor: 'bg-gray-100 dark:bg-gray-800', label: 'Pending' },
  INITIATED: { icon: Clock, color: 'text-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-900/30', label: 'Initiated' },
  IN_PROGRESS: { icon: RefreshCw, color: 'text-yellow-500', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', label: 'In Progress' },
  COMPLETED: { icon: CheckCircle, color: 'text-green-500', bgColor: 'bg-green-100 dark:bg-green-900/30', label: 'Completed' },
  CLEAR: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30', label: 'Clear' },
  CONSIDER: { icon: AlertTriangle, color: 'text-orange-500', bgColor: 'bg-orange-100 dark:bg-orange-900/30', label: 'Consider' },
  FAILED: { icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-100 dark:bg-red-900/30', label: 'Failed' },
  CANCELLED: { icon: XCircle, color: 'text-gray-400', bgColor: 'bg-gray-100 dark:bg-gray-800', label: 'Cancelled' },
};

interface CandidateBGVTrackingProps {
  candidateId: string;
}

export function CandidateBGVTracking({ candidateId }: CandidateBGVTrackingProps) {
  const { data: checksData, isLoading } = useQuery({
    queryKey: ['bgv-checks', candidateId],
    queryFn: async () => {
      const response = await bgvApi.getChecks({ candidateId });
      return extractData(response) as BGVCheck[];
    },
  });

  const checks = checksData || [];

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
            <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="font-semibold text-neutral-900 dark:text-white">Background Verification</h3>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-16 bg-neutral-100 dark:bg-neutral-800 rounded-lg" />
          <div className="h-16 bg-neutral-100 dark:bg-neutral-800 rounded-lg" />
        </div>
      </div>
    );
  }

  if (checks.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
            <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="font-semibold text-neutral-900 dark:text-white">Background Verification</h3>
        </div>
        <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
          <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No background checks initiated</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
            <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="font-semibold text-neutral-900 dark:text-white">Background Verification</h3>
        </div>
        <span className="text-sm text-neutral-500">{checks.length} check{checks.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="space-y-3">
        {checks.map((check) => {
          const config = statusConfig[check.status] || statusConfig.PENDING;
          const StatusIcon = config.icon;

          return (
            <div
              key={check.id}
              className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`p-2 rounded-lg ${config.bgColor}`}>
                    <StatusIcon className={`h-4 w-4 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-neutral-900 dark:text-white">
                        {check.packageType || 'Standard Check'}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${config.bgColor} ${config.color}`}>
                        {config.label}
                      </span>
                    </div>
                    
                    <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                      <span className="capitalize">{check.provider?.toLowerCase() || 'Manual'}</span>
                      {check.application?.job && (
                        <>
                          <span className="mx-1">•</span>
                          <span>{check.application.job.title}</span>
                        </>
                      )}
                      {check.application?.applicationId && (
                        <>
                          <span className="mx-1">•</span>
                          <span className="font-mono text-xs">{check.application.applicationId}</span>
                        </>
                      )}
                    </div>

                    <div className="mt-2 flex items-center gap-4 text-xs text-neutral-400">
                      <span>
                        Initiated: {new Date(check.initiatedAt).toLocaleDateString()}
                      </span>
                      {check.completedAt && (
                        <span>
                          Completed: {new Date(check.completedAt).toLocaleDateString()}
                        </span>
                      )}
                      {check.initiatedBy && (
                        <span>
                          By: {check.initiatedBy.firstName} {check.initiatedBy.lastName}
                        </span>
                      )}
                    </div>

                    {check.checkTypes && check.checkTypes.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {check.checkTypes.map((type) => (
                          <span
                            key={type}
                            className="text-[10px] px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded"
                          >
                            {type.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {check.reportUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(check.reportUrl, '_blank')}
                    className="gap-1.5 shrink-0"
                  >
                    <FileText size={14} />
                    <span className="hidden sm:inline">Report</span>
                    <ExternalLink size={12} />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
