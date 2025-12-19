import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('Test login script starting...');
    const email = 'admin@ayphen.com';
    const password = 'password123';

    // 1. Find User by Email
    // Note: users are unique by email+tenantId, but let's just search by email to see what we find
    const users = await prisma.user.findMany({
        where: { email }
    });

    console.log(`Found ${users.length} users with email ${email}`);

    if (users.length === 0) {
        console.error('User not found!');
        return;
    }

    const user = users[0];
    console.log('User:', { id: user.id, email: user.email, hasPasswordHash: !!user.passwordHash, tenantId: user.tenantId });

    if (!user.passwordHash) {
        console.error('User has no password hash');
        return;
    }

    // 2. Check Password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    console.log(`Password '${password}' is valid: ${isValid}`);
}

main()
    .catch(e => {
        console.error('Error:', e);
    })
    .finally(() => prisma.$disconnect());
