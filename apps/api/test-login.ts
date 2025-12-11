
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const email = process.argv[2];
    const password = process.argv[3];

    if (!email || !password) {
        console.log('Usage: npx ts-node test-login.ts <email> <password>');
        process.exit(1);
    }

    console.log(`Checking user: ${email}`);

    const users = await prisma.user.findMany({
        where: { email },
    });

    console.log(`Found ${users.length} users`);

    if (users.length === 0) {
        console.log('User not found');
        return;
    }

    const user = users[0];
    console.log(`User ID: ${user.id}`);
    console.log(`Tenant ID: ${user.tenantId}`);
    console.log(`Password Hash: ${user.passwordHash}`);

    if (!user.passwordHash) {
        console.log('No password hash stored');
        return;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    console.log(`Password valid: ${isValid}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
