const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe('UPDATE "Product" SET "sellerId" = NULL, "remainingStock" = floor(random() * 91 + 10)::int, "source" = \'imported\'');
  console.log('Legacy updated.');
}

main().finally(() => prisma.$disconnect());
