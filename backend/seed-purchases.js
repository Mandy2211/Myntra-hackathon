const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  const products = await prisma.product.findMany({ 
    where: { img: { not: '-' }, id: { startsWith: 'P' } },
    take: 50 
  });
  if (products.length === 0) {
    console.log("No products found to seed purchases.");
    return;
  }

  const cities = [
    { city: 'Lucknow', state: 'Uttar Pradesh' },
    { city: 'Kanpur', state: 'Uttar Pradesh' },
    { city: 'Varanasi', state: 'Uttar Pradesh' },
    { city: 'Coimbatore', state: 'Tamil Nadu' },
    { city: 'Chennai', state: 'Tamil Nadu' }
  ];

  let count = 0;
  for (let i = 0; i < 100; i++) {
    const p = products[Math.floor(Math.random() * products.length)];
    const c = cities[Math.floor(Math.random() * cities.length)];
    await prisma.purchase.create({
      data: {
        cityName: c.city,
        stateName: c.state,
        Product: { connect: { id: p.id } }
      }
    });
    count++;
  }
  console.log(`Seeded ${count} purchases.`);
}

seed().catch(console.error).finally(() => prisma.$disconnect());
