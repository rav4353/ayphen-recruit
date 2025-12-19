import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Super Admin...');

  const email = 'superadmin@ayphen.com';
  const password = 'password123';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const superAdmin = await prisma.superAdmin.upsert({
    where: { email },
    update: {
      passwordHash, // Update password if exists
      status: 'ACTIVE',
    },
    create: {
      email,
      name: 'Super Admin',
      passwordHash,
      status: 'ACTIVE',
      mfaEnabled: false,
    },
  });

  console.log(`✅ Super Admin created/updated:`);
  console.log(`   Email: ${superAdmin.email}`);
  console.log(`   Password: ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
