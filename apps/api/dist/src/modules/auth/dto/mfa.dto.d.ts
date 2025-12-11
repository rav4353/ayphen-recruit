export declare class SetupMfaDto {
    code: string;
}
export declare class VerifyMfaDto {
    code: string;
    rememberDevice?: boolean;
}
export declare class DisableMfaDto {
    code: string;
    password: string;
}
export declare class MfaSetupResponse {
    otpauthUrl: string;
    secret: string;
    qrCode: string;
}
