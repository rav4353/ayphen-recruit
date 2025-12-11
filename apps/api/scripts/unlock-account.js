const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = 'ravanthsri20@gmail.com';

    console.log(`Clearing login attempts for ${email}...`);

    const result = await prisma.loginAttempt.deleteMany({
        where: { email: email }
    });

    console.log(`Deleted ${result.count} login attempts.`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
