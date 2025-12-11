import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const email = 'manager@ayphen.com';
    const password = 'password123';

    console.log(`Verifying login for ${email}...`);

    const users = await prisma.user.findMany({ where: { email } });

    if (users.length === 0) {
        console.log('No user found');
        return;
    }

    for (const user of users) {
        console.log(`User: ${user.id}`);
        console.log(`Tenant: ${user.tenantId}`);
        console.log(`Status: ${user.status}`);
        console.log(`TempExpiry: ${user.tempPasswordExpiresAt}`);
        const valid = await bcrypt.compare(password, user.passwordHash || '');
        console.log(`Password Match: ${valid}`);
    }
}

main().finally(() => prisma.$disconnect());
