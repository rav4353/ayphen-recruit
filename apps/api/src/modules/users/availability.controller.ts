import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users/me/availability')
@UseGuards(JwtAuthGuard)
export class AvailabilityController {
    constructor(private readonly prisma: PrismaService) { }

    @Get()
    async getAvailability(@Request() req: any) {
        return this.prisma.availabilitySlot.findMany({
            where: { userId: req.user.id },
            orderBy: [
                { dayOfWeek: 'asc' },
                { startTime: 'asc' }
            ]
        });
    }

    @Put()
    async updateAvailability(
        @Request() req: any,
        @Body() body: { slots: { dayOfWeek: number; startTime: string; endTime: string }[] }
    ) {
        // Transaction to replace all slots
        return this.prisma.$transaction(async (tx) => {
            // 1. Delete existing slots
            await tx.availabilitySlot.deleteMany({
                where: { userId: req.user.id }
            });

            // 2. Create new slots
            if (body.slots && body.slots.length > 0) {
                await tx.availabilitySlot.createMany({
                    data: body.slots.map(slot => ({
                        userId: req.user.id,
                        dayOfWeek: slot.dayOfWeek,
                        startTime: slot.startTime,
                        endTime: slot.endTime
                    }))
                });
            }

            // 3. Return new slots
            return tx.availabilitySlot.findMany({
                where: { userId: req.user.id },
                orderBy: [
                    { dayOfWeek: 'asc' },
                    { startTime: 'asc' }
                ]
            });
        });
    }
}
