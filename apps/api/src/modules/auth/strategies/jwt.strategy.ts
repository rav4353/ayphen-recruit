import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../auth.service';
import { UsersService } from '../../users/users.service';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    try {
      const user = await this.usersService.findById(payload.sub);
      if (!user || user.status !== 'ACTIVE') {
        throw new UnauthorizedException('User not found or inactive');
      }

      // CRITICAL: Check tenant status - block suspended/inactive tenants
      if (payload.tenantId) {
        const tenant = await this.prisma.tenant.findUnique({
          where: { id: payload.tenantId },
          select: { status: true },
        });

        if (!tenant) {
          throw new ForbiddenException('Organization not found');
        }

        // Check tenant status (stored as string in DB)
        const tenantStatus = (tenant as any).status;
        if (tenantStatus === 'SUSPENDED') {
          throw new ForbiddenException('Your organization has been suspended. Please contact support.');
        }
        if (tenantStatus === 'INACTIVE' || tenantStatus === 'DELETED') {
          throw new ForbiddenException('Your organization is no longer active. Please contact support.');
        }
      }

      return {
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
        tenantId: payload.tenantId,
        permissions: payload.permissions,
      };
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new UnauthorizedException('User not found or inactive');
    }
  }
}
