'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Clock,
  Briefcase,
  MessageSquare,
  FileText,
  Mail,
  Tag,
  User,
  Calendar,
  CheckCircle,
  Loader2,
  Filter,
  ChevronDown,
} from 'lucide-react';
import { candidateActivityApi } from '@/lib/api';

interface Activity {
  id: string;
  type: string;
  action: string;
  description: string;
  metadata?: Record<string, any>;
  userId?: string;
  userName?: string;
  createdAt: string;
}

const activityIcons: Record<string, React.ElementType> = {
  APPLICATION: Briefcase,
  INTERVIEW: Calendar,
  OFFER: FileText,
  FEEDBACK: MessageSquare,
  EMAIL_SENT: Mail,
  TAG_ADDED: Tag,
  NOTE_ADDED: MessageSquare,
  STAGE_CHANGED: CheckCircle,
  DEFAULT: Clock,
};

const activityColors: Record<string, string> = {
  APPLICATION: 'bg-blue-100 text-blue-600',
  INTERVIEW: 'bg-purple-100 text-purple-600',
  OFFER: 'bg-green-100 text-green-600',
  FEEDBACK: 'bg-yellow-100 text-yellow-600',
  EMAIL_SENT: 'bg-indigo-100 text-indigo-600',
  TAG_ADDED: 'bg-pink-100 text-pink-600',
  STAGE_CHANGED: 'bg-teal-100 text-teal-600',
  DEFAULT: 'bg-neutral-100 text-neutral-600',
};

interface CandidateActivityTimelineProps {
  candidateId: string;
}

export function CandidateActivityTimeline({ candidateId }: CandidateActivityTimelineProps) {
  const [filterType, setFilterType] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [limit, setLimit] = useState(20);

  const { data: timeline, isLoading } = useQuery({
    queryKey: ['candidate-activity', candidateId, filterType, limit],
    queryFn: () => candidateActivityApi.getTimeline(candidateId, {
      limit,
      types: filterType || undefined,
    }),
  });

  const { data: summary } = useQuery({
    queryKey: ['candidate-activity-summary', candidateId],
    queryFn: () => candidateActivityApi.getSummary(candidateId),
  });

  const activities: Activity[] = timeline?.data?.activities || [];
  const total = timeline?.data?.total || 0;
  const summaryData = summary?.data;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return `${diffMins} min ago`;
      }
      return `${diffHours}h ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    }
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      {summaryData && (
        <div className="grid grid-cols-4 gap-3">
          <Card className="p-3 text-center">
            <p className="text-2xl font-bold text-primary-600">{summaryData.totalApplications}</p>
            <p className="text-xs text-neutral-500">Applications</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-2xl font-bold text-purple-600">{summaryData.totalInterviews}</p>
            <p className="text-xs text-neutral-500">Interviews</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{summaryData.totalOffers}</p>
            <p className="text-xs text-neutral-500">Offers</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-2xl font-bold text-yellow-600">{summaryData.totalFeedback}</p>
            <p className="text-xs text-neutral-500">Feedback</p>
          </Card>
        </div>
      )}

      {/* Header with Filters */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Activity Timeline
          <Badge variant="secondary" className="text-xs">{total}</Badge>
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4 mr-1" />
          Filter
          <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </Button>
      </div>

      {/* Filter Options */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
          <Button
            variant={filterType === '' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilterType('')}
          >
            All
          </Button>
          <Button
            variant={filterType === 'APPLICATION_CREATED' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilterType('APPLICATION_CREATED')}
          >
            Applications
          </Button>
          <Button
            variant={filterType === 'INTERVIEW_SCHEDULED,INTERVIEW_COMPLETED' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilterType('INTERVIEW_SCHEDULED,INTERVIEW_COMPLETED')}
          >
            Interviews
          </Button>
          <Button
            variant={filterType === 'FEEDBACK_SUBMITTED' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilterType('FEEDBACK_SUBMITTED')}
          >
            Feedback
          </Button>
          <Button
            variant={filterType === 'EMAIL_SENT' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilterType('EMAIL_SENT')}
          >
            Emails
          </Button>
        </div>
      )}

      {/* Timeline */}
      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
        </div>
      ) : activities.length === 0 ? (
        <Card className="p-8 text-center">
          <Clock className="h-8 w-8 mx-auto text-neutral-400 mb-2" />
          <p className="text-neutral-500">No activity yet</p>
        </Card>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-neutral-200 dark:bg-neutral-700" />

          <div className="space-y-4">
            {activities.map((activity) => {
              const Icon = activityIcons[activity.type] || activityIcons.DEFAULT;
              const colorClass = activityColors[activity.type] || activityColors.DEFAULT;

              return (
                <div key={activity.id} className="relative flex gap-4 pl-2">
                  {/* Icon */}
                  <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${colorClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-neutral-900 dark:text-white">
                            {activity.description}
                          </p>
                          {activity.userName && (
                            <p className="text-xs text-neutral-500 mt-0.5 flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {activity.userName}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-neutral-400">
                          {formatDate(activity.createdAt)}
                        </span>
                      </div>

                      {/* Metadata */}
                      {activity.metadata && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {activity.metadata.jobTitle && (
                            <Badge variant="outline" className="text-xs">
                              {activity.metadata.jobTitle}
                            </Badge>
                          )}
                          {activity.metadata.status && (
                            <Badge variant="secondary" className="text-xs">
                              {activity.metadata.status}
                            </Badge>
                          )}
                          {activity.metadata.rating && (
                            <Badge variant="warning" className="text-xs">
                              Rating: {activity.metadata.rating}/5
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load More */}
          {activities.length < total && (
            <div className="text-center pt-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setLimit(l => l + 20)}
              >
                Load More ({total - activities.length} remaining)
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
