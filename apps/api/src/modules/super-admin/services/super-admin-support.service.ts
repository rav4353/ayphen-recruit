import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpdateTicketStatusDto, AddTicketMessageDto } from '../dto/support-ticket.dto';
import { SuperAdminGateway } from '../super-admin.gateway';

@Injectable()
export class SuperAdminSupportService {
    constructor(
        private prisma: PrismaService,
        private gateway: SuperAdminGateway,
    ) { }

    async getAll(params: {
        page?: number;
        limit?: number;
        status?: string;
        priority?: string;
        search?: string;
    }) {
        const { page = 1, limit = 10, status, priority, search } = params;
        const skip = (page - 1) * limit;

        const where: any = {};

        if (status && status !== 'all') {
            where.status = status;
        }

        if (priority && priority !== 'all') {
            where.priority = priority;
        }

        if (search) {
            where.OR = [
                { subject: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { tenant: { name: { contains: search, mode: 'insensitive' } } },
                { user: { email: { contains: search, mode: 'insensitive' } } },
            ];
        }

        const [total, data] = await Promise.all([
            this.prisma.supportTicket.count({ where }),
            this.prisma.supportTicket.findMany({
                where,
                skip,
                take: limit,
                orderBy: { updatedAt: 'desc' },
                include: {
                    tenant: { select: { id: true, name: true } },
                    user: { select: { id: true, firstName: true, lastName: true, email: true } },
                    _count: { select: { messages: true } },
                },
            }),
        ]);

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getById(id: string) {
        const ticket = await this.prisma.supportTicket.findUnique({
            where: { id },
            include: {
                tenant: { select: { id: true, name: true } },
                user: { select: { id: true, firstName: true, lastName: true, email: true } },
                messages: {
                    orderBy: { createdAt: 'asc' },
                    include: {
                        sender: { select: { id: true, firstName: true, lastName: true, email: true } },
                        admin: { select: { id: true, name: true, email: true } },
                    },
                },
            },
        });

        if (!ticket) {
            throw new NotFoundException('Support ticket not found');
        }

        return ticket;
    }

    async updateStatus(id: string, dto: UpdateTicketStatusDto) {
        const ticket = await this.prisma.supportTicket.update({
            where: { id },
            data: { status: dto.status },
        });

        this.gateway.broadcast('ticket_status_changed', { ticketId: id, status: dto.status });
        return ticket;
    }

    async addMessage(id: string, dto: AddTicketMessageDto, senderId: string) {
        const ticket = await this.prisma.supportTicket.findUnique({ where: { id } });
        if (!ticket) {
            throw new NotFoundException('Support ticket not found');
        }

        // Add message
        const message = await this.prisma.supportTicketMessage.create({
            data: {
                ticketId: id,
                adminId: senderId, // Use adminId since this is called by super admin
                message: dto.content,
                isInternal: dto.isInternal ?? false,
            },
            include: {
                admin: { select: { id: true, name: true, email: true } },
            },
        });

        // Update ticket updated timestamp and status if needed
        // Assuming if admin replies, status might change to 'waiting_response' or similar logic can be added here or in controller
        // Update ticket updated timestamp
        await this.prisma.supportTicket.update({
            where: { id },
            data: { updatedAt: new Date() },
        });

        this.gateway.broadcast('new_ticket_message', { ticketId: id, message });
        return message;
    }
}
