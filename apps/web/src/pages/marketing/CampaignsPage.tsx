import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Send, Users, Search, CheckSquare, Square, Loader2, Mail, Eye, Sparkles, User } from 'lucide-react';
import { candidatesApi } from '../../lib/api';
import { Button, Input, Card, Modal } from '../../components/ui';

export function CampaignsPage() {
    const { t } = useTranslation();
    const [candidates, setCandidates] = useState<any[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        fetchCandidates();
    }, []);

    const fetchCandidates = async () => {
        setIsLoading(true);
        try {
            const response = await candidatesApi.getAll({ take: 500 });
            const data = response.data?.data || response.data || [];
            setCandidates(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch candidates', error);
            setCandidates([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Safely filter candidates - ensure it's always an array
    const safeCandidates = Array.isArray(candidates) ? candidates : [];
    const filteredCandidates = safeCandidates.filter(c => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            c.firstName?.toLowerCase().includes(query) ||
            c.lastName?.toLowerCase().includes(query) ||
            c.email?.toLowerCase().includes(query)
        );
    });

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredCandidates.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredCandidates.map(c => c.id));
        }
    };

    const insertVariable = (variable: string) => {
        setMessage(prev => prev + ` {{${variable}}} `);
    };

    const handleSendCampaign = async () => {
        if (selectedIds.length === 0) {
            toast.error('Please select at least one candidate');
            return;
        }
        if (!subject.trim() || !message.trim()) {
            toast.error('Please enter subject and message');
            return;
        }

        setIsSending(true);
        try {
            const bulkResponse = await fetch('/api/v1/emails/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedIds, subject, message }),
            });

            if (bulkResponse.ok) {
                const result = await bulkResponse.json();
                toast.success(t('campaigns.success', { count: result.data?.count || selectedIds.length }) || `Campaign sent to ${selectedIds.length} candidates`);
                setSelectedIds([]);
                setSubject('');
                setMessage('');
            } else {
                throw new Error('Failed to send bulk email');
            }
        } catch (error) {
            console.error('Failed to send campaign', error);
            toast.error(t('campaigns.error') || 'Failed to send email campaign');
        } finally {
            setIsSending(false);
        }
    };

    const previewData = selectedIds.length > 0
        ? safeCandidates.find(c => c.id === selectedIds[0])
        : { firstName: 'John', lastName: 'Doe', email: 'john@example.com' };

    const previewMessage = message
        .replace(/{{firstName}}/g, previewData?.firstName || '')
        .replace(/{{lastName}}/g, previewData?.lastName || '')
        .replace(/{{email}}/g, previewData?.email || '');

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col gap-6">
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                        <Mail className="text-blue-600" />
                        {t('campaigns.title', 'Campaigns')}
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                        {t('campaigns.description', 'Manage and send bulk email campaigns to your candidates.')}
                    </p>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
                {/* Left Column: Candidate Selection */}
                <Card className="lg:col-span-4 flex flex-col h-full overflow-hidden border-neutral-200 dark:border-neutral-800">
                    <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 shrink-0 bg-neutral-50/50 dark:bg-neutral-900/50">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold flex items-center gap-2 text-neutral-900 dark:text-white">
                                <Users size={18} className="text-blue-500" />
                                {t('campaigns.recipients', 'Recipients')}
                            </h3>
                            <span className="text-xs font-medium px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                                {selectedIds.length} selected
                            </span>
                        </div>
                        <div className="space-y-3">
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={t('common.search', 'Search candidates...')}
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                />
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={toggleSelectAll}
                                className="w-full justify-center text-xs h-8 border-dashed"
                            >
                                {selectedIds.length === filteredCandidates.length && filteredCandidates.length > 0 ? 'Deselect All' : 'Select All Filtered'}
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center h-40 text-neutral-500">
                                <Loader2 size={24} className="animate-spin mb-2 text-blue-500" />
                                <span className="text-sm">Loading...</span>
                            </div>
                        ) : filteredCandidates.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-neutral-400">
                                <Users size={32} className="mb-2 opacity-20" />
                                <span className="text-sm">No candidates found</span>
                            </div>
                        ) : (
                            filteredCandidates.map(candidate => (
                                <div
                                    key={candidate.id}
                                    onClick={() => toggleSelect(candidate.id)}
                                    className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border ${selectedIds.includes(candidate.id)
                                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                                        : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50 border-transparent hover:border-neutral-200 dark:hover:border-neutral-700'
                                        }`}
                                >
                                    <div className={`shrink-0 transition-colors ${selectedIds.includes(candidate.id) ? 'text-blue-600' : 'text-neutral-300 group-hover:text-neutral-400'}`}>
                                        {selectedIds.includes(candidate.id) ? (
                                            <CheckSquare size={18} />
                                        ) : (
                                            <Square size={18} />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className={`text-sm font-medium truncate ${selectedIds.includes(candidate.id) ? 'text-blue-900 dark:text-blue-100' : 'text-neutral-700 dark:text-neutral-200'}`}>
                                                {candidate.firstName} {candidate.lastName}
                                            </p>
                                        </div>
                                        <p className="text-xs text-neutral-400 truncate">{candidate.email}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="p-2 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-xs text-center text-neutral-500">
                        {filteredCandidates.length} potential recipients
                    </div>
                </Card>

                {/* Right Column: Email Composition */}
                <div className="lg:col-span-8 flex flex-col gap-6 h-full min-h-0">
                    <Card className="flex-1 flex flex-col overflow-hidden border-neutral-200 dark:border-neutral-800 shadow-sm">
                        <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                            <Input
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder={t('campaigns.subject', 'Enter email subject...')}
                                className="text-lg font-medium border-none px-0 shadow-none focus-visible:ring-0 bg-transparent placeholder:text-neutral-400"
                            />
                        </div>

                        <div className="flex-1 flex flex-col min-h-0 bg-neutral-50/30 dark:bg-neutral-900/10">
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="flex-1 w-full p-6 bg-transparent resize-none focus:outline-none text-neutral-800 dark:text-neutral-200 leading-relaxed custom-scrollbar"
                                placeholder={t('campaigns.message', 'Write your message here...')}
                            />
                        </div>

                        {/* Toolbar */}
                        <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider mr-2">Variables:</span>
                                <button
                                    onClick={() => insertVariable('firstName')}
                                    className="px-2.5 py-1 text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors flex items-center gap-1.5"
                                >
                                    <User size={12} /> First Name
                                </button>
                                <button
                                    onClick={() => insertVariable('lastName')}
                                    className="px-2.5 py-1 text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                                >
                                    Last Name
                                </button>
                                <button
                                    onClick={() => insertVariable('email')}
                                    className="px-2.5 py-1 text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                                >
                                    Email
                                </button>
                            </div>

                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowPreview(true)}
                                    disabled={!message}
                                    className="gap-2"
                                >
                                    <Eye size={16} /> Preview
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleSendCampaign}
                                    disabled={selectedIds.length === 0 || !subject || !message || isSending}
                                    className="gap-2 shadow-lg shadow-blue-500/20"
                                >
                                    {isSending ? (
                                        <><Loader2 size={16} className="animate-spin" /> Sending...</>
                                    ) : (
                                        <><Send size={16} /> Send Campaign</>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Preview Modal */}
            <Modal isOpen={showPreview} onClose={() => setShowPreview(false)} title="Email Preview">
                <div className="space-y-6">
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 rounded-lg p-3 flex items-start gap-3">
                        <Sparkles className="text-amber-500 shrink-0 mt-0.5" size={16} />
                        <p className="text-sm text-amber-700 dark:text-amber-400">
                            This is a preview using data from <strong>{previewData?.firstName} {previewData?.lastName}</strong>.
                        </p>
                    </div>

                    <div className="space-y-4 border rounded-xl p-6 bg-white dark:bg-neutral-900 shadow-sm">
                        <div className="space-y-1 border-b pb-4">
                            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">{subject || '(No Subject)'}</h2>
                            <div className="flex items-center gap-2 text-sm text-neutral-500">
                                <span>To:</span>
                                <span className="bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-neutral-700 dark:text-neutral-300">
                                    {previewData?.firstName} {previewData?.lastName} &lt;{previewData?.email}&gt;
                                </span>
                            </div>
                        </div>
                        <div className="prose dark:prose-invert max-w-none text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
                            {previewMessage || '(No content)'}
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button variant="outline" onClick={() => setShowPreview(false)}>Close Preview</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
