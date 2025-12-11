import { useState } from 'react';
import { Modal, Button, Input } from '../ui';
import { candidatesApi } from '../../lib/api';
import { Search, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface MergeCandidateModalProps {
    isOpen: boolean;
    onClose: () => void;
    primaryCandidateId: string;
    onSuccess: () => void;
}

export function MergeCandidateModal({ isOpen, onClose, primaryCandidateId, onSuccess }: MergeCandidateModalProps) {
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const response = await candidatesApi.getAll({ search: searchQuery });
            let data = response.data;
            if (data && data.data) {
                data = data.data;
            }

            // Filter out the primary candidate from results
            const candidates = (data.candidates || []).filter((c: any) => c.id !== primaryCandidateId);
            setSearchResults(candidates);
        } catch (error) {
            console.error('Search failed', error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleMerge = async () => {
        if (!selectedCandidate) return;

        setIsLoading(true);
        try {
            await candidatesApi.merge({
                primaryId: primaryCandidateId,
                secondaryId: selectedCandidate.id,
            });
            toast.success(t('candidates.mergeSuccess', 'Candidates merged successfully'));
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Merge failed', error);
            toast.error(t('candidates.mergeError', 'Failed to merge candidates'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('candidates.mergeTitle', 'Merge Candidates')}
        >
            <div className="space-y-6">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg flex gap-3 text-yellow-800 dark:text-yellow-200 text-sm">
                    <AlertTriangle className="shrink-0 mt-0.5" size={16} />
                    <div>
                        <p className="font-medium">{t('common.warning', 'Warning')}</p>
                        <p className="mt-1">
                            {t('candidates.mergeWarning', 'Merging will move all applications and activity from the secondary candidate to the primary candidate. The secondary candidate will be permanently deleted. This action cannot be undone.')}
                        </p>
                    </div>
                </div>

                {!selectedCandidate ? (
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <Input
                                placeholder={t('candidates.searchPlaceholder', 'Search candidate to merge...')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                            <Button onClick={handleSearch} isLoading={isSearching} variant="secondary">
                                <Search size={18} />
                            </Button>
                        </div>

                        <div className="max-h-60 overflow-y-auto border border-neutral-200 dark:border-neutral-700 rounded-lg">
                            {searchResults.length === 0 ? (
                                <div className="p-4 text-center text-neutral-500 text-sm">
                                    {isSearching ? 'Searching...' : 'No candidates found'}
                                </div>
                            ) : (
                                <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
                                    {searchResults.map((candidate) => (
                                        <button
                                            key={candidate.id}
                                            onClick={() => setSelectedCandidate(candidate)}
                                            className="w-full text-left p-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                                        >
                                            <div className="font-medium text-neutral-900 dark:text-white">
                                                {candidate.firstName} {candidate.lastName}
                                            </div>
                                            <div className="text-xs text-neutral-500">{candidate.email}</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-900">
                            <div className="text-sm text-neutral-500 mb-1">Secondary Candidate (will be deleted)</div>
                            <div className="font-medium text-neutral-900 dark:text-white">
                                {selectedCandidate.firstName} {selectedCandidate.lastName}
                            </div>
                            <div className="text-sm text-neutral-500">{selectedCandidate.email}</div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button variant="ghost" onClick={() => setSelectedCandidate(null)}>
                                Change
                            </Button>
                            <Button variant="danger" onClick={handleMerge} isLoading={isLoading}>
                                Confirm Merge
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}
