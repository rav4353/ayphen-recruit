import { IsString, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateOnboardingDto {
  @ApiProperty({
    description: "ID of the application to streamline onboarding for",
  })
  @IsString()
  @IsNotEmpty()
  applicationId: string;
}
