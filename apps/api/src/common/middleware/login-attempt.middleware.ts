import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LoginAttemptMiddleware implements NestMiddleware {
    constructor(private readonly prisma: PrismaService) {}

    async use(req: Request, res: Response, next: NextFunction) {
        // Only apply to login endpoints
        if (!req.path.includes('/auth/login') || req.method !== 'POST') {
            return next();
        }

        const email = req.body?.email;
        const ip = req.ip || req.headers['x-forwarded-for'] as string;

        if (!email) {
            return next();
        }

        // Get max login attempts setting
        const maxAttemptsSetting = await this.prisma.globalSetting.findUnique({
            where: { key: 'max_login_attempts' },
        });
        const maxAttempts = (maxAttemptsSetting?.value as number) || 5;

        // Get lockout duration setting (in minutes)
        const lockoutSetting = await this.prisma.globalSetting.findUnique({
            where: { key: 'lockout_duration' },
        });
        const lockoutMinutes = (lockoutSetting?.value as number) || 30;

        // Check recent failed attempts
        const lockoutTime = new Date();
        lockoutTime.setMinutes(lockoutTime.getMinutes() - lockoutMinutes);

        const recentFailedAttempts = await this.prisma.loginAttempt.count({
            where: {
                email,
                success: false,
                createdAt: { gte: lockoutTime },
            },
        });

        if (recentFailedAttempts >= maxAttempts) {
            // Create a security alert
            await this.prisma.securityAlert.create({
                data: {
                    type: 'ACCOUNT_LOCKOUT',
                    severity: 'HIGH',
                    message: `Account locked due to ${recentFailedAttempts} failed login attempts`,
                    sourceIp: ip,
                    metadata: { email, attempts: recentFailedAttempts },
                    status: 'OPEN',
                },
            }).catch(() => {
                // Ignore if table doesn't exist
            });

            throw new ForbiddenException(
                `Account temporarily locked due to too many failed login attempts. Please try again in ${lockoutMinutes} minutes.`
            );
        }

        // Store original end function to intercept response
        const originalEnd = res.end;
        const prisma = this.prisma;
        const tenantId = req.body?.tenantId || 'unknown';
        
        res.end = function(this: Response, ...args: any[]) {
            // Log the attempt after response is sent
            const success = res.statusCode === 200 || res.statusCode === 201;
            
            // Fire and forget - don't block the response
            prisma.loginAttempt.create({
                data: {
                    email,
                    tenantId,
                    ipAddress: ip,
                    success,
                },
            }).catch(() => {
                // Ignore errors
            });

            return originalEnd.apply(this, args);
        };

        next();
    }
}
