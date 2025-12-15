'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import {
  Link2,
  Unlink,
  Check,
  RefreshCw,
  Loader2,
  Linkedin,
  FileText,
  Briefcase,
  Users,
  MessageSquare,
  Webhook,
  Copy,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  TestTube,
} from 'lucide-react';
import {
  jobBoardsApi,
  linkedInApplyApi,
  indeedFeedApi,
  zipRecruiterApi,
  hrisApi,
  messagingApi,
  webhooksApi,
} from '@/lib/api';

type TabType = 'job-boards' | 'linkedin' | 'indeed' | 'ziprecruiter' | 'hris' | 'messaging' | 'webhooks';

export function IntegrationsManager() {
  const [activeTab, setActiveTab] = useState<TabType>('job-boards');

  const tabs = [
    { id: 'job-boards', label: 'Job Boards', icon: Briefcase },
    { id: 'linkedin', label: 'LinkedIn Apply', icon: Linkedin },
    { id: 'indeed', label: 'Indeed Feed', icon: FileText },
    { id: 'ziprecruiter', label: 'ZipRecruiter', icon: Briefcase },
    { id: 'hris', label: 'HRIS Sync', icon: Users },
    { id: 'messaging', label: 'Slack/Teams', icon: MessageSquare },
    { id: 'webhooks', label: 'Webhooks', icon: Webhook },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Integrations</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-200 dark:border-neutral-700">
        <nav className="flex space-x-4 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                  }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'job-boards' && <JobBoardsSection />}
        {activeTab === 'linkedin' && <LinkedInSection />}
        {activeTab === 'indeed' && <IndeedSection />}
        {activeTab === 'ziprecruiter' && <ZipRecruiterSection />}
        {activeTab === 'hris' && <HRISSection />}
        {activeTab === 'messaging' && <MessagingSection />}
        {activeTab === 'webhooks' && <WebhooksSection />}
      </div>
    </div>
  );
}

// ==================== JOB BOARDS ====================

function JobBoardsSection() {
  const { data: settings, isLoading } = useQuery({
    queryKey: ['job-boards-settings'],
    queryFn: () => jobBoardsApi.getSettings(),
  });

  const { data: available } = useQuery({
    queryKey: ['job-boards-available'],
    queryFn: () => jobBoardsApi.getAvailable(),
  });

  if (isLoading) {
    return <LoadingState />;
  }

  const boards = available?.data || [];
  const config = settings?.data || {};

  return (
    <div className="space-y-4">
      <p className="text-neutral-600 dark:text-neutral-400">
        Connect to job boards to automatically post your open positions and receive applications.
      </p>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {boards.map((board: any) => (
          <IntegrationCard
            key={board.id}
            name={board.name}
            description={board.description}
            icon={board.icon}
            isConnected={config[board.id]?.isConfigured}
            onConnect={() => {/* Open config modal */ }}
            onDisconnect={() => jobBoardsApi.disconnect(board.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ==================== LINKEDIN ====================

function LinkedInSection() {
  const [showSecret, setShowSecret] = useState(false);
  const { data: config, isLoading } = useQuery({
    queryKey: ['linkedin-config'],
    queryFn: () => linkedInApplyApi.getConfig(),
  });

  if (isLoading) return <LoadingState />;

  const isConfigured = config?.data?.isConfigured;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#0077B5] rounded-lg">
              <Linkedin className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                Apply with LinkedIn
              </h3>
              <p className="text-sm text-neutral-500">
                Allow candidates to apply using their LinkedIn profile
              </p>
            </div>
          </div>
          <Badge variant={isConfigured ? 'success' : 'secondary'}>
            {isConfigured ? 'Connected' : 'Not Connected'}
          </Badge>
        </div>

        <div className="mt-6 space-y-4">
          <Input label="Client ID" placeholder="Enter LinkedIn Client ID" />
          <div className="relative">
            <Input
              label="Client Secret"
              type={showSecret ? 'text' : 'password'}
              placeholder="Enter LinkedIn Client Secret"
            />
            <button
              onClick={() => setShowSecret(!showSecret)}
              className="absolute right-3 top-9"
            >
              {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <Input label="Redirect URI" placeholder="https://yourapp.com/auth/linkedin/callback" />

          <div className="flex gap-3">
            <Button variant="primary">
              <Check className="h-4 w-4 mr-2" />
              Save Configuration
            </Button>
            {isConfigured && (
              <Button variant="secondary" className="text-red-600">
                <Unlink className="h-4 w-4 mr-2" />
                Disconnect
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

// ==================== INDEED ====================

function IndeedSection() {
  const { data: config, isLoading } = useQuery({
    queryKey: ['indeed-config'],
    queryFn: () => indeedFeedApi.getConfig(),
  });

  const validateMutation = useMutation({
    mutationFn: () => indeedFeedApi.validateFeed(),
  });

  if (isLoading) return <LoadingState />;

  const isConfigured = config?.data?.isConfigured;
  const feedUrl = config?.data?.feedUrl;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#2164f3] rounded-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                Indeed XML Feed
              </h3>
              <p className="text-sm text-neutral-500">
                Generate an XML feed for Indeed job listings
              </p>
            </div>
          </div>
          <Badge variant={isConfigured ? 'success' : 'secondary'}>
            {isConfigured ? 'Active' : 'Not Configured'}
          </Badge>
        </div>

        <div className="mt-6 space-y-4">
          <Input label="Publisher ID" placeholder="Enter Indeed Publisher ID" />
          <Input label="Company Name" placeholder="Your company name" />

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded" defaultChecked />
              <span className="text-sm">Include job descriptions</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded" />
              <span className="text-sm">Include salary information</span>
            </label>
          </div>

          {feedUrl && (
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Your Feed URL
              </label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 text-sm bg-white dark:bg-neutral-900 p-2 rounded border">
                  {feedUrl}
                </code>
                <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(feedUrl)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="primary">
              <Check className="h-4 w-4 mr-2" />
              Save Configuration
            </Button>
            <Button
              variant="secondary"
              onClick={() => validateMutation.mutate()}
              disabled={validateMutation.isPending}
            >
              <TestTube className="h-4 w-4 mr-2" />
              Validate Feed
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ==================== ZIPRECRUITER ====================

function ZipRecruiterSection() {
  const { data: config, isLoading } = useQuery({
    queryKey: ['ziprecruiter-config'],
    queryFn: () => zipRecruiterApi.getConfig(),
  });

  if (isLoading) return <LoadingState />;

  const isConfigured = config?.data?.isConfigured;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#6fbe44] rounded-lg">
              <Briefcase className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                ZipRecruiter
              </h3>
              <p className="text-sm text-neutral-500">
                Post jobs directly to ZipRecruiter
              </p>
            </div>
          </div>
          <Badge variant={isConfigured ? 'success' : 'secondary'}>
            {isConfigured ? 'Connected' : 'Not Connected'}
          </Badge>
        </div>

        <div className="mt-6 space-y-4">
          <Input label="API Key" type="password" placeholder="Enter ZipRecruiter API Key" />
          <Input label="Publisher ID" placeholder="Enter Publisher ID" />

          <label className="flex items-center gap-2">
            <input type="checkbox" className="rounded" defaultChecked />
            <span className="text-sm">Sandbox Mode (for testing)</span>
          </label>

          <div className="flex gap-3">
            <Button variant="primary">
              <Check className="h-4 w-4 mr-2" />
              Save Configuration
            </Button>
            {isConfigured && (
              <Button variant="secondary" onClick={() => zipRecruiterApi.syncAll()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync All Jobs
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

// ==================== HRIS ====================

function HRISSection() {
  const { data: config, isLoading } = useQuery({
    queryKey: ['hris-config'],
    queryFn: () => hrisApi.getConfig(),
  });

  const { data: providers } = useQuery({
    queryKey: ['hris-providers'],
    queryFn: () => hrisApi.getProviders(),
  });

  const syncMutation = useMutation({
    mutationFn: () => hrisApi.syncEmployees(),
  });

  if (isLoading) return <LoadingState />;

  const isConfigured = config?.data?.isConfigured;
  const hrisProviders = providers?.data || [];

  return (
    <div className="space-y-6">
      <p className="text-neutral-600 dark:text-neutral-400">
        Connect your HRIS to sync employee data and export new hires.
      </p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {hrisProviders.map((provider: any) => (
          <Card key={provider.id} className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <img src={provider.logo} alt={provider.name} className="w-8 h-8 rounded" />
              <div>
                <h4 className="font-medium text-neutral-900 dark:text-white">{provider.name}</h4>
                <p className="text-xs text-neutral-500">{provider.description}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1 mb-3">
              {provider.features?.map((feature: string) => (
                <Badge key={feature} variant="secondary" className="text-xs">{feature}</Badge>
              ))}
            </div>
            <Button variant="secondary" size="sm" className="w-full">
              <Link2 className="h-4 w-4 mr-2" />
              Connect
            </Button>
          </Card>
        ))}
      </div>

      {isConfigured && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Sync Status</h4>
              <p className="text-sm text-neutral-500">
                Last sync: {config?.data?.lastSyncAt ? new Date(config.data.lastSyncAt).toLocaleString() : 'Never'}
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
            >
              {syncMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Sync Now
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

// ==================== MESSAGING ====================

function MessagingSection() {
  const { data: slackConfig } = useQuery({
    queryKey: ['slack-config'],
    queryFn: () => messagingApi.getSlackConfig(),
  });

  const { data: teamsConfig } = useQuery({
    queryKey: ['teams-config'],
    queryFn: () => messagingApi.getTeamsConfig(),
  });

  const testMutation = useMutation({
    mutationFn: () => messagingApi.sendTestNotification(),
  });

  return (
    <div className="space-y-6">
      <p className="text-neutral-600 dark:text-neutral-400">
        Receive hiring notifications in Slack or Microsoft Teams.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Slack */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#4A154B] rounded-lg">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold">Slack</h3>
              <Badge variant={slackConfig?.data?.isConfigured ? 'success' : 'secondary'} className="mt-1">
                {slackConfig?.data?.isConfigured ? 'Connected' : 'Not Connected'}
              </Badge>
            </div>
          </div>
          <div className="space-y-3">
            <Input label="Bot Token" type="password" placeholder="xoxb-..." />
            <Input label="Signing Secret" type="password" placeholder="Enter signing secret" />
            <Input label="Default Channel ID" placeholder="C0123456789" />
            <Button variant="primary" className="w-full">
              <Check className="h-4 w-4 mr-2" />
              Save Slack Config
            </Button>
          </div>
        </Card>

        {/* Teams */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#5059C9] rounded-lg">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold">Microsoft Teams</h3>
              <Badge variant={teamsConfig?.data?.isConfigured ? 'success' : 'secondary'} className="mt-1">
                {teamsConfig?.data?.isConfigured ? 'Connected' : 'Not Connected'}
              </Badge>
            </div>
          </div>
          <div className="space-y-3">
            <Input label="Webhook URL" placeholder="https://outlook.office.com/webhook/..." />
            <Button variant="primary" className="w-full">
              <Check className="h-4 w-4 mr-2" />
              Save Teams Config
            </Button>
          </div>
        </Card>
      </div>

      <Button
        variant="secondary"
        onClick={() => testMutation.mutate()}
        disabled={testMutation.isPending}
      >
        <TestTube className="h-4 w-4 mr-2" />
        Send Test Notification
      </Button>
    </div>
  );
}

// ==================== WEBHOOKS ====================

function WebhooksSection() {
  const [_showCreateModal, setShowCreateModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: webhooks, isLoading } = useQuery({
    queryKey: ['webhooks'],
    queryFn: () => webhooksApi.getAll(),
  });


  const deleteMutation = useMutation({
    mutationFn: (id: string) => webhooksApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['webhooks'] }),
  });

  const testMutation = useMutation({
    mutationFn: (id: string) => webhooksApi.test(id),
  });

  if (isLoading) return <LoadingState />;

  const webhookList = webhooks?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-neutral-600 dark:text-neutral-400">
          Configure webhooks to receive real-time notifications about events in your ATS.
        </p>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Webhook
        </Button>
      </div>

      {webhookList.length === 0 ? (
        <Card className="p-8 text-center">
          <Webhook className="h-12 w-12 mx-auto text-neutral-400 mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
            No Webhooks Configured
          </h3>
          <p className="text-neutral-500 mb-4">
            Create a webhook to receive event notifications at your endpoint.
          </p>
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Webhook
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {webhookList.map((webhook: any) => (
            <Card key={webhook.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-neutral-900 dark:text-white">{webhook.name}</h4>
                    <Badge variant={webhook.isActive ? 'success' : 'secondary'}>
                      {webhook.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-sm text-neutral-500 mt-1 font-mono">{webhook.url}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {webhook.events?.slice(0, 3).map((event: string) => (
                      <Badge key={event} variant="secondary" className="text-xs">{event}</Badge>
                    ))}
                    {webhook.events?.length > 3 && (
                      <Badge variant="secondary" className="text-xs">+{webhook.events.length - 3} more</Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => testMutation.mutate(webhook.id)}
                    disabled={testMutation.isPending}
                  >
                    <TestTube className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600"
                    onClick={() => deleteMutation.mutate(webhook.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== SHARED COMPONENTS ====================

function IntegrationCard({
  name,
  description,
  icon,
  isConnected,
  onConnect,
  onDisconnect
}: {
  name: string;
  description: string;
  icon: string;
  isConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3 mb-3">
        <img src={icon} alt={name} className="w-10 h-10 rounded" />
        <div>
          <h4 className="font-medium text-neutral-900 dark:text-white">{name}</h4>
          <p className="text-xs text-neutral-500">{description}</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <Badge variant={isConnected ? 'success' : 'secondary'}>
          {isConnected ? 'Connected' : 'Not Connected'}
        </Badge>
        {isConnected ? (
          <Button variant="ghost" size="sm" className="text-red-600" onClick={onDisconnect}>
            <Unlink className="h-4 w-4 mr-1" />
            Disconnect
          </Button>
        ) : (
          <Button variant="secondary" size="sm" onClick={onConnect}>
            <Link2 className="h-4 w-4 mr-1" />
            Connect
          </Button>
        )}
      </div>
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-48">
      <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
    </div>
  );
}
