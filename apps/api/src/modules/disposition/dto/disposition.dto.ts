import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export class RecordDispositionDto {
    @ApiProperty({
        description: 'Application ID',
        example: 'app-123',
    })
    @IsString()
    @IsNotEmpty()
    applicationId: string;

    @ApiProperty({
        description: 'Disposition type',
        enum: ['REJECTION', 'WITHDRAWAL'],
        example: 'REJECTION',
    })
    @IsEnum(['REJECTION', 'WITHDRAWAL'])
    @IsNotEmpty()
    type: 'REJECTION' | 'WITHDRAWAL';

    @ApiProperty({
        description: 'Reason for disposition',
        example: 'Not a skill fit',
    })
    @IsString()
    @IsNotEmpty()
    reason: string;

    @ApiProperty({
        description: 'Additional notes (optional)',
        example: 'Candidate lacks required Python experience',
        required: false,
    })
    @IsString()
    @IsOptional()
    notes?: string;
}
