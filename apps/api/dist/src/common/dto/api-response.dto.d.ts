export declare class PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}
export declare class ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
    meta?: PaginationMeta;
    errors?: string[];
    timestamp?: string;
    constructor(partial: Partial<ApiResponse<T>>);
    static success<T>(data: T, message?: string): ApiResponse<T>;
    static paginated<T>(data: T[], total: number, page: number, limit: number, message?: string): ApiResponse<T[]>;
    static error(message: string, errors?: string[]): ApiResponse<null>;
    static created<T>(data: T, message?: string): ApiResponse<T>;
    static updated<T>(data: T, message?: string): ApiResponse<T>;
    static deleted(message?: string): ApiResponse<null>;
}
