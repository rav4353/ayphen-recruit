import { PrismaService } from '../../prisma/prisma.service';
export declare class AvailabilityController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getAvailability(req: any): Promise<{
        id: string;
        userId: string;
        dayOfWeek: number;
        startTime: string;
        endTime: string;
    }[]>;
    updateAvailability(req: any, body: {
        slots: {
            dayOfWeek: number;
            startTime: string;
            endTime: string;
        }[];
    }): Promise<{
        id: string;
        userId: string;
        dayOfWeek: number;
        startTime: string;
        endTime: string;
    }[]>;
}
