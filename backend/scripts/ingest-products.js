const fs = require('fs');
const readline = require('readline');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const path = require('path');

const CSV_FILE = path.join(__dirname, '../data/myntra202305041052.csv');

// --- Keyword Dictionaries ---

const GENDER_MAP = {
  male: 'Men', men: 'Men', mens: 'Men', boy: 'Men', boys: 'Men',
  female: 'Women', women: 'Women', womens: 'Women', girl: 'Women', girls: 'Women', ladies: 'Women',
  kid: 'Kids', kids: 'Kids', baby: 'Kids', toddler: 'Kids'
};

const CATEGORY_MAP = [
  'shirt', 'tshirt', 'tee', 'jeans', 'trouser', 'trousers', 'pant', 'pants', 'track pant', 'trackpants', 
  'shorts', 'cargo', 'hoodie', 'sweatshirt', 'jacket', 'blazer', 'coat', 'dress', 'gown', 'kurta', 'kurti', 
  'lehenga', 'blouse', 'dupatta', 'saree', 'kanjeevaram', 'banarasi', 'skirt', 'top', 'crop top', 'shrug',
  'accessories', 'shoes', 'bags', 'bag', 'jewellery', 'watch', 'wallet', 'coat', 'jacket', 'puffer',
  'face wash', 'facewash', 'cream', 'serum', 'lotion', 'lipstick', 'makeup', 'skincare', 'hair', 'shampoo',
  'trimmer', 'dryer', 'straightener', 'epilator', 'shaver',
  'carpet', 'pillow', 'bedsheet', 'blanket', 'cushion', 'curtain', 'towel', 'rug', 'dohar',
  'sharara', 'nehru', 'churidar', 'moisturizer', 'moisturiser', 'backpack', 'pouch', 'carry bag',
  'ballerinas', 'heels', 'flats', 'sandals', 'sneakers', 'boots', 'slippers', 'footwear'
];

const MACRO_MAP = {
  'Skincare & Face Care': ['face', 'facewash', 'cream', 'serum', 'lotion', 'lipstick', 'makeup', 'skincare', 'hair', 'shampoo', 'conditioner', 'moisturizer', 'moisturiser'],
  'Electrical Appliances': ['trimmer', 'dryer', 'straightener', 'epilator', 'shaver', 'appliance', 'iron'],
  'Accessories': ['bags', 'bag', 'jewellery', 'watch', 'wallet', 'sunglass', 'belt', 'cap', 'hat', 'backpack', 'pouch', 'carry bag'],
  'Home Furnishing': ['carpet', 'pillow', 'bedsheet', 'blanket', 'cushion', 'curtain', 'towel', 'rug', 'dohar'],
  'Footwear': ['shoes', 'ballerinas', 'heels', 'flats', 'sandals', 'sneakers', 'boots', 'slippers', 'footwear', 'crocs', 'shoe']
};

const MATERIAL_MAP = [
  'cotton', 'linen', 'silk', 'kanjeevaram silk', 'banarasi silk', 'georgette', 'chiffon', 'crepe', 
  'rayon', 'polyester', 'denim', 'leather', 'wool'
];

const OCCASION_MAP = {
  festival: ['kurta', 'kurti', 'lehenga', 'dupatta', 'saree', 'kanjeevaram', 'banarasi', 'ethnic', 'sharara', 'nehru', 'churidar'],
  formal: ['blazer', 'formal', 'coat', 'trouser'],
  sports: ['running', 'gym', 'training', 'track pant']
};

const SEASON_MAP = {
  summer: ['cotton', 'linen', 'shorts'],
  winter: ['hoodie', 'sweater', 'jacket', 'coat', 'wool', 'puffer'],
  monsoon: ['raincoat', 'quick dry', 'waterproof']
};

const CLIMATE_MAP = {
  hot: ['cotton', 'linen', 'summer'],
  cold: ['hoodie', 'sweater', 'wool', 'puffer', 'jacket', 'coat', 'winter', 'leather'],
  rainy: ['raincoat', 'waterproof', 'quick dry', 'monsoon']
};

// --- Helper Extractors ---

function extractGender(nameWords, purl = '') {
  // Try purl first as it usually explicitly says -women- or -men- or /women/
  const pLink = purl.toLowerCase();
  if (pLink.includes('/men-') || pLink.includes('-men-')) return 'Men';
  if (pLink.includes('/women-') || pLink.includes('-women-')) return 'Women';
  if (pLink.includes('-kids-') || pLink.includes('/kids-')) return 'Kids';
  if (pLink.includes('-boys-') || pLink.includes('/boys-')) return 'Kids';
  if (pLink.includes('-girls-') || pLink.includes('/girls-')) return 'Kids';
  
  for (let w of nameWords) {
    if (w in GENDER_MAP) return GENDER_MAP[w];
  }
  return 'Unisex';
}

function extractCategory(nameStr) {
  for (let cat of CATEGORY_MAP) {
    if (nameStr.includes(cat)) {
      return cat.split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
    }
  }
  return 'Other';
}

function extractMacroCategory(nameStr) {
  for (const [macro, keywords] of Object.entries(MACRO_MAP)) {
    for (let word of keywords) {
      if (nameStr.includes(word)) return macro;
    }
  }
  return 'Clothing'; // Default most dominant category
}

function extractClimate(nameStr) {
  for (let word of CLIMATE_MAP.hot) {
    if (nameStr.includes(word)) return 'Hot';
  }
  for (let word of CLIMATE_MAP.cold) {
    if (nameStr.includes(word)) return 'Cold';
  }
  for (let word of CLIMATE_MAP.rainy) {
    if (nameStr.includes(word)) return 'Rainy';
  }
  return 'Neutral';
}

function extractMaterial(nameStr) {
  for (let mat of MATERIAL_MAP) {
    if (nameStr.includes(mat)) {
      return mat.charAt(0).toUpperCase() + mat.slice(1);
    }
  }
  return 'Unknown';
}

function extractOccasion(nameStr) {
  for (let word of OCCASION_MAP.festival) {
    if (nameStr.includes(word)) return 'Festival';
  }
  for (let word of OCCASION_MAP.formal) {
    if (nameStr.includes(word)) return 'Formal';
  }
  for (let word of OCCASION_MAP.sports) {
    if (nameStr.includes(word)) return 'Sports';
  }
  return 'Casual';
}

function extractSeason(nameStr) {
  for (let word of SEASON_MAP.summer) {
    if (nameStr.includes(word)) return 'Summer';
  }
  for (let word of SEASON_MAP.winter) {
    if (nameStr.includes(word)) return 'Winter';
  }
  for (let word of SEASON_MAP.monsoon) {
    if (nameStr.includes(word)) return 'Monsoon';
  }
  return 'All Season';
}

const csv = require('csv-parser');

async function run() {
  console.log('Clearing DB...');
  await prisma.productContext.deleteMany();
  await prisma.product.deleteMany();

  console.log('Parsing CSV & Inserting...');

  let batchProducts = [];
  let batchContexts = [];
  let count = 0;

  await new Promise((resolve, reject) => {
    fs.createReadStream(CSV_FILE)
      .pipe(csv())
      .on('data', (row) => {
        if (count >= 15000) return; // Increased local dev MVP limit to get richer arrays
        
        try {
          const id = row['id'];
          const name = row['name'] || '';
          
          // Image parsing: handle multiple links separated by ';' or newlines
          let rawImg = row['img'] || '';
          if (rawImg === '-') rawImg = '';
          const img = rawImg ? rawImg.split(/[;\n]/)[0].trim() : '';

          const asin = row['asin'] || '';
          const price = parseFloat(row['price']) || 0;
          const mrp = parseFloat(row['mrp']) || 0;
          const rating = parseFloat(row['rating']) || 0;
          const ratingTotal = parseInt(row['ratingTotal'], 10) || 0;
          const discount = row['discount'] || '';
          const seller = row['seller'] || '';
          const purl = row['purl'] || '';

          if (!id) return; // skip invalid rows

          batchProducts.push({
            id, name, img, asin, price, mrp, rating, ratingTotal, discount, seller, purl,
            remainingStock: Math.floor(Math.random() * 50) + 10
          });

          // Extract metadata
          const nameStr = name.toLowerCase();
          const nameWords = nameStr.split(/\s+/).map(w => w.replace(/[^a-z0-9]/gi, ''));

          batchContexts.push({
            product_id: id,
            gender_category: extractGender(nameWords, purl),
            category: extractCategory(nameStr),
            macro_category: extractMacroCategory(nameStr),
            material: extractMaterial(nameStr),
            occasion: extractOccasion(nameStr),
            season: extractSeason(nameStr),
            climate: extractClimate(nameStr)
          });

          count++;
        } catch (e) {
          // ignore corrupted single rows
        }
      })
      .on('end', async () => {
        console.log(`Stream reading finished. Batching final chunks. Parsed ${count} items.`);
        resolve();
      })
      .on('error', reject);
  });

  // Prisma batch insert
  for (let i = 0; i < batchProducts.length; i += 500) {
    const pChunk = batchProducts.slice(i, i + 500);
    const cChunk = batchContexts.slice(i, i + 500);
    await prisma.product.createMany({ data: pChunk, skipDuplicates: true });
    await prisma.productContext.createMany({ data: cChunk, skipDuplicates: true });
  }

  console.log(`Ingestion Complete! Total inserted: ${count}`);
}

run().catch(console.error).finally(() => prisma.$disconnect());
