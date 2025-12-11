import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { communicationApi } from '../../lib/api';
import CandidateEmails from '../../components/communication/CandidateEmails';
import { formatDistanceToNow } from 'date-fns';
import { Mail, Search, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function InboxPage() {
    const { t } = useTranslation();
    const [selectedThread, setSelectedThread] = useState<{ candidateId: string; candidateEmail: string; candidateName: string } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const { data: threadsResponse, isLoading: threadsLoading } = useQuery({
        queryKey: ['email-threads'],
        queryFn: () => communicationApi.getThreads(),
    });

    const threads = threadsResponse?.data?.data || [];

    const filteredThreads = threads.filter((thread: any) =>
        thread.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        thread.candidateEmail.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="h-[calc(100vh-8rem)] flex bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
            {/* Sidebar - Thread List */}
            <div className="w-1/3 min-w-[300px] border-r border-neutral-200 dark:border-neutral-800 flex flex-col">
                <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">{t('inbox.title', 'Messages')}</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                        <input
                            type="text"
                            placeholder={t('common.search', 'Search candidates...')}
                            className="w-full pl-9 pr-4 py-2 bg-neutral-50 dark:bg-neutral-800 border-none rounded-lg text-sm focus:ring-1 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {threadsLoading ? (
                        <div className="p-6 text-center text-neutral-500">{t('common.loading', 'Loading threads...')}</div>
                    ) : filteredThreads.length === 0 ? (
                        <div className="p-8 text-center">
                            <MessageSquare className="mx-auto h-8 w-8 text-neutral-300 mb-2" />
                            <p className="text-sm text-neutral-500">{t('inbox.noThreads', 'No messages found')}</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {filteredThreads.map((thread: any) => (
                                <li
                                    key={thread.candidateId}
                                    className={`hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer transition-colors ${selectedThread?.candidateId === thread.candidateId ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                        }`}
                                    onClick={() => setSelectedThread({
                                        candidateId: thread.candidateId,
                                        candidateEmail: thread.candidateEmail,
                                        candidateName: thread.candidateName
                                    })}
                                >
                                    <div className="p-4">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className={`text-sm font-medium ${selectedThread?.candidateId === thread.candidateId ? 'text-blue-700 dark:text-blue-300' : 'text-neutral-900 dark:text-white'
                                                }`}>
                                                {thread.candidateName}
                                            </h3>
                                            {thread.lastMessage?.createdAt && (
                                                <span className="text-xs text-neutral-400 whitespace-nowrap ml-2">
                                                    {formatDistanceToNow(new Date(thread.lastMessage.createdAt), { addSuffix: true })}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-neutral-500 truncate mb-1">
                                            {thread.lastMessage?.subject || t('inbox.noSubject', 'No Subject')}
                                        </p>
                                        <p className="text-xs text-neutral-400 truncate">
                                            {thread.lastMessage?.body?.replace(/<[^>]+>/g, '') || t('inbox.noContent', 'No Content')}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* Main Content - email thread */}
            <div className="flex-1 flex flex-col bg-neutral-50/50 dark:bg-neutral-900/50">
                {selectedThread ? (
                    <>
                        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">{selectedThread.candidateName}</h2>
                                <div className="flex items-center text-sm text-neutral-500 gap-2">
                                    <Mail size={14} />
                                    <span>{selectedThread.candidateEmail}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            <CandidateEmails
                                candidateId={selectedThread.candidateId}
                                candidateEmail={selectedThread.candidateEmail}
                            />
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-neutral-400 p-8 text-center">
                        <Mail className="h-16 w-16 mb-4 text-neutral-200 dark:text-neutral-700" />
                        <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">{t('inbox.selectPrompt', 'Select a conversation')}</h3>
                        <p className="max-w-sm text-neutral-500">{t('inbox.selectPromptDesc', 'Choose a thread from the left to view the conversation history and send new messages.')}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
