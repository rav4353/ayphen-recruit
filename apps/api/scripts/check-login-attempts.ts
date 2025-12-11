import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const attempts = await prisma.loginAttempt.findMany({
        where: { email: 'manager@ayphen.com' },
        orderBy: { createdAt: 'desc' },
        take: 5
    });
    console.log(attempts);
}

main().finally(() => prisma.$disconnect());
