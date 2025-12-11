const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    const email = 'ravanthsri20@gmail.com';
    const password = 'Test@123';

    // Find default tenant
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
        console.error('No tenant found');
        return;
    }

    // Check if user exists first to avoid error
    const existing = await prisma.user.findFirst({
        where: { email }
    });

    if (existing) {
        console.log('User already exists:', existing.email);
        return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
        data: {
            email,
            firstName: 'Ravanth',
            lastName: 'User',
            passwordHash,
            role: 'ADMIN',
            status: 'ACTIVE',
            tenantId: tenant.id
        }
    });
    console.log('Successfully created user:', user.email);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
