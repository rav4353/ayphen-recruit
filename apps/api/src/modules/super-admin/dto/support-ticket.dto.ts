import { IsString, IsNotEmpty, IsEnum, IsOptional, IsBoolean } from 'class-validator';

export enum TicketStatus {
    OPEN = 'open',
    IN_PROGRESS = 'in_progress',
    WAITING_RESPONSE = 'waiting_response',
    RESOLVED = 'resolved',
    CLOSED = 'closed',
}

export enum TicketPriority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    URGENT = 'urgent',
}

export class UpdateTicketStatusDto {
    @IsEnum(TicketStatus)
    @IsNotEmpty()
    status: TicketStatus;
}

export class AddTicketMessageDto {
    @IsString()
    @IsNotEmpty()
    content: string;

    @IsBoolean()
    @IsOptional()
    isInternal?: boolean;
}
