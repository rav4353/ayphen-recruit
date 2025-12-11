import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { X, Star, ThumbsUp, ThumbsDown, Award, Brain, Users, Code, MessageCircle, Target, CheckCircle, ClipboardList } from 'lucide-react';
import { Button } from '../ui';
import { interviewsApi, scorecardTemplatesApi } from '../../lib/api';
import toast from 'react-hot-toast';

interface InterviewFeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    interviewId: string;
    candidateName: string;
    onSuccess: () => void;
}

interface FeedbackForm {
    rating: number;
    strengths?: string;
    weaknesses?: string;
    notes?: string;
    recommendation?: 'STRONG_YES' | 'YES' | 'NO' | 'STRONG_NO';
    [key: string]: any;
}

export function InterviewFeedbackModal({
    isOpen,
    onClose,
    interviewId,
    candidateName,
    onSuccess,
}: InterviewFeedbackModalProps) {
    const { t } = useTranslation();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedRating, setSelectedRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [criteriaList, setCriteriaList] = useState<any[]>([]);
    const [isLoadingCriteria, setIsLoadingCriteria] = useState(false);

    const {
        register,
        handleSubmit,
        control,
        reset,
    } = useForm<FeedbackForm>({
        defaultValues: {
            rating: 0,
        },
    });

    const defaultCriteria = [
        { key: 'technicalSkills', label: 'Technical Skills', icon: Code, description: 'Coding & technical proficiency' },
        { key: 'communication', label: 'Communication', icon: MessageCircle, description: 'Clarity & articulation' },
        { key: 'problemSolving', label: 'Problem Solving', icon: Brain, description: 'Analytical thinking' },
        { key: 'culturalFit', label: 'Cultural Fit', icon: Users, description: 'Team & company alignment' },
        { key: 'experience', label: 'Experience', icon: Award, description: 'Relevant background' },
        { key: 'motivation', label: 'Motivation', icon: Target, description: 'Drive & enthusiasm' },
    ];

    useEffect(() => {
        const fetchScorecardTemplate = async () => {
            if (!isOpen || !interviewId) return;

            setIsLoadingCriteria(true);
            try {
                // Fetch interview to get scorecard template ID
                const interviewRes = await interviewsApi.getById(interviewId);
                const interview = interviewRes.data;
                const scorecardTemplateId = (interview.application?.job as any)?.scorecardTemplateId;

                if (scorecardTemplateId) {
                    const templateRes = await scorecardTemplatesApi.getOne(scorecardTemplateId);
                    const template = templateRes.data;
                    if (template && template.sections && Array.isArray(template.sections)) {
                        const mappedSections = template.sections.map((section: any) => ({
                            key: section.key || section.label.toLowerCase().replace(/\s+/g, ''),
                            label: section.label,
                            description: section.description,
                            icon: ClipboardList // Default icon for dynamic sections
                        }));
                        setCriteriaList(mappedSections);
                        return;
                    }
                }

                // Fallback to default if no template or invalid template
                setCriteriaList(defaultCriteria);
            } catch (error) {
                console.error('Failed to fetch scorecard criteria', error);
                setCriteriaList(defaultCriteria);
            } finally {
                setIsLoadingCriteria(false);
            }
        };

        fetchScorecardTemplate();
    }, [isOpen, interviewId]);

    const onSubmit = async (data: FeedbackForm) => {
        if (selectedRating === 0) {
            toast.error('Please provide an overall rating');
            return;
        }

        setIsSubmitting(true);
        try {
            const scores: Record<string, number> = {};
            criteriaList.forEach(criteria => {
                const value = data[criteria.key];
                if (typeof value === 'number' && value > 0) {
                    scores[criteria.key] = value;
                }
            });

            await interviewsApi.createFeedback({
                interviewId,
                rating: selectedRating,
                strengths: data.strengths,
                weaknesses: data.weaknesses,
                notes: data.notes,
                recommendation: data.recommendation,
                scores: Object.keys(scores).length > 0 ? scores : undefined,
            });

            toast.success(t('interviews.feedbackSuccess', 'Feedback submitted successfully'));
            reset();
            setSelectedRating(0);
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Failed to submit feedback:', error);
            const errorMessage = error.response?.data?.message || 'Failed to submit feedback';
            toast.error(String(errorMessage));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const recommendations = [
        {
            value: 'STRONG_YES',
            label: 'Strong Hire',
            description: 'Exceptional candidate',
            color: 'bg-gradient-to-br from-green-500 to-green-600',
            hoverColor: 'hover:from-green-600 hover:to-green-700',
            icon: ThumbsUp
        },
        {
            value: 'YES',
            label: 'Hire',
            description: 'Good fit for role',
            color: 'bg-gradient-to-br from-green-400 to-green-500',
            hoverColor: 'hover:from-green-500 hover:to-green-600',
            icon: CheckCircle
        },
        {
            value: 'NO',
            label: 'No Hire',
            description: 'Not the right fit',
            color: 'bg-gradient-to-br from-red-400 to-red-500',
            hoverColor: 'hover:from-red-500 hover:to-red-600',
            icon: X
        },
        {
            value: 'STRONG_NO',
            label: 'Strong No Hire',
            description: 'Not recommended',
            color: 'bg-gradient-to-br from-red-500 to-red-600',
            hoverColor: 'hover:from-red-600 hover:to-red-700',
            icon: ThumbsDown
        },
    ];

    const StarRating = ({ value, onChange }: { value: number; onChange: (val: number) => void }) => {
        const [hovered, setHovered] = useState(0);
        return (
            <div className="flex gap-1 items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => onChange(star)}
                        onMouseEnter={() => setHovered(star)}
                        onMouseLeave={() => setHovered(0)}
                        className="transition-all duration-200 hover:scale-125"
                    >
                        <Star
                            size={18}
                            className={`transition-colors ${star <= (hovered || value)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-neutral-300 dark:text-neutral-600'
                                }`}
                        />
                    </button>
                ))}
                {value > 0 && (
                    <span className="ml-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400 min-w-[35px]">
                        {value}.0/5
                    </span>
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden animate-in fade-in zoom-in duration-300 border border-neutral-200 dark:border-neutral-800">
                {/* Header */}
                <div className="relative bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800 p-6 text-white">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-2xl font-bold mb-1">
                                Interview Feedback
                            </h2>
                            <p className="text-primary-100 text-sm">
                                Candidate: <span className="font-semibold">{candidateName}</span>
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-all"
                        >
                            <X size={22} />
                        </button>
                    </div>
                </div>

                {isLoadingCriteria ? (
                    <div className="p-12 flex justify-center items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                        <span className="ml-3 text-neutral-500">Loading scorecard criteria...</span>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto max-h-[calc(92vh-180px)]">
                        <div className="p-6 space-y-6">
                            {/* Overall Rating Section */}
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-xl p-6 border border-amber-200 dark:border-amber-800">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                                            Overall Rating
                                        </h3>
                                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                            How would you rate this candidate overall?
                                        </p>
                                    </div>
                                    <span className="text-sm font-medium text-red-600 dark:text-red-400">Required *</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setSelectedRating(star)}
                                            onMouseEnter={() => setHoveredRating(star)}
                                            onMouseLeave={() => setHoveredRating(0)}
                                            className="transition-all duration-200 hover:scale-110"
                                        >
                                            <Star
                                                size={48}
                                                className={`transition-all ${star <= (hoveredRating || selectedRating)
                                                    ? 'fill-amber-400 text-amber-400 drop-shadow-lg'
                                                    : 'text-neutral-300 dark:text-neutral-600'
                                                    }`}
                                            />
                                        </button>
                                    ))}
                                    {selectedRating > 0 && (
                                        <div className="ml-4 px-4 py-2 bg-white dark:bg-neutral-800 rounded-lg border border-amber-300 dark:border-amber-700">
                                            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                                                {selectedRating}.0
                                            </span>
                                            <span className="text-sm text-neutral-600 dark:text-neutral-400 ml-1">/ 5</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Scorecard Section */}
                            <div>
                                <div className="mb-4">
                                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                                        Evaluation Scorecard
                                    </h3>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                        Rate the candidate on key competencies
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {criteriaList.map((criteria) => {
                                        const Icon = criteria.icon;
                                        return (
                                            <div
                                                key={criteria.key}
                                                className="group bg-white dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md transition-all duration-200"
                                            >
                                                <div className="flex items-start gap-3 mb-3">
                                                    <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 transition-colors">
                                                        <Icon size={20} className="text-primary-600 dark:text-primary-400" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
                                                            {criteria.label}
                                                        </h4>
                                                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                                            {criteria.description}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Controller
                                                    name={criteria.key}
                                                    control={control}
                                                    render={({ field }) => (
                                                        <StarRating value={field.value || 0} onChange={field.onChange} />
                                                    )}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Recommendation Section */}
                            <div>
                                <div className="mb-4">
                                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                                        Hiring Recommendation
                                    </h3>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                        What is your final recommendation?
                                    </p>
                                </div>
                                <Controller
                                    name="recommendation"
                                    control={control}
                                    render={({ field }) => (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                            {recommendations.map((rec) => {
                                                const Icon = rec.icon;
                                                const isSelected = field.value === rec.value;
                                                return (
                                                    <button
                                                        key={rec.value}
                                                        type="button"
                                                        onClick={() => field.onChange(rec.value)}
                                                        className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${isSelected
                                                            ? `${rec.color} ${rec.hoverColor} border-transparent text-white shadow-lg scale-105`
                                                            : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 hover:shadow-md'
                                                            }`}
                                                    >
                                                        <Icon size={28} className={`mx-auto mb-2 ${isSelected ? '' : 'text-neutral-600 dark:text-neutral-400'}`} />
                                                        <div className={`text-sm font-semibold mb-1 ${isSelected ? '' : 'text-neutral-900 dark:text-white'}`}>
                                                            {rec.label}
                                                        </div>
                                                        <div className={`text-xs ${isSelected ? 'text-white/90' : 'text-neutral-500 dark:text-neutral-400'}`}>
                                                            {rec.description}
                                                        </div>
                                                        {isSelected && (
                                                            <div className="absolute -top-2 -right-2 bg-white dark:bg-neutral-900 rounded-full p-1 shadow-lg">
                                                                <CheckCircle size={20} className="text-green-500" />
                                                            </div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                />
                            </div>

                            {/* Detailed Feedback Section */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                                    Detailed Feedback
                                </h3>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {/* Strengths */}
                                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-xl p-5 border border-green-200 dark:border-green-800 shadow-sm">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="flex items-center justify-center w-8 h-8 bg-green-500 rounded-lg shadow-sm">
                                                <CheckCircle size={18} className="text-white" />
                                            </div>
                                            <label className="text-base font-semibold text-green-900 dark:text-green-100">
                                                Key Strengths
                                            </label>
                                        </div>
                                        <textarea
                                            className="w-full px-4 py-3 bg-white dark:bg-neutral-900 border border-green-300 dark:border-green-700 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all resize-none placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                                            rows={5}
                                            placeholder="What impressed you most about this candidate? Highlight their standout qualities and achievements..."
                                            {...register('strengths')}
                                        />
                                    </div>

                                    {/* Weaknesses */}
                                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10 rounded-xl p-5 border border-orange-200 dark:border-orange-800 shadow-sm">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="flex items-center justify-center w-8 h-8 bg-orange-500 rounded-lg shadow-sm">
                                                <Target size={18} className="text-white" />
                                            </div>
                                            <label className="text-base font-semibold text-orange-900 dark:text-orange-100">
                                                Areas for Development
                                            </label>
                                        </div>
                                        <textarea
                                            className="w-full px-4 py-3 bg-white dark:bg-neutral-900 border border-orange-300 dark:border-orange-700 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all resize-none placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                                            rows={5}
                                            placeholder="What areas need improvement? Identify skills or competencies that could be developed further..."
                                            {...register('weaknesses')}
                                        />
                                    </div>
                                </div>

                                {/* Additional Notes */}
                                <div className="bg-gradient-to-br from-primary-50 to-indigo-50 dark:from-primary-900/10 dark:to-indigo-900/10 rounded-xl p-5 border border-primary-200 dark:border-primary-800 shadow-sm">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="flex items-center justify-center w-8 h-8 bg-primary-500 rounded-lg shadow-sm">
                                            <MessageCircle size={18} className="text-white" />
                                        </div>
                                        <label className="text-base font-semibold text-primary-900 dark:text-primary-100">
                                            Additional Notes & Observations
                                        </label>
                                    </div>
                                    <textarea
                                        className="w-full px-4 py-3 bg-white dark:bg-neutral-900 border border-primary-300 dark:border-primary-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all resize-none placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                                        rows={4}
                                        placeholder="Share any other observations, specific examples, questions for the hiring team, or recommendations for next steps..."
                                        {...register('notes')}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="sticky bottom-0 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 p-6">
                            <div className="flex justify-between items-center">
                                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                    <span className="text-red-600 dark:text-red-400">*</span> Required fields must be completed
                                </p>
                                <div className="flex gap-3">
                                    <Button type="button" variant="secondary" onClick={onClose} className="px-6">
                                        Cancel
                                    </Button>
                                    <Button type="submit" isLoading={isSubmitting} className="px-8 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800">
                                        Submit Feedback
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
