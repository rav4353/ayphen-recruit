import { IsArray, IsString, IsIn } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class PublishJobDto {
  @ApiProperty({ example: ["LINKEDIN", "INTERNAL"] })
  @IsArray()
  @IsString({ each: true })
  @IsIn(["LINKEDIN", "INDEED", "INTERNAL", "ZIPRECRUITER"], { each: true })
  channels: string[];
}
