import { Controller, Get, Param, Req, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { EmailTrackingService } from './email-tracking.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/auth.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('email-tracking')
@Controller('email-tracking')
export class EmailTrackingController {
  constructor(private readonly trackingService: EmailTrackingService) {}

  /**
   * Track email opens via 1x1 pixel
   * Public endpoint - no auth required
   */
  @Public()
  @Get('pixel/:token.png')
  async trackOpen(
    @Param('token') token: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      // Decode token to get campaignId and candidateId
      const decoded = JSON.parse(
        Buffer.from(token, 'base64url').toString('utf-8'),
      );
      const { campaignId, candidateId } = decoded;

      // Record the open event
      await this.trackingService.recordEvent(
        campaignId,
        candidateId,
        'OPEN',
        {},
        req.ip,
        req.get('user-agent'),
      );
    } catch (error) {
      // Silently fail - don't break email rendering
      console.error('Failed to track email open:', error);
    }

    // Return a 1x1 transparent PNG
    const pixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64',
    );

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Length', pixel.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.send(pixel);
  }

  /**
   * Track link clicks and redirect
   * Public endpoint - no auth required
   */
  @Public()
  @Get('click/:token')
  async trackClick(
    @Param('token') token: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      // Get the tracking link
      const trackingLink = await this.trackingService.getTrackingLink(token);

      if (!trackingLink) {
        return res.status(404).send('Link not found');
      }

      // Extract campaignId and candidateId from query params or referer
      // For now, we'll need to pass candidateId in the URL
      const candidateId = req.query.cid as string;

      if (candidateId) {
        // Record the click event
        await this.trackingService.recordEvent(
          trackingLink.campaignId,
          candidateId,
          'CLICK',
          { url: trackingLink.originalUrl },
          req.ip,
          req.get('user-agent'),
        );
      }

      // Redirect to the original URL
      return res.redirect(302, trackingLink.originalUrl);
    } catch (error) {
      console.error('Failed to track click:', error);
      return res.status(500).send('Error processing click');
    }
  }

  /**
   * Track unsubscribe
   * Public endpoint - no auth required
   */
  @Public()
  @Get('unsubscribe/:campaignId/:candidateId')
  async trackUnsubscribe(
    @Param('campaignId') campaignId: string,
    @Param('candidateId') candidateId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      await this.trackingService.recordEvent(
        campaignId,
        candidateId,
        'UNSUBSCRIBE',
        {},
        req.ip,
        req.get('user-agent'),
      );

      // Return a simple unsubscribe confirmation page
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Unsubscribed</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                background: #f5f5f5;
              }
              .container {
                background: white;
                padding: 3rem;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                text-align: center;
                max-width: 400px;
              }
              h1 { color: #333; margin-bottom: 1rem; }
              p { color: #666; line-height: 1.6; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>✓ Unsubscribed</h1>
              <p>You have been successfully unsubscribed from this email campaign.</p>
              <p>You will no longer receive emails from this campaign.</p>
            </div>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Failed to track unsubscribe:', error);
      res.status(500).send('Error processing unsubscribe');
    }
  }

  /**
   * Get campaign analytics (authenticated)
   */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('analytics/:campaignId')
  @ApiOperation({ summary: 'Get campaign tracking analytics' })
  async getCampaignAnalytics(
    @Param('campaignId') campaignId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.trackingService.getCampaignAnalytics(campaignId, user.tenantId);
  }

  /**
   * Get recipient-level analytics (authenticated)
   */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('analytics/:campaignId/recipients')
  @ApiOperation({ summary: 'Get recipient-level analytics' })
  async getRecipientAnalytics(
    @Param('campaignId') campaignId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.trackingService.getRecipientAnalytics(campaignId, user.tenantId);
  }

  /**
   * Get click details (authenticated)
   */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('analytics/:campaignId/clicks')
  @ApiOperation({ summary: 'Get click details for campaign' })
  async getClickDetails(
    @Param('campaignId') campaignId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.trackingService.getClickDetails(campaignId, user.tenantId);
  }
}
