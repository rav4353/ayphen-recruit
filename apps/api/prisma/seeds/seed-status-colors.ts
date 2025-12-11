import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_STATUS_COLORS = {
    job: {
        DRAFT: { bg: '#F3F4F6', text: '#374151' },
        OPEN: { bg: '#D1FAE5', text: '#065F46' },
        CLOSED: { bg: '#FEE2E2', text: '#991B1B' },
        ON_HOLD: { bg: '#FEF3C7', text: '#92400E' },
        PENDING_APPROVAL: { bg: '#DBEAFE', text: '#1E40AF' },
        APPROVED: { bg: '#E0E7FF', text: '#3730A3' },
        CANCELLED: { bg: '#F3F4F6', text: '#374151' },
    },
    application: {
        APPLIED: { bg: '#DBEAFE', text: '#1E40AF' },
        SCREENING: { bg: '#E0E7FF', text: '#3730A3' },
        PHONE_SCREEN: { bg: '#F3E8FF', text: '#6B21A8' },
        INTERVIEW: { bg: '#FAE8FF', text: '#86198F' },
        OFFER: { bg: '#D1FAE5', text: '#065F46' },
        HIRED: { bg: '#10B981', text: '#FFFFFF' },
        REJECTED: { bg: '#FEE2E2', text: '#991B1B' },
        WITHDRAWN: { bg: '#F3F4F6', text: '#374151' },
    },
};

async function main() {
    console.log('Seeding default status colors for all tenants...');

    // Get all tenants
    const tenants = await prisma.tenant.findMany();

    for (const tenant of tenants) {
        // Check if status_colors setting already exists
        const existing = await prisma.setting.findUnique({
            where: {
                tenantId_key: {
                    tenantId: tenant.id,
                    key: 'status_colors',
                },
            },
        });

        if (!existing) {
            // Create default status colors setting
            await prisma.setting.create({
                data: {
                    tenantId: tenant.id,
                    key: 'status_colors',
                    value: DEFAULT_STATUS_COLORS,
                    category: 'APPEARANCE',
                    isPublic: true,
                },
            });
            console.log(`✓ Created default status colors for tenant: ${tenant.name}`);
        } else {
            console.log(`- Status colors already exist for tenant: ${tenant.name}`);
        }
    }

    console.log('Seeding completed!');
}

main()
    .catch((e) => {
        console.error('Error seeding status colors:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
