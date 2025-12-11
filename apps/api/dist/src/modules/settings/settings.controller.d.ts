import { SettingsService } from './settings.service';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { JwtPayload } from '../auth/auth.service';
export declare class SettingsController {
    private readonly settingsService;
    constructor(settingsService: SettingsService);
    findAll(user: JwtPayload): Promise<{
        id: string;
        key: string;
        value: import("@prisma/client/runtime/library").JsonValue;
        category: string;
        isPublic: boolean;
        updatedAt: Date;
        tenantId: string;
    }[]>;
    findPublic(tenantId: string): Promise<{
        id: string;
        key: string;
        value: import("@prisma/client/runtime/library").JsonValue;
        category: string;
        isPublic: boolean;
        updatedAt: Date;
        tenantId: string;
    }[]>;
    getStatusColors(user: JwtPayload): Promise<{
        data: import("@prisma/client/runtime/library").JsonValue | {
            job: {
                DRAFT: {
                    bg: string;
                    text: string;
                };
                OPEN: {
                    bg: string;
                    text: string;
                };
                CLOSED: {
                    bg: string;
                    text: string;
                };
                ON_HOLD: {
                    bg: string;
                    text: string;
                };
                PENDING_APPROVAL: {
                    bg: string;
                    text: string;
                };
                APPROVED: {
                    bg: string;
                    text: string;
                };
                CANCELLED: {
                    bg: string;
                    text: string;
                };
            };
            application: {
                APPLIED: {
                    bg: string;
                    text: string;
                };
                SCREENING: {
                    bg: string;
                    text: string;
                };
                PHONE_SCREEN: {
                    bg: string;
                    text: string;
                };
                INTERVIEW: {
                    bg: string;
                    text: string;
                };
                OFFER: {
                    bg: string;
                    text: string;
                };
                HIRED: {
                    bg: string;
                    text: string;
                };
                REJECTED: {
                    bg: string;
                    text: string;
                };
                WITHDRAWN: {
                    bg: string;
                    text: string;
                };
            };
        };
    }>;
    resetStatusColors(user: JwtPayload): Promise<{
        data: import("@prisma/client/runtime/library").JsonValue;
    }>;
    findOne(key: string, user: JwtPayload): Promise<{
        id: string;
        key: string;
        value: import("@prisma/client/runtime/library").JsonValue;
        category: string;
        isPublic: boolean;
        updatedAt: Date;
        tenantId: string;
    }>;
    update(key: string, updateSettingDto: UpdateSettingDto, user: JwtPayload): Promise<{
        id: string;
        key: string;
        value: import("@prisma/client/runtime/library").JsonValue;
        category: string;
        isPublic: boolean;
        updatedAt: Date;
        tenantId: string;
    }>;
    getScorecards(user: JwtPayload): Promise<any>;
    createScorecard(user: JwtPayload, body: any): Promise<any>;
    getScorecard(id: string): Promise<any>;
    updateScorecard(id: string, body: any): Promise<any>;
    deleteScorecard(id: string): Promise<any>;
}
