import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckBiasDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    text: string;
}
