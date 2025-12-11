export declare class CreateOfferDto {
    applicationId: string;
    templateId: string;
    content: string;
    salary: number;
    currency?: string;
    startDate: string;
    expiresAt?: string;
    bonus?: number;
    equity?: string;
    notes?: string;
}
export declare class UpdateOfferDto {
    content?: string;
    salary?: number;
    startDate?: string;
    expiresAt?: string;
}
