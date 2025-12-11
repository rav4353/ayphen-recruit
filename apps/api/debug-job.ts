
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('Checking job c674704d-2038-42da-9ba2-f2444bb63390...');
    try {
        const job = await prisma.job.findUnique({
            where: { id: 'c674704d-2038-42da-9ba2-f2444bb63390' }
        });
        console.log('Job found:', job);

        if (job) {
            const tenant = await prisma.tenant.findUnique({ where: { id: job.tenantId } });
            console.log('Tenant:', tenant);
        }
    } catch (error) {
        console.error('Error finding job:', error);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
