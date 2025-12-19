import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StripeService {
    private stripe: Stripe | undefined;
    private readonly logger = new Logger(StripeService.name);

    constructor(
        private configService: ConfigService,
        private prisma: PrismaService,
    ) {
        const apiKey = this.configService.get<string>('STRIPE_SECRET_KEY');
        if (apiKey) {
            this.stripe = new Stripe(apiKey, {
                apiVersion: '2023-10-16' as any,
            });
        } else {
            this.logger.warn('STRIPE_SECRET_KEY is not defined. Stripe functionalities will be disabled.');
        }
    }

    private checkStripeConfig() {
        if (!this.stripe) {
            throw new InternalServerErrorException('Stripe is not configured. Please set STRIPE_SECRET_KEY in your environment variables.');
        }
        return this.stripe;
    }

    async createCustomer(email: string, name: string) {
        const stripe = this.checkStripeConfig();
        return stripe.customers.create({
            email,
            name,
        });
    }

    async getCustomer(customerId: string) {
        const stripe = this.checkStripeConfig();
        return stripe.customers.retrieve(customerId);
    }

    async createCheckoutSession(
        customerId: string,
        priceId: string,
        successUrl: string,
        cancelUrl: string,
    ) {
        const stripe = this.checkStripeConfig();
        return stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: successUrl,
            cancel_url: cancelUrl,
        });
    }

    async createPortalSession(customerId: string, returnUrl: string) {
        const stripe = this.checkStripeConfig();
        return stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: returnUrl,
        });
    }

    async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
        if (!this.stripe) return; // Silent return for webhooks if not configured? Or should we log?

        const inv = invoice as any;
        const customerId = typeof inv.customer === 'string' ? inv.customer : inv.customer?.id;
        const subscriptionId = typeof inv.subscription === 'string' ? inv.subscription : inv.subscription?.id;

        if (!customerId) {
            this.logger.error('No customer ID found in invoice');
            return;
        }

        // Find tenant by Stripe Customer ID
        const tenant = await this.prisma.tenant.findFirst({
            where: { stripeCustomerId: customerId },
        });

        if (!tenant) {
            this.logger.error(`Tenant not found for Stripe Customer ID: ${customerId}`);
            return;
        }

        // Find or create subscription
        const subscription = await this.prisma.subscription.findUnique({
            where: { tenantId: tenant.id },
        });

        if (subscription && inv.amount_paid > 0) {
            // Update subscription period
            await this.prisma.subscription.update({
                where: { id: subscription.id },
                data: {
                    status: 'ACTIVE',
                    currentPeriodStart: new Date(inv.period_start * 1000),
                    currentPeriodEnd: new Date(inv.period_end * 1000),
                    stripeSubscriptionId: subscriptionId,
                },
            });

            // Create Invoice Record
            await this.prisma.invoice.create({
                data: {
                    amount: inv.amount_paid,
                    currency: inv.currency,
                    status: inv.status || 'paid',
                    stripeInvoiceId: inv.id,
                    pdfUrl: inv.hosted_invoice_url || '',
                    periodStart: new Date(inv.period_start * 1000),
                    periodEnd: new Date(inv.period_end * 1000),
                    subscriptionId: subscription.id,
                },
            });

            // Create Payment Record
            if (inv.payment_intent) {
                const paymentIntentId = typeof inv.payment_intent === 'string' ? inv.payment_intent : inv.payment_intent.id;
                await this.prisma.payment.create({
                    data: {
                        amount: inv.amount_paid,
                        currency: inv.currency,
                        status: 'succeeded',
                        stripePaymentId: paymentIntentId,
                        subscriptionId: subscription.id,
                    }
                });
            }
        }
    }

    async handleSubscriptionUpdated(stripeSub: Stripe.Subscription) {
        if (!this.stripe) return;

        const sub = stripeSub as any;
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id;
        if (!customerId) return;

        const tenant = await this.prisma.tenant.findFirst({ where: { stripeCustomerId: customerId } });
        if (!tenant) return;

        await this.prisma.subscription.update({
            where: { tenantId: tenant.id },
            data: {
                status: sub.status === 'active' ? 'ACTIVE' : 'PAST_DUE', // Simplification
                currentPeriodEnd: new Date(sub.current_period_end * 1000),
                stripeSubscriptionId: sub.id,
            },
        });
    }

    async handleSubscriptionDeleted(stripeSub: Stripe.Subscription) {
        if (!this.stripe) return;

        const sub = stripeSub as any;
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id;
        if (!customerId) return;

        const tenant = await this.prisma.tenant.findFirst({ where: { stripeCustomerId: customerId } });
        if (!tenant) return;

        await this.prisma.subscription.update({
            where: { tenantId: tenant.id },
            data: {
                status: 'CANCELLED',
                cancelledAt: new Date(),
            },
        });
    }

    // Webhook construction helper
    constructEventFromPayload(signature: string, payload: Buffer) {
        const stripe = this.checkStripeConfig();
        const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
        if (!webhookSecret) throw new InternalServerErrorException('STRIPE_WEBHOOK_SECRET is not defined');
        return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    }
}
