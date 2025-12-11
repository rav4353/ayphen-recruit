import { IsString, IsOptional, IsIn } from 'class-validator';

export class UpdatePreferencesDto {
  @IsOptional()
  @IsString()
  @IsIn(['light', 'dark', 'system', 'auto'])
  theme?: string;

  @IsOptional()
  @IsString()
  @IsIn(['en', 'es', 'fr', 'de', 'hi'])
  language?: string;
}

export class PreferencesResponseDto {
  theme: string;
  language: string;
}
