import { useState, useEffect } from 'react';
import { TrendingUp, Award, Target, Zap, RefreshCw } from 'lucide-react';
import { Button } from '../ui';
import { candidateScoringApi } from '../../lib/api';
import toast from 'react-hot-toast';

interface CandidateScoringPanelProps {
  candidateId: string;
  jobId: string;
}

export function CandidateScoringPanel({ candidateId, jobId }: CandidateScoringPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [scoreData, setScoreData] = useState<any>(null);

  useEffect(() => {
    fetchScore();
  }, [candidateId, jobId]);

  const fetchScore = async () => {
    setIsLoading(true);
    try {
      const response = await candidateScoringApi.getScore(candidateId, jobId);
      setScoreData(response.data);
    } catch (error) {
      console.error('Failed to fetch score:', error);
      toast.error('Failed to load candidate score');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!scoreData) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-blue-600 dark:text-blue-400';
    if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-500';
    if (score >= 60) return 'from-blue-500 to-cyan-500';
    if (score >= 40) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <Target size={20} className="text-blue-600" />
          <h3 className="font-semibold text-neutral-900 dark:text-white">Candidate Score</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchScore}
          disabled={isLoading}
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
        </Button>
      </div>

      {/* Overall Score */}
      <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Overall Match</p>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-bold ${getScoreColor(scoreData.overallScore)}`}>
                {Math.round(scoreData.overallScore)}
              </span>
              <span className="text-lg text-neutral-500">/100</span>
            </div>
          </div>
          <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${getScoreBgColor(scoreData.overallScore)} flex items-center justify-center shadow-lg`}>
            <Award size={40} className="text-white" />
          </div>
        </div>
        <div className="w-full h-3 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${getScoreBgColor(scoreData.overallScore)} transition-all duration-500`}
            style={{ width: `${scoreData.overallScore}%` }}
          />
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="p-6 space-y-4">
        <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
          Score Breakdown
        </h4>

        {scoreData.breakdown?.map((item: any, index: number) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-neutral-400" />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                  {item.category}
                </span>
              </div>
              <span className={`text-sm font-semibold ${getScoreColor(item.score)}`}>
                {Math.round(item.score)}%
              </span>
            </div>
            <div className="w-full h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${getScoreBgColor(item.score)} transition-all`}
                style={{ width: `${item.score}%` }}
              />
            </div>
            {item.details && (
              <p className="text-xs text-neutral-500 ml-6">{item.details}</p>
            )}
          </div>
        ))}
      </div>

      {/* Strengths & Weaknesses */}
      {(scoreData.strengths?.length > 0 || scoreData.weaknesses?.length > 0) && (
        <div className="p-6 border-t border-neutral-200 dark:border-neutral-800 space-y-4">
          {scoreData.strengths?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-2">
                ✓ Strengths
              </h4>
              <ul className="space-y-1">
                {scoreData.strengths.map((strength: string, idx: number) => (
                  <li key={idx} className="text-sm text-neutral-600 dark:text-neutral-400 pl-4">
                    • {strength}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {scoreData.weaknesses?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-orange-700 dark:text-orange-400 mb-2">
                ⚠ Areas for Consideration
              </h4>
              <ul className="space-y-1">
                {scoreData.weaknesses.map((weakness: string, idx: number) => (
                  <li key={idx} className="text-sm text-neutral-600 dark:text-neutral-400 pl-4">
                    • {weakness}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Recommendation */}
      {scoreData.recommendation && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-2">
            <TrendingUp size={16} className="text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                Recommendation
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {scoreData.recommendation}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
