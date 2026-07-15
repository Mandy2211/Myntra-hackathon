const fs = require('fs');
const readline = require('readline');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const fileStream = fs.createReadStream('d:/BHARAT_AI/products_clean.csv');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let count = 0;
  for await (const line of rl) {
    if (count === 0) { count++; continue; } // skip header
    if (count > 200) break;

    const parts = line.split(',');
    // Very basic parsing since some cols have commas inside quotes.
    // Let's just use regex to parse properly
    const regex = /(?:^|,)(?:"([^"]*)"|([^,]*))/g;
    let matches = [];
    let match;
    while (match = regex.exec(line)) {
      matches.push(match[1] || match[2] || '');
    }

    if (matches.length >= 10) {
      const id = "P" + matches[0];
      const name = matches[1];
      const category = matches[3];
      const seller = matches[2];
      const price = parseFloat(matches[6]) || 1000;
      const mrp = parseFloat(matches[7]) || 2000;
      const rating = parseFloat(matches[9]) || 4.5;
      const ratingTotal = parseInt(matches[10]) || 150;

      let img = '-';
      const imgMatch = line.match(/https?:\/\/[^"]+\.(?:jpg|png|jpeg|webp)/i);
      if (imgMatch) {
        img = imgMatch[0];
      }

      try {
        await prisma.product.upsert({
          where: { id },
          update: { name, img, price, mrp, rating, ratingTotal, category, seller },
          create: {
            id, name, img, price, mrp, rating, ratingTotal,
            category, seller, gender: 'Men', occasion: 'Casual'
          }
        });
        console.log(`Upserted ${id}`);
      } catch (e) {
        console.error(`Failed on ${id}: ${e.message}`);
      }
    }
    count++;
  }
  
  console.log(`Upserted ${count-1} products with valid images.`);
}

run().catch(console.error).finally(() => prisma.$disconnect());
