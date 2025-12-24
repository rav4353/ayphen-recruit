import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../../prisma/prisma.service";

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  type: string;
}

@Injectable()
export class SuperAdminJwtStrategy extends PassportStrategy(
  Strategy,
  "super-admin-jwt",
) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>("SUPER_ADMIN_JWT_SECRET") ||
        configService.get<string>("JWT_SECRET"),
    });
  }

  async validate(payload: JwtPayload) {
    // Verify this is a super admin token
    if (payload.type !== "super_admin" || payload.role !== "SUPER_ADMIN") {
      throw new UnauthorizedException("Invalid token type");
    }

    // Verify super admin still exists and is active
    const superAdmin = await this.prisma.$queryRaw<any[]>`
      SELECT id, email, name, status FROM super_admins WHERE id = ${payload.sub} LIMIT 1
    `;

    if (!superAdmin || superAdmin.length === 0) {
      throw new UnauthorizedException("Super admin not found");
    }

    const admin = superAdmin[0];

    if (admin.status !== "ACTIVE") {
      throw new UnauthorizedException("Account is not active");
    }

    return {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: "SUPER_ADMIN",
    };
  }
}
