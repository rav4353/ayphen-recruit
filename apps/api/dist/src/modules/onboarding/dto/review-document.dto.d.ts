export declare enum ReviewAction {
    APPROVED = "APPROVED",
    REJECTED = "REJECTED"
}
export declare class ReviewDocumentDto {
    status: ReviewAction;
}
