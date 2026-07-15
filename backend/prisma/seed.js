const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const FESTIVALS_2026 = [
  // Andhra Pradesh
  { festival_name: 'Makar Sankranti', state: 'Andhra Pradesh', start_date: new Date('2026-01-14'), end_date: new Date('2026-01-15'), type: 'Normal' },
  { festival_name: 'Ugadi', state: 'Andhra Pradesh', start_date: new Date('2026-03-19'), end_date: new Date('2026-03-19'), type: 'Local' },
  { festival_name: 'Varalakshmi Vratam', state: 'Andhra Pradesh', start_date: new Date('2026-08-28'), end_date: new Date('2026-08-28'), type: 'Local' },
  
  // Maharashtra
  { festival_name: 'Gudi Padwa', state: 'Maharashtra', start_date: new Date('2026-03-19'), end_date: new Date('2026-03-19'), type: 'Local' },
  { festival_name: 'Ganesh Chaturthi', state: 'Maharashtra', start_date: new Date('2026-09-14'), end_date: new Date('2026-09-24'), type: 'Normal' },
  { festival_name: 'Shivaji Maharaj Jayanti', state: 'Maharashtra', start_date: new Date('2026-02-19'), end_date: new Date('2026-02-19'), type: 'Local' },
  { festival_name: 'Makar Sankranti', state: 'Maharashtra', start_date: new Date('2026-01-14'), end_date: new Date('2026-01-14'), type: 'Normal' },
  
  // Tamil Nadu
  { festival_name: 'Pongal', state: 'Tamil Nadu', start_date: new Date('2026-01-14'), end_date: new Date('2026-01-17'), type: 'Local' },
  { festival_name: 'Tamil New Year', state: 'Tamil Nadu', start_date: new Date('2026-04-14'), end_date: new Date('2026-04-14'), type: 'Local' },
  { festival_name: 'Karthigai Deepam', state: 'Tamil Nadu', start_date: new Date('2026-11-25'), end_date: new Date('2026-11-25'), type: 'Local' },
  
  // Karnataka
  { festival_name: 'Ugadi', state: 'Karnataka', start_date: new Date('2026-03-19'), end_date: new Date('2026-03-19'), type: 'Local' },
  { festival_name: 'Mysuru Dasara', state: 'Karnataka', start_date: new Date('2026-10-18'), end_date: new Date('2026-10-21'), type: 'Local' },
  { festival_name: 'Makar Sankranti', state: 'Karnataka', start_date: new Date('2026-01-14'), end_date: new Date('2026-01-14'), type: 'Normal' },
  
  // Kerala
  { festival_name: 'Onam', state: 'Kerala', start_date: new Date('2026-08-27'), end_date: new Date('2026-09-06'), type: 'Local' },
  { festival_name: 'Vishu', state: 'Kerala', start_date: new Date('2026-04-15'), end_date: new Date('2026-04-15'), type: 'Local' },
  { festival_name: 'Thrissur Pooram', state: 'Kerala', start_date: new Date('2026-05-01'), end_date: new Date('2026-05-02'), type: 'Local' },
  
  // Delhi
  { festival_name: 'Holi', state: 'Delhi', start_date: new Date('2026-03-02'), end_date: new Date('2026-03-03'), type: 'Normal' },
  { festival_name: 'Diwali', state: 'Delhi', start_date: new Date('2026-11-08'), end_date: new Date('2026-11-08'), type: 'Normal' },
  { festival_name: 'Lohri', state: 'Delhi', start_date: new Date('2026-01-13'), end_date: new Date('2026-01-13'), type: 'Local' },
  
  // Gujarat
  { festival_name: 'Uttarayan (Kite Festival)', state: 'Gujarat', start_date: new Date('2026-01-14'), end_date: new Date('2026-01-15'), type: 'Local' },
  { festival_name: 'Navratri', state: 'Gujarat', start_date: new Date('2026-10-10'), end_date: new Date('2026-10-19'), type: 'Local' },
  { festival_name: 'Diwali', state: 'Gujarat', start_date: new Date('2026-11-08'), end_date: new Date('2026-11-08'), type: 'Normal' },
  
  // West Bengal
  { festival_name: 'Durga Puja', state: 'West Bengal', start_date: new Date('2026-10-16'), end_date: new Date('2026-10-20'), type: 'Local' },
  { festival_name: 'Poila Baisakh', state: 'West Bengal', start_date: new Date('2026-04-15'), end_date: new Date('2026-04-15'), type: 'Local' },
  { festival_name: 'Saraswati Puja', state: 'West Bengal', start_date: new Date('2026-01-24'), end_date: new Date('2026-01-24'), type: 'Local' },
  
  // Telangana
  { festival_name: 'Bathukamma', state: 'Telangana', start_date: new Date('2026-10-10'), end_date: new Date('2026-10-18'), type: 'Local' },
  { festival_name: 'Bonalu', state: 'Telangana', start_date: new Date('2026-07-12'), end_date: new Date('2026-08-02'), type: 'Local' },
  { festival_name: 'Makar Sankranti', state: 'Telangana', start_date: new Date('2026-01-14'), end_date: new Date('2026-01-15'), type: 'Normal' },

  // Pan-India Defaults Fallback
  { festival_name: 'Diwali', state: 'All', start_date: new Date('2026-11-08'), end_date: new Date('2026-11-08'), type: 'Normal' },
  { festival_name: 'Dussehra', state: 'All', start_date: new Date('2026-10-21'), end_date: new Date('2026-10-21'), type: 'Normal' },
  { festival_name: 'Holi', state: 'All', start_date: new Date('2026-03-02'), end_date: new Date('2026-03-03'), type: 'Normal' },
  { festival_name: 'Eid', state: 'All', start_date: new Date('2026-03-21'), end_date: new Date('2026-03-21'), type: 'Normal' }
];

async function main() {
  console.log('Seeding Database with 2026 Regional Festivals (Local / Normal categorized)...');

  await prisma.festivalCalendar.deleteMany();
  await prisma.festivalCalendar.createMany({ data: FESTIVALS_2026 });
  console.log(`Seeded ${FESTIVALS_2026.length} categorized state-specific 2026 festivals.`);

  console.log('Seeding Complete!');
}

main()
  .catch(e => {
    console.error('Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
