// Seeds monsoon/rainy inventory for a demo city so the weather shelf shows well.
// Idempotent: re-running deletes previous 'monsoon-seed-*' rows and re-inserts.
// Undo: node seed-monsoon.js --clear
require('dotenv').config({ quiet: true });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CITY = 'East Godavari';
const STATE = 'Andhra Pradesh';
const PIN = '533408';
const SELLER_EMAIL = 'johndoe@gmail.com';

// buckets: [search term, category-or-material filter, gender, how many]
const BUCKETS = [
  { term: 'umbrella', gender: null, take: 3 },      // accessories, unisex
  { term: 'raincoat', gender: null, take: 3 },
  { term: 'sweatshirt', gender: 'Women', take: 2 },
  { term: 'sweatshirt', gender: 'Men', take: 2 },
  { term: 'kurti', gender: 'Women', take: 3, material: 'Cotton' },
  { term: 'shirt', gender: 'Men', take: 2, material: 'Cotton' },
];

async function clear() {
  const del = await prisma.product.deleteMany({ where: { id: { startsWith: 'monsoon-seed-' } } });
  console.log(`[clear] removed ${del.count} monsoon-seed rows`);
}

async function main() {
  if (process.argv.includes('--clear')) {
    await clear();
    return;
  }

  const seller = await prisma.user.findUnique({ where: { email: SELLER_EMAIL } });
  if (!seller) throw new Error(`Seller ${SELLER_EMAIL} not found`);

  await clear(); // start fresh

  let n = 0;
  const created = [];
  for (const b of BUCKETS) {
    const where = {
      OR: [
        { name: { contains: b.term, mode: 'insensitive' } },
        { category: { contains: b.term, mode: 'insensitive' } },
      ],
      img: { not: '-' },
      NOT: { img: { contains: 'placehold' } },
    };
    if (b.gender) where.gender = { equals: b.gender, mode: 'insensitive' };
    const sources = await prisma.product.findMany({ where, take: b.take });

    for (const src of sources) {
      n++;
      const id = `monsoon-seed-${n}`;
      // First ~8 belong to the local seller; rest stay national (imported)
      const asSeller = n <= 8;
      created.push(await prisma.product.create({
        data: {
          id,
          name: src.name,
          img: src.img,
          price: src.price,
          mrp: src.mrp,
          rating: src.rating && src.rating > 0 ? src.rating : 4.3,
          ratingTotal: src.ratingTotal && src.ratingTotal > 0 ? src.ratingTotal : 18,
          discount: src.discount,
          gender: b.gender || src.gender || 'Unisex',
          category: src.category,
          macro_category: src.macro_category,
          material: b.material || src.material || 'Cotton',
          climate: 'Rainy',
          season: 'Monsoon',
          occasion: 'Casual',
          weather_priority: 100,
          festival_priority: 0,
          confidence: 0.95,
          status: 'Active',
          remainingStock: 25,
          city: CITY,
          state: STATE,
          pincode: PIN,
          source: asSeller ? 'seller' : 'imported',
          sellerId: asSeller ? seller.id : null,
        },
      }));
    }
  }

  const bySeller = created.filter(p => p.source === 'seller').length;
  console.log(`[seed] created ${created.length} monsoon products in ${CITY} (${bySeller} local seller, ${created.length - bySeller} national)`);
  const byGender = {};
  created.forEach(p => { byGender[p.gender] = (byGender[p.gender] || 0) + 1; });
  console.log('[seed] gender mix:', byGender);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
