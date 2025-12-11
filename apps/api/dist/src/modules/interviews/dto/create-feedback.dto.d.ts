export declare enum FeedbackRecommendation {
    STRONG_YES = "STRONG_YES",
    YES = "YES",
    NO = "NO",
    STRONG_NO = "STRONG_NO"
}
export declare class CreateFeedbackDto {
    interviewId: string;
    rating: number;
    strengths?: string;
    weaknesses?: string;
    notes?: string;
    recommendation?: FeedbackRecommendation;
    scores?: Record<string, number>;
}
