import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
declare const LocalStrategy_base: new (...args: any[]) => Strategy;
export declare class LocalStrategy extends LocalStrategy_base {
    private readonly authService;
    constructor(authService: AuthService);
    validate(req: {
        body: {
            tenantId: string;
        };
    }, email: string, password: string): Promise<{
        role: import("@prisma/client").$Enums.UserRole;
        email: string;
        id: string;
        updatedAt: Date;
        tenantId: string;
        title: string | null;
        firstName: string;
        lastName: string;
        phone: string | null;
        departmentId: string | null;
        customPermissions: string[];
        roleId: string | null;
        createdAt: Date;
        status: import("@prisma/client").$Enums.UserStatus;
        employeeId: string | null;
        passwordHash: string | null;
        avatar: string | null;
        lastLoginAt: Date | null;
        mfaEnabled: boolean;
        mfaSecret: string | null;
        requirePasswordChange: boolean;
        tempPasswordExpiresAt: Date | null;
        preferredTheme: string;
        preferredLanguage: string;
    }>;
}
export {};
