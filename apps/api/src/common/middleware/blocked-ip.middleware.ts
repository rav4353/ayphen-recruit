import { Injectable, NestMiddleware, ForbiddenException } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class BlockedIpMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const ip = req.ip || (req.headers["x-forwarded-for"] as string);

    if (ip) {
      const blocked = await this.prisma.blockedIp.findUnique({
        where: { ipAddress: ip },
      });

      if (blocked) {
        // Option to check expiration if added to schema, but currently blocked_ips is permanent until deleted
        throw new ForbiddenException(
          "Your IP address has been blocked for security reasons.",
        );
      }
    }

    next();
  }
}
