import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PERMISSIONS_KEY } from "../decorators/permissions.decorator";
import {
  Permission,
  ROLE_PERMISSIONS,
} from "../../../common/constants/permissions";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || (!user.role && !user.permissions)) {
      throw new ForbiddenException("User role or permissions not defined");
    }

    // Use permissions from JWT payload if available (handles dynamic roles & overrides)
    // Fallback to static role map if permissions array is missing (backward compatibility)
    const userPermissions: string[] =
      user.permissions ||
      ROLE_PERMISSIONS[user.role as keyof typeof ROLE_PERMISSIONS] ||
      [];

    // Check if user has ALL required permissions
    const hasAllPermissions = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException("Insufficient permissions");
    }

    return true;
  }
}
