import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ApproveJobDto {
    @ApiProperty({ description: 'Comment for approval', required: false })
    @IsOptional()
    @IsString()
    comment?: string;
}
