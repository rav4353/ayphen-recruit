import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOfferTemplateDto {
    @ApiProperty({ example: 'Standard Offer' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: '<p>Dear {{CandidateName}}, ...</p>' })
    @IsString()
    @IsNotEmpty()
    content: string;
}

export class UpdateOfferTemplateDto {
    @ApiProperty({ example: 'Standard Offer', required: false })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiProperty({ example: '<p>Dear {{CandidateName}}, ...</p>', required: false })
    @IsString()
    @IsOptional()
    content?: string;
}
