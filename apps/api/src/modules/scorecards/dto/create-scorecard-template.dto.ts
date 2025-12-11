import { IsString, IsNotEmpty, IsArray, IsOptional, IsBoolean } from 'class-validator';

export class CreateScorecardTemplateDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsArray()
    @IsNotEmpty()
    sections: any[];

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
