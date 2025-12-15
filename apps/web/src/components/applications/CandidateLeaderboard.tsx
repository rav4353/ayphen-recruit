'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import {
  Trophy,
  TrendingUp,
  Star,
  Users,
  ChevronDown,
  Medal,
  Target,
  Loader2,
} from 'lucide-react';
import { candidateLeaderboardApi } from '@/lib/api';
import { cn } from '@/lib/utils';

interface CandidateLeaderboardProps {
  jobId: string;
  jobTitle?: string;
}

export function CandidateLeaderboard({ jobId, jobTitle }: CandidateLeaderboardProps) {
  const [sortBy, setSortBy] = useState<'composite' | 'matchScore' | 'rating' | 'skillMatch' | 'stageProgress'>('composite');
  const [limit, setLimit] = useState(10);

  const { data, isLoading, error } = useQuery({
    queryKey: ['leaderboard', jobId, sortBy, limit],
    queryFn: () => candidateLeaderboardApi.get(jobId, { sortBy, limit }),
  });

  const leaderboard = data?.data;

  const sortOptions = [
    { value: 'composite', label: 'Overall Score' },
    { value: 'matchScore', label: 'Match Score' },
    { value: 'rating', label: 'Interview Rating' },
    { value: 'skillMatch', label: 'Skill Match' },
    { value: 'stageProgress', label: 'Stage Progress' },
  ];

  const limitOptions = [
    { value: '5', label: 'Top 5' },
    { value: '10', label: 'Top 10' },
    { value: '25', label: 'Top 25' },
  ];

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="w-5 h-5 flex items-center justify-center text-sm font-medium text-neutral-500">{rank}</span>;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressBarColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      </Card>
    );
  }

  if (error || !leaderboard) {
    return (
      <Card className="p-6">
        <div className="text-center text-neutral-500">
          Failed to load leaderboard data
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-500/10 rounded-lg">
              <Trophy className="h-6 w-6 text-primary-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                Candidate Leaderboard
              </h3>
              {jobTitle && (
                <p className="text-sm text-neutral-500">{jobTitle}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select
              options={sortOptions}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            />
            <Select
              options={limitOptions}
              value={String(limit)}
              onChange={(e) => setLimit(Number(e.target.value))}
            />
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-4 gap-4">
          <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
            <div className="flex items-center gap-2 text-neutral-500 text-sm mb-1">
              <Users className="h-4 w-4" />
              Total
            </div>
            <p className="text-xl font-bold text-neutral-900 dark:text-white">
              {leaderboard.totalCandidates}
            </p>
          </div>
          <div className="p-3 bg-green-500/10 rounded-lg">
            <div className="flex items-center gap-2 text-green-600 text-sm mb-1">
              <TrendingUp className="h-4 w-4" />
              Highest
            </div>
            <p className="text-xl font-bold text-green-600">
              {leaderboard.stats?.highestScore || 0}
            </p>
          </div>
          <div className="p-3 bg-blue-500/10 rounded-lg">
            <div className="flex items-center gap-2 text-blue-600 text-sm mb-1">
              <Target className="h-4 w-4" />
              Average
            </div>
            <p className="text-xl font-bold text-blue-600">
              {leaderboard.stats?.averageCompositeScore || 0}
            </p>
          </div>
          <div className="p-3 bg-purple-500/10 rounded-lg">
            <div className="flex items-center gap-2 text-purple-600 text-sm mb-1">
              <Star className="h-4 w-4" />
              Excellent
            </div>
            <p className="text-xl font-bold text-purple-600">
              {leaderboard.stats?.distribution?.excellent || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
        {leaderboard.leaderboard?.map((candidate: {
          rank: number;
          applicationId: string;
          candidate: { id: string; firstName: string; lastName: string; email: string; currentTitle?: string; currentCompany?: string };
          currentStage: string;
          status: string;
          scores: { composite: number; matchScore: number; rating: number; skillMatch: number; stageProgress: number };
          metrics: { interviewCount: number; feedbackCount: number; avgRating: number | null };
        }) => (
          <div
            key={candidate.applicationId}
            className={cn(
              'p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors',
              candidate.rank <= 3 && 'bg-gradient-to-r from-transparent',
              candidate.rank === 1 && 'from-yellow-500/5',
              candidate.rank === 2 && 'from-gray-400/5',
              candidate.rank === 3 && 'from-amber-600/5'
            )}
          >
            <div className="flex items-center gap-4">
              {/* Rank */}
              <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                {getRankIcon(candidate.rank)}
              </div>

              {/* Candidate Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-neutral-900 dark:text-white truncate">
                    {candidate.candidate.firstName} {candidate.candidate.lastName}
                  </h4>
                  <Badge variant={candidate.status === 'ACTIVE' ? 'success' : 'secondary'}>
                    {candidate.currentStage}
                  </Badge>
                </div>
                {candidate.candidate.currentTitle && (
                  <p className="text-sm text-neutral-500 truncate">
                    {candidate.candidate.currentTitle}
                    {candidate.candidate.currentCompany && ` at ${candidate.candidate.currentCompany}`}
                  </p>
                )}
              </div>

              {/* Scores */}
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-xs text-neutral-500 mb-1">Match</p>
                  <p className={cn('font-semibold', getScoreColor(candidate.scores.matchScore))}>
                    {candidate.scores.matchScore}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-neutral-500 mb-1">Rating</p>
                  <p className={cn('font-semibold', getScoreColor(candidate.scores.rating))}>
                    {candidate.scores.rating}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-neutral-500 mb-1">Skills</p>
                  <p className={cn('font-semibold', getScoreColor(candidate.scores.skillMatch))}>
                    {candidate.scores.skillMatch}%
                  </p>
                </div>
              </div>

              {/* Composite Score */}
              <div className="flex-shrink-0 w-24">
                <div className="text-right mb-1">
                  <span className={cn('text-2xl font-bold', getScoreColor(candidate.scores.composite))}>
                    {candidate.scores.composite}
                  </span>
                </div>
                <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all', getProgressBarColor(candidate.scores.composite))}
                    style={{ width: `${candidate.scores.composite}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      {leaderboard.totalCandidates > limit && (
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-700 text-center">
          <Button
            variant="ghost"
            onClick={() => setLimit(limit + 10)}
          >
            Load More Candidates
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
    </Card>
  );
}
