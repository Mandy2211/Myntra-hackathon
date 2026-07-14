const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CITIES = [
  {
    cityName: 'Coimbatore',
    climate: 'moderate',
    activeFestival: 'Pongal',
    preferredTags: ['cotton', 'handloom', 'casual', 'lightweight', 'traditional']
  },
  {
    cityName: 'Patna',
    climate: 'hot',
    activeFestival: 'Chhath Puja',
    preferredTags: ['traditional', 'silk', 'bright', 'synthetic', 'festive']
  },
  {
    cityName: 'Vizag',
    climate: 'humid',
    activeFestival: 'Ugadi',
    preferredTags: ['linen', 'pastel', 'beachwear', 'lightweight', 'breathable']
  },
  {
    cityName: 'Belgaum',
    climate: 'cool',
    activeFestival: 'Ganesh Chaturthi',
    preferredTags: ['shawl', 'jacket', 'denim', 'cotton', 'traditional']
  }
];

const PRODUCTS = [
  {
    id: 'prod_001',
    name: 'Coimbatore pure cotton handloom saree with border',
    img: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c;https://images.unsplash.com/photo-1617627143750-d86bc21e42bb',
    asin: 'N/A',
    price: 899.0,
    mrp: 1499.0,
    rating: 4.8,
    ratingTotal: 245,
    discount: '40%',
    seller: 'Coimbatore Handlooms Ltd',
    purl: 'https://www.myntra.com/saree/coimbatore-cotton',
    category: 'Ethnic Wear',
    tags: ['cotton', 'handloom', 'traditional', 'lightweight']
  },
  {
    id: 'prod_002',
    name: 'Banarasi silk blend festive saree in crimson red',
    img: 'https://images.unsplash.com/photo-1610030469668-93535c17b6b3',
    asin: 'N/A',
    price: 1299.0,
    mrp: 2999.0,
    rating: 4.7,
    ratingTotal: 840,
    discount: '56%',
    seller: 'Kashi Silk Emporium',
    purl: 'https://www.myntra.com/saree/banarasi-silk',
    category: 'Ethnic Wear',
    tags: ['silk', 'traditional', 'festive', 'bright']
  },
  {
    id: 'prod_003',
    name: 'Men slim fit solid linen breathable shirt',
    img: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c',
    asin: 'N/A',
    price: 699.0,
    mrp: 1199.0,
    rating: 4.3,
    ratingTotal: 1205,
    discount: '41%',
    seller: 'Roadster',
    purl: 'https://www.myntra.com/shirt/men-linen',
    category: 'Casual Wear',
    tags: ['linen', 'breathable', 'casual', 'lightweight']
  },
  {
    id: 'prod_004',
    name: 'Women printed cotton kurta set with dupatta',
    img: 'https://images.unsplash.com/photo-1608748010899-18f300247112',
    asin: 'N/A',
    price: 999.0,
    mrp: 1999.0,
    rating: 4.5,
    ratingTotal: 512,
    discount: '50%',
    seller: 'Anouk',
    purl: 'https://www.myntra.com/kurta/women-cotton-set',
    category: 'Ethnic Wear',
    tags: ['cotton', 'traditional', 'casual', 'festive']
  },
  {
    id: 'prod_005',
    name: 'Men regular fit denim cotton casual wear jacket',
    img: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0',
    asin: 'N/A',
    price: 1199.0,
    mrp: 2499.0,
    rating: 4.4,
    ratingTotal: 78,
    discount: '52%',
    seller: 'Here & Now',
    purl: 'https://www.myntra.com/jacket/men-denim',
    category: 'Outerwear',
    tags: ['denim', 'casual', 'cool']
  },
  {
    id: 'prod_006',
    name: 'Casual lightweight pastel kurtis for daily wear',
    img: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e',
    asin: 'N/A',
    price: 499.0,
    mrp: 999.0,
    rating: 4.2,
    ratingTotal: 3450,
    discount: '50%',
    seller: 'Libas',
    purl: 'https://www.myntra.com/kurta/women-pastel',
    category: 'Ethnic Wear',
    tags: ['cotton', 'pastel', 'lightweight', 'casual']
  },
  {
    id: 'prod_007',
    name: 'Unisex running mesh sneakers lightweight red',
    img: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa',
    asin: 'N/A',
    price: 899.0,
    mrp: 1799.0,
    rating: 4.1,
    ratingTotal: 2311,
    discount: '50%',
    seller: 'HRX by Hrithik Roshan',
    purl: 'https://www.myntra.com/shoes/unisex-running',
    category: 'Footwear',
    tags: ['casual', 'breathable', 'lightweight']
  },
  {
    id: 'prod_008',
    name: 'Tradition silk blend sherwani for weddings festive',
    img: 'https://images.unsplash.com/photo-1611601679655-7c8bc197f0c6',
    asin: 'N/A',
    price: 2499.0,
    mrp: 4999.0,
    rating: 4.6,
    ratingTotal: 45,
    discount: '50%',
    seller: 'Manyavar',
    purl: 'https://www.myntra.com/ethnic/men-sherwani',
    category: 'Ethnic Wear',
    tags: ['traditional', 'silk', 'festive', 'bright']
  },
  {
    id: 'prod_009',
    name: 'Comfortable cotton joggers for men pre-washed',
    img: 'https://images.unsplash.com/photo-1517438476312-10d79c092885',
    asin: 'N/A',
    price: 549.0,
    mrp: 999.0,
    rating: 4.4,
    ratingTotal: 8400,
    discount: '45%',
    seller: 'Roadster',
    purl: 'https://www.myntra.com/joggers/men-cotton',
    category: 'Sports Wear',
    tags: ['cotton', 'casual', 'lightweight']
  },
  {
    id: 'prod_010',
    name: 'Designer handloom silk dupatta with zari work',
    img: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b',
    asin: 'N/A',
    price: 399.0,
    mrp: 799.0,
    rating: 4.9,
    ratingTotal: 15,
    discount: '50%',
    seller: 'Shree Fabrics',
    purl: 'https://www.myntra.com/dupatta/handloom-silk',
    category: 'Ethnic Wear',
    tags: ['silk', 'traditional', 'festive', 'handloom']
  }
];

async function main() {
  console.log('Seeding database...');

  // 1. Clean existing database records
  await prisma.purchase.deleteMany();
  await prisma.cityContext.deleteMany();
  await prisma.product.deleteMany();

  console.log('Cleared database tables.');

  // 2. Seed Cities Context
  for (const city of CITIES) {
    await prisma.cityContext.create({ data: city });
  }
  console.log(`Seeded ${CITIES.length} cities.`);

  // 3. Seed Products
  for (const product of PRODUCTS) {
    await prisma.product.create({ data: product });
  }
  console.log(`Seeded ${PRODUCTS.length} catalog products.`);

  // 4. Seed Random Purchases to generate initial localized trends
  const testCities = ['Coimbatore', 'Patna', 'Vizag', 'Belgaum'];
  // We want to simulate that certain items are popular in specific regions:
  // e.g. Cotton Sarees (prod_001) in Coimbatore, Banarasi Silk (prod_002) in Patna, Linen Shirts (prod_003) in Vizag
  const purchases = [
    // Coimbatore loves Cotton Saree (prod_001)
    ...Array(15).fill({ productId: 'prod_001', cityName: 'Coimbatore' }),
    // Patna loves Banarasi Silk (prod_002)
    ...Array(20).fill({ productId: 'prod_002', cityName: 'Patna' }),
    // Vizag loves Linen Shirt (prod_003)
    ...Array(12).fill({ productId: 'prod_003', cityName: 'Vizag' }),
    // Belgaum loves Denim Jacket (prod_005)
    ...Array(8).fill({ productId: 'prod_005', cityName: 'Belgaum' }),
    // General transactions
    { productId: 'prod_004', cityName: 'Coimbatore' },
    { productId: 'prod_007', cityName: 'Coimbatore' },
    { productId: 'prod_006', cityName: 'Vizag' },
    { productId: 'prod_009', cityName: 'Vizag' },
    { productId: 'prod_004', cityName: 'Patna' },
    { productId: 'prod_008', cityName: 'Patna' },
    { productId: 'prod_006', cityName: 'Belgaum' },
    { productId: 'prod_001', cityName: 'Belgaum' }
  ];

  for (const p of purchases) {
    await prisma.purchase.create({
      data: {
        productId: p.productId,
        cityName: p.cityName,
      }
    });
  }

  console.log(`Simulated ${purchases.length} sales events successfully!`);
  console.log('Database seeding finished.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
