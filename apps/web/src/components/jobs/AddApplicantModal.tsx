
import { useState, useEffect } from 'react';
import { X, Search, CheckCircle, UserPlus } from 'lucide-react';
import { candidatesApi } from '../../lib/api';
import type { Candidate } from '../../lib/types';
import toast from 'react-hot-toast';

interface AddApplicantModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (candidateId: string) => Promise<void>;
    isAdding: boolean;
    alreadyAppliedIds?: string[];
}

export function AddApplicantModal({ isOpen, onClose, onAdd, isAdding, alreadyAppliedIds = [] }: AddApplicantModalProps) {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchCandidates();
            setSearchQuery('');
            setSelectedCandidateId(null);
        }
    }, [isOpen]);

    const fetchCandidates = async () => {
        setIsLoading(true);
        try {
            const res = await candidatesApi.getAll({
                take: 100,
            });
            const data = (res.data as any).data;
            // Handle both array and paginated response { candidates: [], total: number }
            const items = Array.isArray(data) ? data : (data?.candidates || []);
            setCandidates(items);
        } catch (error) {
            console.error('Failed to fetch candidates', error);
            toast.error('Failed to load candidates');
            setCandidates([]);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredCandidates = (candidates || []).filter(c => {
        const fullName = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase();
        const email = (c.email || '').toLowerCase();
        const query = searchQuery.toLowerCase();
        return fullName.includes(query) || email.includes(query);
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh] border border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                        Add Candidate to Job
                    </h3>
                    <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Search candidates..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            autoFocus
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    {isLoading ? (
                        <div className="flex justify-center p-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        </div>
                    ) : filteredCandidates.length === 0 ? (
                        <div className="text-center p-4 text-neutral-500">
                            No candidates found
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filteredCandidates.map((candidate) => {
                                const isApplied = alreadyAppliedIds.includes(candidate.id);
                                return (
                                    <button
                                        key={candidate.id}
                                        onClick={() => !isApplied && setSelectedCandidateId(candidate.id)}
                                        disabled={isApplied}
                                        className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${selectedCandidateId === candidate.id
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : isApplied
                                                ? 'opacity-50 cursor-not-allowed bg-neutral-50 dark:bg-neutral-800 border-transparent'
                                                : 'border-transparent hover:bg-neutral-50 dark:hover:bg-neutral-800'
                                            }`}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-xs font-medium text-neutral-600 dark:text-neutral-300">
                                            {candidate.firstName[0]}{candidate.lastName[0]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-neutral-900 dark:text-white truncate">
                                                {candidate.firstName} {candidate.lastName}
                                                {isApplied && <span className="ml-2 text-xs text-neutral-500 font-normal">(Applied)</span>}
                                            </div>
                                            <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                                                {candidate.email}
                                            </div>
                                        </div>
                                        {selectedCandidateId === candidate.id && (
                                            <CheckCircle size={16} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-end gap-3 p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                        disabled={isAdding}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => selectedCandidateId && onAdd(selectedCandidateId)}
                        disabled={!selectedCandidateId || isAdding}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isAdding ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Adding...
                            </>
                        ) : (
                            <>
                                <UserPlus size={16} />
                                Add to Job
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
