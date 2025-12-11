export declare class InviteVendorDto {
    email: string;
    tenantId: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
}
export declare class AcceptVendorInviteDto {
    token: string;
    password: string;
    firstName: string;
    lastName: string;
}
