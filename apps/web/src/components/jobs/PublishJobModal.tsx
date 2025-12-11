import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Globe, Linkedin, CheckCircle } from 'lucide-react';

interface PublishJobModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPublish: (channels: string[]) => Promise<void>;
    isPublishing: boolean;
}

export function PublishJobModal({ isOpen, onClose, onPublish, isPublishing }: PublishJobModalProps) {
    const { t } = useTranslation();
    const [selectedChannels, setSelectedChannels] = useState<string[]>(['INTERNAL']);

    if (!isOpen) return null;

    const channels = [
        { id: 'INTERNAL', name: 'Internal Career Site', icon: Globe, description: 'Publish to your company career page' },
        { id: 'LINKEDIN', name: 'LinkedIn', icon: Linkedin, description: 'Post to LinkedIn Jobs' },
        { id: 'INDEED', name: 'Indeed', icon: Globe, description: 'Post to Indeed XML Feed' },
        { id: 'ZIPRECRUITER', name: 'ZipRecruiter', icon: Globe, description: 'Post to ZipRecruiter Network' },
    ];

    const toggleChannel = (id: string) => {
        setSelectedChannels((prev) =>
            prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
        );
    };

    const handlePublish = () => {
        onPublish(selectedChannels);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                        {t('jobs.publish.title', 'Publish Job')}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        {t('jobs.publish.description', 'Select the channels where you want to publish this job.')}
                    </p>

                    <div className="space-y-2">
                        {channels.map((channel) => {
                            const Icon = channel.icon;
                            const isSelected = selectedChannels.includes(channel.id);
                            return (
                                <div
                                    key={channel.id}
                                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${isSelected
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                                        }`}
                                    onClick={() => toggleChannel(channel.id)}
                                >
                                    <div className={`mt-0.5 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-500'}`}>
                                        <Icon size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className={`font-medium ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-neutral-900 dark:text-white'}`}>
                                                {channel.name}
                                            </span>
                                            {isSelected && <CheckCircle size={16} className="text-blue-600 dark:text-blue-400" />}
                                        </div>
                                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                            {channel.description}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                        disabled={isPublishing}
                    >
                        {t('common.cancel', 'Cancel')}
                    </button>
                    <button
                        onClick={handlePublish}
                        disabled={isPublishing || selectedChannels.length === 0}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isPublishing ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                {t('common.publishing', 'Publishing...')}
                            </>
                        ) : (
                            t('common.publish', 'Publish')
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
