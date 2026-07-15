const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

const prisma = new PrismaClient();
const csvPath = path.join(__dirname, 'data', 'products_enriched.csv');

async function main() {
  console.log('Clearing old purchases and products from database...');
  await prisma.purchase.deleteMany();
  await prisma.product.deleteMany();

  const products = [];
  
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
        console.log(`Inserted ${i + batch.length} / ${products.length}`);
      }
      console.log('Ingestion completed successfully.');
      await prisma.$disconnect();
    });
}

main().catch(console.error);
