import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSavedViewDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    entity: string;

    @ApiProperty()
    @IsObject()
    filters: Record<string, any>;

    @ApiProperty()
    @IsBoolean()
    @IsOptional()
    isShared?: boolean;
}
