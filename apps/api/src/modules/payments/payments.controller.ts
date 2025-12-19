import { Controller, Post, Body, UseGuards, Req, BadRequestException, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StripeService } from './stripe.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/auth.service';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
    constructor(
        private readonly stripeService: StripeService,
        private readonly prisma: PrismaService,
    ) { }

    @Get('subscription')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current subscription' })
    async getSubscription(@CurrentUser() user: JwtPayload) {
        const subscription = await this.prisma.subscription.findUnique({
            where: { tenantId: user.tenantId },
            include: { plan: true },
        });
        return { success: true, data: subscription };
    }

    @Get('invoices')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get invoices history' })
    async getInvoices(@CurrentUser() user: JwtPayload) {
        const subscription = await this.prisma.subscription.findUnique({
            where: { tenantId: user.tenantId },
        });

        if (!subscription) return { success: true, data: [] };

        const invoices = await this.prisma.invoice.findMany({
            where: { subscriptionId: subscription.id },
            orderBy: { createdAt: 'desc' },
        });
        return { success: true, data: invoices };
    }

    @Post('checkout')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create checkout session for subscription' })
    async createCheckoutSession(
        @CurrentUser() user: JwtPayload,
        @Body('priceId') priceId: string,
    ) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: user.tenantId },
        });

        if (!tenant) throw new BadRequestException('Tenant not found');

        let customerId = tenant.stripeCustomerId;

        if (!customerId) {
            const customer = await this.stripeService.createCustomer(user.email, tenant.name);
            customerId = customer.id;
            await this.prisma.tenant.update({
                where: { id: tenant.id },
                data: { stripeCustomerId: customerId },
            });
        }

        // Usually constructed from frontend URL env var
        const domain = process.env.FRONTEND_URL || 'http://localhost:3000';

        const session = await this.stripeService.createCheckoutSession(
            customerId,
            priceId,
            `${domain}/settings/billing?success=true`,
            `${domain}/settings/billing?canceled=true`,
        );

        return { url: session.url };
    }

    @Post('portal')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create customer portal session' })
    async createPortalSession(@CurrentUser() user: JwtPayload) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: user.tenantId },
        });

        if (!tenant || !tenant.stripeCustomerId) {
            throw new BadRequestException('No billing account found');
        }

        const domain = process.env.FRONTEND_URL || 'http://localhost:3000';
        const session = await this.stripeService.createPortalSession(
            tenant.stripeCustomerId,
            `${domain}/settings/billing`,
        );

        return { url: session.url };
    }

    @Post('webhook')
    @ApiOperation({ summary: 'Stripe Webhook Handler' })
    async handleWebhook(@Req() req: any) {
        const signature = req.headers['stripe-signature'];
        if (!signature) throw new BadRequestException('Missing stripe-signature header');

        const rawBody = req.rawBody;
        if (!rawBody) throw new BadRequestException('Raw body not found, ensure middleware is configured');

        let event;
        try {
            event = this.stripeService.constructEventFromPayload(signature, rawBody);
        } catch (err: any) {
            throw new BadRequestException(`Webhook Error: ${err.message}`);
        }

        switch (event.type) {
            case 'invoice.payment_succeeded':
                await this.stripeService.handleInvoicePaymentSucceeded(event.data.object as any);
                break;
            case 'customer.subscription.updated':
                await this.stripeService.handleSubscriptionUpdated(event.data.object as any);
                break;
            case 'customer.subscription.deleted':
                await this.stripeService.handleSubscriptionDeleted(event.data.object as any);
                break;
            default:
            // console.log(`Unhandled event type ${event.type}`);
        }

        return { received: true };
    }
}
