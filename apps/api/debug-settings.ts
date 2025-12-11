
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Connecting to database...');
        const settings = await prisma.setting.findMany();
        console.log('Found', settings.length, 'settings.');
        if (settings.length > 0) {
            console.log('Settings:', JSON.stringify(settings, null, 2));
        } else {
            console.log('No settings found.');
        }

        // List all tenants to help ID check
        const tenants = await prisma.tenant.findMany();
        console.log('Tenants:', tenants.map(t => ({ id: t.id, name: t.name })));

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
