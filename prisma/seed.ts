import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123456';

async function main() {
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  await prisma.user.upsert({
    where: { username: ADMIN_USERNAME },
    update: { passwordHash: hash, role: 'ADMIN' },
    create: {
      role: 'ADMIN',
      username: ADMIN_USERNAME,
      passwordHash: hash
    }
  });

  console.log('Seed finished.');
  console.log(`Admin username: ${ADMIN_USERNAME}`);
  console.log(`Admin password: ${ADMIN_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
