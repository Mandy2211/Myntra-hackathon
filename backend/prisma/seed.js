const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

const prisma = new PrismaClient();
const csvPath = path.join(__dirname, '..', 'data', 'products_enriched.csv');

const CITIES = [
  { cityName: 'Coimbatore', climate: 'Hot', activeFestival: 'Pongal' },
  { cityName: 'Patna', climate: 'Hot', activeFestival: 'Chhath Puja' },
  { cityName: 'Vizag', climate: 'Rainy', activeFestival: 'Ugadi' },
  { cityName: 'Belgaum', climate: 'Cold', activeFestival: 'Ganesh Chaturthi' },
  { cityName: 'New Delhi', climate: 'Cold', activeFestival: 'Diwali' }
];

async function main() {
  console.log('Seeding database from products_enriched.csv...');

  // 1. Clean existing database records
  await prisma.purchase.deleteMany();
  await prisma.cityContext.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  console.log('Cleared stale database tables.');

  // 2. Seed Cities Context (optional, for dropdown mapping or specific logic)
  for (const city of CITIES) {
    await prisma.cityContext.create({ 
      data: {
        cityName: city.cityName,
        climate: city.climate,
        activeFestival: city.activeFestival,
        preferredTags: []
      }
    });
  }
  console.log(`Seeded ${CITIES.length} cities.`);

  // 3. Ingest Products from CSV
  const products = [];
  
  await new Promise((resolve, reject) => {
    console.log('Reading CSV...');
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        products.push({
          id: row.id,
          name: row.name,
          img: row.img,
          asin: row.asin,
          price: parseFloat(row.price) || 0,
          mrp: parseFloat(row.mrp) || 0,
          rating: parseFloat(row.rating) || 0,
          ratingTotal: parseInt(row.ratingTotal) || 0,
          discount: row.discount,
          seller: row.seller,
          purl: row.purl,
          gender: row.gender,
          category: row.category,
          macro_category: row.macro_category,
          material: row.material,
          occasion: row.occasion,
          season: row.season,
          climate: row.climate,
          ethnic_style: row.ethnic_style,
          price_segment: row.price_segment,
          weather_priority: parseInt(row.weather_priority) || 0,
          festival_priority: parseInt(row.festival_priority) || 0,
          confidence: parseFloat(row.confidence) || 0
        });
      })
      .on('end', async () => {
        console.log(`Parsed ${products.length} products. Inserting...`);
        const BATCH_SIZE = 1000;
        for (let i = 0; i < products.length; i += BATCH_SIZE) {
          const batch = products.slice(i, i + BATCH_SIZE);
          await prisma.product.createMany({
            data: batch,
            skipDuplicates: true
          });
        }
        console.log('Ingestion completed successfully.');
        resolve();
      })
      .on('error', reject);
  });
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
