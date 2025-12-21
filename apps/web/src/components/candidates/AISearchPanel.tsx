import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, Users, Briefcase, MapPin, X, ChevronRight, Star, Loader2 } from 'lucide-react';
import { Button, Input, Badge } from '../ui';
import { semanticSearchApi, SemanticSearchResult } from '../../lib/api/semantic-search';
import toast from 'react-hot-toast';

interface AISearchPanelProps {
    onSelectCandidate?: (candidateId: string) => void;
    onClose?: () => void;
    jobId?: string;
}

export function AISearchPanel({ onSelectCandidate, onClose, jobId }: AISearchPanelProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SemanticSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [activeTab, setActiveTab] = useState<'search' | 'match' | 'recommend'>('search');

    // Recommendation filters
    const [role, setRole] = useState('');
    const [skills, setSkills] = useState<string[]>([]);
    const [skillInput, setSkillInput] = useState('');

    const handleSearch = async () => {
        if (!query.trim()) return;

        setIsSearching(true);
        setHasSearched(true);

        try {
            const response = await semanticSearchApi.search({
                query: query.trim(),
                limit: 25,
                minScore: 0.4,
            });
            setResults(response.data);
        } catch (error) {
            console.error('Search failed:', error);
            toast.error('Search failed. Please try again.');
        } finally {
            setIsSearching(false);
        }
    };

    const handleMatchToJob = async () => {
        if (!jobId) {
            toast.error('No job selected');
            return;
        }

        setIsSearching(true);
        setHasSearched(true);

        try {
            const response = await semanticSearchApi.matchToJob(jobId, 30);
            setResults(response.data);
        } catch (error) {
            console.error('Match failed:', error);
            toast.error('Failed to match candidates to job.');
        } finally {
            setIsSearching(false);
        }
    };

    const handleGetRecommendations = async () => {
        setIsSearching(true);
        setHasSearched(true);

        try {
            const response = await semanticSearchApi.getRecommendations({
                role: role || undefined,
                skills: skills.length > 0 ? skills : undefined,
            });
            setResults(response.data);
        } catch (error) {
            console.error('Recommendations failed:', error);
            toast.error('Failed to get recommendations.');
        } finally {
            setIsSearching(false);
        }
    };

    const addSkill = () => {
        if (skillInput.trim() && !skills.includes(skillInput.trim())) {
            setSkills([...skills, skillInput.trim()]);
            setSkillInput('');
        }
    };

    const removeSkill = (skill: string) => {
        setSkills(skills.filter(s => s !== skill));
    };

    const exampleQueries = [
        'React developers with 5+ years experience',
        'Marketing managers from Fortune 500',
        'Data scientists with Python and ML',
        'Product designers with B2B SaaS background',
    ];

    return (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl">
                            <Sparkles size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">AI-Powered Candidate Search</h2>
                            <p className="text-white/80 text-sm">Find the perfect candidates using natural language</p>
                        </div>
                    </div>
                    {onClose && (
                        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mt-6">
                    {[
                        { id: 'search', label: 'Natural Search', icon: Search },
                        { id: 'match', label: 'Match to Job', icon: Briefcase, disabled: !jobId },
                        { id: 'recommend', label: 'Recommendations', icon: Users },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => !tab.disabled && setActiveTab(tab.id as typeof activeTab)}
                            disabled={tab.disabled}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                activeTab === tab.id
                                    ? 'bg-white text-blue-600'
                                    : tab.disabled
                                    ? 'bg-white/10 text-white/40 cursor-not-allowed'
                                    : 'bg-white/20 text-white hover:bg-white/30'
                            }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                <AnimatePresence mode="wait">
                    {activeTab === 'search' && (
                        <motion.div
                            key="search"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <div className="flex gap-3">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
                                    <Input
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        placeholder="Describe the ideal candidate..."
                                        className="pl-12 h-12 text-base"
                                    />
                                </div>
                                <Button
                                    onClick={handleSearch}
                                    disabled={!query.trim() || isSearching}
                                    className="h-12 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                >
                                    {isSearching ? <Loader2 className="animate-spin" size={20} /> : 'Search'}
                                </Button>
                            </div>

                            {!hasSearched && (
                                <div className="mt-4">
                                    <p className="text-sm text-neutral-500 mb-2">Try these examples:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {exampleQueries.map((example) => (
                                            <button
                                                key={example}
                                                onClick={() => setQuery(example)}
                                                className="px-3 py-1.5 text-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                                            >
                                                {example}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'match' && (
                        <motion.div
                            key="match"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="text-center py-4"
                        >
                            <Briefcase className="mx-auto text-blue-500 mb-3" size={40} />
                            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Match Candidates to This Job</h3>
                            <p className="text-neutral-500 mt-1 mb-4">AI will analyze the job requirements and find best-fit candidates</p>
                            <Button
                                onClick={handleMatchToJob}
                                disabled={isSearching}
                                className="bg-gradient-to-r from-blue-600 to-purple-600"
                            >
                                {isSearching ? <Loader2 className="animate-spin mr-2" size={18} /> : <Sparkles className="mr-2" size={18} />}
                                Find Matching Candidates
                            </Button>
                        </motion.div>
                    )}

                    {activeTab === 'recommend' && (
                        <motion.div
                            key="recommend"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Target Role (optional)
                                </label>
                                <Input
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    placeholder="e.g., Senior Software Engineer"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Required Skills
                                </label>
                                <div className="flex gap-2">
                                    <Input
                                        value={skillInput}
                                        onChange={(e) => setSkillInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                                        placeholder="Add a skill..."
                                    />
                                    <Button variant="secondary" onClick={addSkill}>Add</Button>
                                </div>
                                {skills.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {skills.map((skill) => (
                                            <Badge key={skill} variant="secondary" className="pl-2 pr-1 py-1">
                                                {skill}
                                                <button onClick={() => removeSkill(skill)} className="ml-1 p-0.5 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded">
                                                    <X size={14} />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <Button
                                onClick={handleGetRecommendations}
                                disabled={isSearching}
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                            >
                                {isSearching ? <Loader2 className="animate-spin mr-2" size={18} /> : <Sparkles className="mr-2" size={18} />}
                                Get AI Recommendations
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Results */}
                {hasSearched && (
                    <div className="mt-6 border-t border-neutral-200 dark:border-neutral-800 pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-neutral-900 dark:text-white">
                                {isSearching ? 'Searching...' : `${results.length} Candidates Found`}
                            </h3>
                        </div>

                        {isSearching ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="animate-spin text-blue-500" size={32} />
                            </div>
                        ) : results.length === 0 ? (
                            <div className="text-center py-12 text-neutral-500">
                                <Users className="mx-auto mb-3 opacity-50" size={40} />
                                <p>No matching candidates found</p>
                                <p className="text-sm mt-1">Try adjusting your search criteria</p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                {results.map((candidate) => (
                                    <motion.div
                                        key={candidate.candidateId}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer group"
                                        onClick={() => onSelectCandidate?.(candidate.candidateId)}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-semibold text-neutral-900 dark:text-white">
                                                        {candidate.firstName} {candidate.lastName}
                                                    </h4>
                                                    <div className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full">
                                                        <Star className="text-yellow-500" size={12} />
                                                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                                                            {Math.round(candidate.matchScore * 100)}%
                                                        </span>
                                                    </div>
                                                </div>
                                                {candidate.currentTitle && (
                                                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">
                                                        {candidate.currentTitle}
                                                        {candidate.currentCompany && ` at ${candidate.currentCompany}`}
                                                    </p>
                                                )}
                                                {candidate.location && (
                                                    <p className="text-xs text-neutral-500 flex items-center gap-1 mt-1">
                                                        <MapPin size={12} />
                                                        {candidate.location}
                                                    </p>
                                                )}
                                                <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                                                    {candidate.matchReason}
                                                </p>
                                                {candidate.skills.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {candidate.skills.slice(0, 5).map((skill) => (
                                                            <span
                                                                key={skill}
                                                                className="px-2 py-0.5 text-xs bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 rounded"
                                                            >
                                                                {skill}
                                                            </span>
                                                        ))}
                                                        {candidate.skills.length > 5 && (
                                                            <span className="text-xs text-neutral-500">
                                                                +{candidate.skills.length - 5} more
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <ChevronRight className="text-neutral-400 group-hover:text-blue-500 transition-colors" size={20} />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
