import { useState, useEffect } from 'react';
import { X, Users, Briefcase, MapPin, Star, TrendingUp, Award, Mail, Phone } from 'lucide-react';
import { Button } from '../ui';
import { candidateComparisonApi } from '../../lib/api';
import toast from 'react-hot-toast';

interface CandidateComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateIds: string[];
}

export function CandidateComparisonModal({ isOpen, onClose, candidateIds }: CandidateComparisonModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [comparisonData, setComparisonData] = useState<any>(null);

  useEffect(() => {
    if (isOpen && candidateIds.length > 0) {
      fetchComparison();
    }
  }, [isOpen, candidateIds]);

  const fetchComparison = async () => {
    setIsLoading(true);
    try {
      const response = await candidateComparisonApi.compare(candidateIds);
      setComparisonData(response.data);
    } catch (error) {
      console.error('Failed to fetch comparison:', error);
      toast.error('Failed to load candidate comparison');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <Users size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                Candidate Comparison
              </h2>
              <p className="text-sm text-neutral-500">
                Comparing {candidateIds.length} candidates side-by-side
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : comparisonData ? (
            <div className="space-y-6">
              {/* Candidates Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {comparisonData.candidates?.map((candidate: any) => (
                  <div
                    key={candidate.id}
                    className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700"
                  >
                    {/* Candidate Header */}
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                        {candidate.firstName?.[0]}{candidate.lastName?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-neutral-900 dark:text-white truncate">
                          {candidate.firstName} {candidate.lastName}
                        </h3>
                        <p className="text-sm text-neutral-500 truncate">{candidate.currentTitle}</p>
                      </div>
                    </div>

                    {/* Score */}
                    {candidate.score !== undefined && (
                      <div className="mb-4 p-3 bg-white dark:bg-neutral-900 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                            Match Score
                          </span>
                          <span className="text-lg font-bold text-blue-600">
                            {Math.round(candidate.score)}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                            style={{ width: `${candidate.score}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Details */}
                    <div className="space-y-2">
                      {candidate.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail size={14} className="text-neutral-400" />
                          <span className="text-neutral-600 dark:text-neutral-400 truncate">
                            {candidate.email}
                          </span>
                        </div>
                      )}
                      {candidate.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone size={14} className="text-neutral-400" />
                          <span className="text-neutral-600 dark:text-neutral-400">
                            {candidate.phone}
                          </span>
                        </div>
                      )}
                      {candidate.location && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin size={14} className="text-neutral-400" />
                          <span className="text-neutral-600 dark:text-neutral-400">
                            {candidate.location}
                          </span>
                        </div>
                      )}
                      {candidate.experienceYears !== undefined && (
                        <div className="flex items-center gap-2 text-sm">
                          <Briefcase size={14} className="text-neutral-400" />
                          <span className="text-neutral-600 dark:text-neutral-400">
                            {candidate.experienceYears} years experience
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Skills */}
                    {candidate.skills && candidate.skills.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                          Skills
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {candidate.skills.slice(0, 5).map((skill: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full"
                            >
                              {skill}
                            </span>
                          ))}
                          {candidate.skills.length > 5 && (
                            <span className="px-2 py-1 bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 text-xs rounded-full">
                              +{candidate.skills.length - 5}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Comparison Summary */}
              {comparisonData.summary && (
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                    <TrendingUp size={20} className="text-blue-600" />
                    Comparison Insights
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {comparisonData.summary.topCandidate && (
                      <div className="bg-white dark:bg-neutral-900 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                          <Award size={16} className="text-yellow-500" />
                          Top Candidate
                        </div>
                        <p className="font-semibold text-neutral-900 dark:text-white">
                          {comparisonData.summary.topCandidate.name}
                        </p>
                        <p className="text-sm text-neutral-500">
                          {Math.round(comparisonData.summary.topCandidate.score)}% match
                        </p>
                      </div>
                    )}
                    {comparisonData.summary.avgExperience !== undefined && (
                      <div className="bg-white dark:bg-neutral-900 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                          <Briefcase size={16} />
                          Avg Experience
                        </div>
                        <p className="font-semibold text-neutral-900 dark:text-white">
                          {comparisonData.summary.avgExperience.toFixed(1)} years
                        </p>
                      </div>
                    )}
                    {comparisonData.summary.commonSkills && (
                      <div className="bg-white dark:bg-neutral-900 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                          <Star size={16} />
                          Common Skills
                        </div>
                        <p className="font-semibold text-neutral-900 dark:text-white">
                          {comparisonData.summary.commonSkills.length} skills
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-neutral-500">
              <Users size={48} className="mb-4 opacity-50" />
              <p>No comparison data available</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-neutral-200 dark:border-neutral-800">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
