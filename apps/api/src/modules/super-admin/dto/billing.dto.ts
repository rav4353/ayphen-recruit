import { IsString, IsNotEmpty, IsArray, IsOptional } from "class-validator";

export class CreateApiKeyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @IsString({ each: true })
  scopes: string[];
}
