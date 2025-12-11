import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty } from 'class-validator';

export class UpdateStageSlaDto {
    @ApiProperty({
        description: 'Maximum days allowed in this stage',
        example: 2,
        minimum: 1,
    })
    @IsNumber()
    @IsNotEmpty()
    slaDays: number;
}
