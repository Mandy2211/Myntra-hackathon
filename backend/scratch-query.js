const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const queries = await prisma.searchQuery.findMany({ take: 10 });
  console.log(JSON.stringify(queries, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
