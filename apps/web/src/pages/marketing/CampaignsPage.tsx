import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Send, Users, Search, CheckSquare, Square, Loader2, Mail } from 'lucide-react';
import { candidatesApi } from '../../lib/api';
import { Button, Input, Card } from '../../components/ui';

export function CampaignsPage() {
    const [candidates, setCandidates] = useState<any[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);

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
            // Use bulk email API
            const bulkResponse = await fetch('/api/v1/emails/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedIds, subject, message }),
            });

            if (bulkResponse.ok) {
                const result = await bulkResponse.json();
                toast.success(`Campaign sent to ${result.data?.count || selectedIds.length} candidates`);
                setSelectedIds([]);
                setSubject('');
                setMessage('');
            } else {
                throw new Error('Failed to send bulk email');
            }
        } catch (error) {
            console.error('Failed to send campaign', error);
            toast.error('Failed to send email campaign');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                    <Mail className="text-blue-600" />
                    Email Campaigns
                </h1>
                <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                    Manage and send bulk email campaigns to your candidates.
                </p>
            </div>

            <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Users size={20} className="text-blue-600" />
                            Target Audience
                        </h3>
                        <p className="text-sm text-neutral-500 mt-1">
                            Select candidates to receive this campaign
                        </p>
                    </div>
                    <div className="text-sm text-neutral-500">
                        {selectedIds.length} of {filteredCandidates.length} selected
                    </div>
                </div>

                {/* Search and Select All */}
                <div className="flex items-center gap-4 mb-4">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search candidates..."
                            className="pl-9"
                        />
                    </div>
                    <Button variant="ghost" size="sm" onClick={toggleSelectAll}>
                        {selectedIds.length === filteredCandidates.length ? (
                            <><CheckSquare size={16} className="mr-1" /> Deselect All</>
                        ) : (
                            <><Square size={16} className="mr-1" /> Select All</>
                        )}
                    </Button>
                </div>

                {/* Candidate List */}
                <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg max-h-60 overflow-y-auto mb-6">
                    {isLoading ? (
                        <div className="p-8 text-center text-neutral-500">
                            <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                            Loading candidates...
                        </div>
                    ) : filteredCandidates.length === 0 ? (
                        <div className="p-8 text-center text-neutral-500">
                            No candidates found
                        </div>
                    ) : (
                        filteredCandidates.map(candidate => (
                            <div
                                key={candidate.id}
                                className={`flex items-center gap-3 p-3 border-b border-neutral-100 dark:border-neutral-800 last:border-b-0 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 ${selectedIds.includes(candidate.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                    }`}
                                onClick={() => toggleSelect(candidate.id)}
                            >
                                <div className="text-blue-600">
                                    {selectedIds.includes(candidate.id) ? (
                                        <CheckSquare size={18} />
                                    ) : (
                                        <Square size={18} />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">
                                        {candidate.firstName} {candidate.lastName}
                                    </p>
                                    <p className="text-xs text-neutral-500 truncate">{candidate.email}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Email Composition */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Subject *</label>
                        <Input
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Enter email subject..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Message *</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={8}
                            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                            placeholder="Enter your message... Use {{firstName}} and {{lastName}} for personalization."
                        />
                        <p className="text-xs text-neutral-500 mt-1">
                            Available placeholders: {'{{firstName}}'}, {'{{lastName}}'}
                        </p>
                    </div>
                </div>

                <div className="flex justify-end mt-6">
                    <Button
                        variant="primary"
                        onClick={handleSendCampaign}
                        disabled={selectedIds.length === 0 || !subject || !message || isSending}
                    >
                        {isSending ? (
                            <><Loader2 size={16} className="animate-spin mr-2" /> Sending...</>
                        ) : (
                            <><Send size={16} className="mr-2" /> Send to {selectedIds.length} Candidate{selectedIds.length !== 1 ? 's' : ''}</>
                        )}
                    </Button>
                </div>
            </Card>
        </div>
    );
}
