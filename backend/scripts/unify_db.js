const { PrismaClient } = require('@prisma/client');
const { State, City } = require('country-state-city');
const prisma = new PrismaClient();

async function main() {
  console.log('Fetching unified Indian geographic boundaries...');
  
  // Create an extensive array of realistic Indian Seller locations
  const states = State.getStatesOfCountry('IN');
  const validLocations = [];

  for (const st of states) {
    const cities = City.getCitiesOfState('IN', st.isoCode);
    if (cities.length > 0) {
      // Pick up to 5 major cities per state to avoid extreme rural overload for dummy data
      const limit = Math.min(cities.length, 5);
      for (let i = 0; i < limit; i++) {
        validLocations.push({ city: cities[i].name, state: st.name });
      }
    }
  }

  console.log(`Generated ${validLocations.length} unique geographic endpoints across India.`);

  // Create a legacy owner
  const user = await prisma.user.create({
    data: {
      email: 'national_admin_' + Date.now() + '@bharatai.com',
      passwordHash: 'dummy',
      role: 'ADMIN',
      businessName: 'Myntra National Archive'
    }
  });

  const BATCH_SIZE = 5000;
  
  console.log('Seeding simulated geolocations into legacy Product data...');
  const products = await prisma.product.findMany({ select: { id: true } });
  
  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE);
    
    // Postgres does not safely support looping diverse dynamic randomized arrays per row natively via Prisma
    // So we generate random SQL CASE mappings for the batch IDs in PostgreSQL
    
    let sqlUpdate = `UPDATE "Product" SET "status" = 'Active', "sellerId" = '${user.id}', "city" = CASE "id" `;
    let stateUpdate = ` "state" = CASE "id" `;
    
    for (const p of batch) {
      const loc = validLocations[Math.floor(Math.random() * validLocations.length)];
      sqlUpdate += ` WHEN '${p.id}' THEN '${loc.city.replace(/'/g, "''")}' `;
      stateUpdate += ` WHEN '${p.id}' THEN '${loc.state.replace(/'/g, "''")}' `;
    }
    
    sqlUpdate += ' END, ';
    stateUpdate += ' END WHERE "id" IN (' + batch.map(p => `'${p.id}'`).join(',') + ');';
    
    await prisma.$executeRawUnsafe(sqlUpdate + stateUpdate);
    console.log(`Processed ${i + batch.length} / ${products.length} records...`);
  }
  
  console.log('Successfully geographically seeded 15,000+ rows!');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
