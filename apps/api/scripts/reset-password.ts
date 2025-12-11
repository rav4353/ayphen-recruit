import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const email = 'manager@ayphen.com';
    const newPassword = 'Test@123';
    const saltRounds = 10;
    const hash = await bcrypt.hash(newPassword, saltRounds);

    console.log(`Resetting password for ${email} to ${newPassword}...`);

    const users = await prisma.user.findMany({ where: { email } });

    if (users.length === 0) {
        console.log(`User ${email} not found.`);
        return;
    }

    for (const user of users) {
        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash: hash,
                requirePasswordChange: false,
                tempPasswordExpiresAt: null,
                status: 'ACTIVE' // Ensure active
            }
        });
        console.log(`Updated password for user ${user.id} (Tenant: ${user.tenantId})`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
