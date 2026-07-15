const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const c = await prisma.product.count({ where: { img: { not: '-' } } });
  console.log("Products with images:", c);
  const total = await prisma.product.count();
  console.log("Total products:", total);
}

run().finally(() => prisma.$disconnect());
