export declare enum OtpType {
    LOGIN = "LOGIN",
    PASSWORD_RESET = "PASSWORD_RESET",
    EMAIL_VERIFY = "EMAIL_VERIFY"
}
export declare class RequestOtpDto {
    email: string;
    tenantId?: string;
    type?: OtpType;
}
export declare class VerifyOtpDto {
    email: string;
    tenantId?: string;
    code: string;
    type?: OtpType;
}
