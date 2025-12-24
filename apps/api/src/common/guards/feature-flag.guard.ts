import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "../../prisma/prisma.service";

export const FEATURE_FLAG_KEY = "feature_flag";
export const RequireFeature = (flag: string) =>
  SetMetadata(FEATURE_FLAG_KEY, flag);

@Injectable()
export class FeatureFlagGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeature = this.reflector.getAllAndOverride<string>(
      FEATURE_FLAG_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no feature flag required, allow access
    if (!requiredFeature) {
      return true;
    }

    // Check if feature is enabled globally
    const featureSetting = await this.prisma.globalSetting.findUnique({
      where: { key: `feature_flag_${requiredFeature}` },
    });

    const isEnabled = featureSetting?.value === true;

    if (!isEnabled) {
      throw new ForbiddenException(
        `Feature '${requiredFeature}' is currently disabled`,
      );
    }

    return true;
  }
}
