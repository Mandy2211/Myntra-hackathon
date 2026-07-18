const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const all = await prisma.searchQuery.findMany({ select: { type: true, state: true, city: true } });
  console.log(all);
}
main();
