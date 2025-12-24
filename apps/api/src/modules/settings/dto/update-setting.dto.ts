import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateSettingDto {
  @ApiProperty({ description: "The value of the setting (JSON)" })
  @IsNotEmpty()
  value: any;

  @ApiProperty({
    description: "Category of the setting",
    required: false,
    default: "GENERAL",
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({
    description: "Whether the setting is public",
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
