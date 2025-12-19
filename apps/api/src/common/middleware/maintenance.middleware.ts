import { Injectable, NestMiddleware, ServiceUnavailableException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { SuperAdminSettingsService } from '../../modules/super-admin/services/super-admin-settings.service';

@Injectable()
export class MaintenanceMiddleware implements NestMiddleware {
    constructor(private readonly settingsService: SuperAdminSettingsService) { }

    async use(req: Request, res: Response, next: NextFunction) {
        // Allow super-admin routes to bypass maintenance mode
        if (req.originalUrl.includes('/api/v1/super-admin')) {
            return next();
        }

        const { enabled, message } = await this.settingsService.getMaintenanceMode();

        if (enabled) {
            throw new ServiceUnavailableException({
                statusCode: 503,
                message: message || 'System is currently undergoing maintenance. Please check back later.',
                error: 'Service Unavailable',
                maintenance: true,
            });
        }

        next();
    }
}
