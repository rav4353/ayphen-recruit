const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = 'ravanthsri20@gmail.com';

    const user = await prisma.user.findUnique({ where: { email_tenantId: { email, tenantId: 'd7b3e2a0-5c9f-4b1a-9d8e-3f2c1b0a6e5d' } } }); // Hardcoded tenantId from previous list-users output just in case, or findFirst

    if (!user) {
        console.log('User not found');
        return;
    }

    console.log('User Tenant:', user.tenantId);

    // We need to access the table dynamically if types are missing, usually mapped name
    // Map "scorecard_templates" -> scorecardTemplate

    try {
        const templates = await prisma.scorecardTemplate.findMany({
            where: { tenantId: user.tenantId }
        });
        console.log('Templates found:', templates);
    } catch (e) {
        console.error('Error querying scorecardTemplate:', e.message);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
