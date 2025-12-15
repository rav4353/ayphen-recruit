'use client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Users,
  Star,
  Briefcase,
  MapPin,
  Trophy,
  Loader2,
  X,
} from 'lucide-react';
import { candidateComparisonApi } from '@/lib/api';

interface CandidateComparisonProps {
  candidateIds: string[];
  onClose?: () => void;
}

interface ComparisonCandidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  currentTitle?: string;
  skills: string[];
  applications: {
    jobTitle: string;
    stage: string;
    status: string;
    appliedAt: string;
  }[];
  interviews: {
    type: string;
    status: string;
    scheduledAt: string;
    avgRating?: number;
  }[];
  assessments: {
    name: string;
    score: number;
    maxScore: number;
  }[];
  overallScore: number;
  averageInterviewRating: number;
}

export function CandidateComparison({ candidateIds, onClose }: CandidateComparisonProps) {
  const { data: comparison, isLoading, error } = useQuery({
    queryKey: ['candidate-comparison', candidateIds],
    queryFn: () => candidateComparisonApi.compare(candidateIds),
    enabled: candidateIds.length >= 2,
  });

  const candidates: ComparisonCandidate[] = comparison?.data || [];

  if (candidateIds.length < 2) {
    return (
      <Card className="p-8 text-center">
        <Users className="h-12 w-12 mx-auto text-neutral-400 mb-4" />
        <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
          Select Candidates to Compare
        </h3>
        <p className="text-neutral-500">
          Please select at least 2 candidates to compare side-by-side.
        </p>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <p className="text-red-500">Failed to load comparison data</p>
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-neutral-300'}`}
      />
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
          <Users className="h-6 w-6" />
          Candidate Comparison
        </h2>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Comparison Grid */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr>
              <th className="text-left p-3 bg-neutral-50 dark:bg-neutral-800 rounded-tl-lg w-40">
                Criteria
              </th>
              {candidates.map((candidate, idx) => (
                <th
                  key={candidate.id}
                  className={`p-3 bg-neutral-50 dark:bg-neutral-800 ${idx === candidates.length - 1 ? 'rounded-tr-lg' : ''}`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="font-medium text-neutral-900 dark:text-white">
                      {candidate.name}
                    </span>
                    {idx === 0 && (
                      <Badge variant="success" className="text-xs">
                        <Trophy className="h-3 w-3 mr-1" />
                        Top Ranked
                      </Badge>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Overall Score */}
            <tr className="border-b border-neutral-200 dark:border-neutral-700">
              <td className="p-3 font-medium text-neutral-600 dark:text-neutral-400">
                Overall Score
              </td>
              {candidates.map((candidate) => (
                <td key={candidate.id} className="p-3 text-center">
                  <span className={`inline-flex items-center justify-center w-12 h-12 rounded-full font-bold ${getScoreColor(candidate.overallScore)}`}>
                    {candidate.overallScore}
                  </span>
                </td>
              ))}
            </tr>

            {/* Interview Rating */}
            <tr className="border-b border-neutral-200 dark:border-neutral-700">
              <td className="p-3 font-medium text-neutral-600 dark:text-neutral-400">
                Interview Rating
              </td>
              {candidates.map((candidate) => (
                <td key={candidate.id} className="p-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {getRatingStars(candidate.averageInterviewRating)}
                  </div>
                  <span className="text-sm text-neutral-500">
                    {candidate.averageInterviewRating.toFixed(1)}/5
                  </span>
                </td>
              ))}
            </tr>

            {/* Current Title */}
            <tr className="border-b border-neutral-200 dark:border-neutral-700">
              <td className="p-3 font-medium text-neutral-600 dark:text-neutral-400">
                <Briefcase className="h-4 w-4 inline mr-2" />
                Current Title
              </td>
              {candidates.map((candidate) => (
                <td key={candidate.id} className="p-3 text-center text-neutral-900 dark:text-white">
                  {candidate.currentTitle || '-'}
                </td>
              ))}
            </tr>

            {/* Location */}
            <tr className="border-b border-neutral-200 dark:border-neutral-700">
              <td className="p-3 font-medium text-neutral-600 dark:text-neutral-400">
                <MapPin className="h-4 w-4 inline mr-2" />
                Location
              </td>
              {candidates.map((candidate) => (
                <td key={candidate.id} className="p-3 text-center text-neutral-900 dark:text-white">
                  {candidate.location || '-'}
                </td>
              ))}
            </tr>

            {/* Skills */}
            <tr className="border-b border-neutral-200 dark:border-neutral-700">
              <td className="p-3 font-medium text-neutral-600 dark:text-neutral-400">
                Skills
              </td>
              {candidates.map((candidate) => (
                <td key={candidate.id} className="p-3">
                  <div className="flex flex-wrap justify-center gap-1">
                    {candidate.skills.slice(0, 5).map((skill, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {candidate.skills.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{candidate.skills.length - 5}
                      </Badge>
                    )}
                  </div>
                </td>
              ))}
            </tr>

            {/* Interviews */}
            <tr className="border-b border-neutral-200 dark:border-neutral-700">
              <td className="p-3 font-medium text-neutral-600 dark:text-neutral-400">
                Interviews
              </td>
              {candidates.map((candidate) => (
                <td key={candidate.id} className="p-3 text-center">
                  <Badge variant="primary">{candidate.interviews.length} completed</Badge>
                </td>
              ))}
            </tr>

            {/* Assessments */}
            <tr>
              <td className="p-3 font-medium text-neutral-600 dark:text-neutral-400 rounded-bl-lg">
                Assessments
              </td>
              {candidates.map((candidate, idx) => (
                <td
                  key={candidate.id}
                  className={`p-3 text-center ${idx === candidates.length - 1 ? 'rounded-br-lg' : ''}`}
                >
                  {candidate.assessments.length > 0 ? (
                    <div className="space-y-1">
                      {candidate.assessments.slice(0, 2).map((assessment, i) => (
                        <div key={i} className="text-sm">
                          <span className="text-neutral-500">{assessment.name}:</span>{' '}
                          <span className="font-medium">
                            {assessment.score}/{assessment.maxScore}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-neutral-400">-</span>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <Card className="p-4 bg-primary-50 dark:bg-primary-900/20">
        <div className="flex items-center gap-3">
          <Trophy className="h-6 w-6 text-primary-500" />
          <div>
            <p className="font-medium text-neutral-900 dark:text-white">
              Recommendation: <span className="text-primary-600">{candidates[0]?.name}</span>
            </p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Based on overall score of {candidates[0]?.overallScore} and interview rating of{' '}
              {candidates[0]?.averageInterviewRating.toFixed(1)}/5
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
