import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDateString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOfferDto {
    @ApiProperty({ example: 'uuid-application-id' })
    @IsUUID()
    @IsNotEmpty()
    applicationId: string;

    @ApiProperty({ example: 'uuid-template-id' })
    @IsUUID()
    @IsNotEmpty()
    templateId: string;

    @ApiProperty({ example: '<p>Offer content...</p>' })
    @IsString()
    @IsNotEmpty()
    content: string;

    @ApiProperty({ example: 100000 })
    @IsNumber()
    @IsNotEmpty()
    salary: number;

    @ApiProperty({ example: 'USD', required: false })
    @IsString()
    @IsOptional()
    currency?: string;

    @ApiProperty({ example: '2025-01-01' })
    @IsDateString()
    @IsNotEmpty()
    startDate: string;

    @ApiProperty({ example: '2025-01-10', required: false })
    @IsDateString()
    @IsOptional()
    expiresAt?: string;

    @ApiProperty({ example: 5000, required: false })
    @IsNumber()
    @IsOptional()
    bonus?: number;

    @ApiProperty({ example: '0.1%', required: false })
    @IsString()
    @IsOptional()
    equity?: string;

    @ApiProperty({ example: 'Notes...', required: false })
    @IsString()
    @IsOptional()
    notes?: string;
}

export class UpdateOfferDto {
    @ApiProperty({ example: '<p>Updated content...</p>', required: false })
    @IsString()
    @IsOptional()
    content?: string;

    @ApiProperty({ example: 110000, required: false })
    @IsNumber()
    @IsOptional()
    salary?: number;

    @ApiProperty({ example: '2025-01-01', required: false })
    @IsDateString()
    @IsOptional()
    startDate?: string;

    @ApiProperty({ example: '2025-01-10', required: false })
    @IsDateString()
    @IsOptional()
    expiresAt?: string;
}
