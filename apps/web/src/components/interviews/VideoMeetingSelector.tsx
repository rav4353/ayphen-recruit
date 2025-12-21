import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Video, Loader2, Check, ExternalLink } from 'lucide-react';
import { Button } from '../ui';
import { videoMeetingsApi, VideoMeetingProvider, MeetingDetails, ProviderStatus } from '../../lib/api/video-meetings';
import toast from 'react-hot-toast';

// Provider icons/logos
const providerInfo: Record<VideoMeetingProvider, { name: string; color: string; bgColor: string }> = {
    GOOGLE_MEET: { name: 'Google Meet', color: '#00897B', bgColor: 'bg-teal-50 dark:bg-teal-900/20' },
    ZOOM: { name: 'Zoom', color: '#2D8CFF', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
    MICROSOFT_TEAMS: { name: 'Microsoft Teams', color: '#6264A7', bgColor: 'bg-purple-50 dark:bg-purple-900/20' },
};

interface VideoMeetingSelectorProps {
    onMeetingCreated: (meeting: MeetingDetails) => void;
    topic: string;
    startTime: Date;
    durationMinutes: number;
    attendees?: string[];
    description?: string;
}

export function VideoMeetingSelector({
    onMeetingCreated,
    topic,
    startTime,
    durationMinutes,
    attendees,
    description,
}: VideoMeetingSelectorProps) {
    const [providers, setProviders] = useState<ProviderStatus[]>([]);
    const [selectedProvider, setSelectedProvider] = useState<VideoMeetingProvider | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [createdMeeting, setCreatedMeeting] = useState<MeetingDetails | null>(null);

    useEffect(() => {
        loadProviders();
    }, []);

    const loadProviders = async () => {
        try {
            const response = await videoMeetingsApi.getProviders();
            setProviders(response.data.providers);
            
            // Auto-select first configured provider
            const configuredProvider = response.data.providers.find(p => p.configured);
            if (configuredProvider) {
                setSelectedProvider(configuredProvider.provider);
            }
        } catch (error) {
            console.error('Failed to load providers:', error);
            toast.error('Failed to load video meeting providers');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateMeeting = async () => {
        if (!selectedProvider) return;

        setIsCreating(true);
        try {
            const response = await videoMeetingsApi.createMeeting({
                provider: selectedProvider,
                topic,
                startTime: startTime.toISOString(),
                durationMinutes,
                attendees,
                description,
            });

            setCreatedMeeting(response.data);
            onMeetingCreated(response.data);
            toast.success(`${providerInfo[selectedProvider].name} meeting created!`);
        } catch (error) {
            console.error('Failed to create meeting:', error);
            toast.error('Failed to create video meeting');
        } finally {
            setIsCreating(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-blue-500" size={24} />
            </div>
        );
    }

    const configuredProviders = providers.filter(p => p.configured);

    if (configuredProviders.length === 0) {
        return (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                <div className="flex items-start gap-3">
                    <Video className="text-amber-600 dark:text-amber-400 mt-0.5" size={20} />
                    <div>
                        <h4 className="font-medium text-amber-900 dark:text-amber-100">No Video Providers Configured</h4>
                        <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                            Configure Google Meet, Zoom, or Microsoft Teams in Settings → Integrations to enable video interviews.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (createdMeeting) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl"
            >
                <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-green-500 rounded-full">
                        <Check className="text-white" size={16} />
                    </div>
                    <div>
                        <h4 className="font-medium text-green-900 dark:text-green-100">Meeting Created</h4>
                        <p className="text-sm text-green-700 dark:text-green-300">
                            {providerInfo[createdMeeting.provider].name}
                        </p>
                    </div>
                </div>
                
                <div className="bg-white dark:bg-neutral-800 rounded-lg p-3 mb-3">
                    <p className="text-xs text-neutral-500 mb-1">Meeting Link</p>
                    <div className="flex items-center gap-2">
                        <code className="text-sm text-blue-600 dark:text-blue-400 flex-1 truncate">
                            {createdMeeting.joinUrl}
                        </code>
                        <a
                            href={createdMeeting.joinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors"
                        >
                            <ExternalLink size={16} className="text-neutral-500" />
                        </a>
                    </div>
                </div>

                {createdMeeting.password && (
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Password: <span className="font-mono">{createdMeeting.password}</span>
                    </p>
                )}
            </motion.div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                <Video size={16} />
                Select Video Platform
            </div>

            <div className="grid grid-cols-3 gap-3">
                {providers.map((provider) => {
                    const info = providerInfo[provider.provider];
                    const isSelected = selectedProvider === provider.provider;
                    
                    return (
                        <button
                            key={provider.provider}
                            onClick={() => provider.configured && setSelectedProvider(provider.provider)}
                            disabled={!provider.configured}
                            className={`relative p-4 rounded-xl border-2 transition-all ${
                                isSelected
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                    : provider.configured
                                    ? 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                                    : 'border-neutral-100 dark:border-neutral-800 opacity-50 cursor-not-allowed'
                            }`}
                        >
                            {isSelected && (
                                <div className="absolute top-2 right-2">
                                    <Check className="text-blue-500" size={16} />
                                </div>
                            )}
                            <div
                                className={`w-10 h-10 rounded-lg ${info.bgColor} flex items-center justify-center mb-2 mx-auto`}
                            >
                                <Video size={20} style={{ color: info.color }} />
                            </div>
                            <p className="text-sm font-medium text-neutral-900 dark:text-white text-center">
                                {info.name}
                            </p>
                            {!provider.configured && (
                                <p className="text-xs text-neutral-500 text-center mt-1">Not configured</p>
                            )}
                        </button>
                    );
                })}
            </div>

            <Button
                onClick={handleCreateMeeting}
                disabled={!selectedProvider || isCreating}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
                {isCreating ? (
                    <>
                        <Loader2 className="animate-spin mr-2" size={18} />
                        Creating Meeting...
                    </>
                ) : (
                    <>
                        <Video className="mr-2" size={18} />
                        Generate Meeting Link
                    </>
                )}
            </Button>
        </div>
    );
}
