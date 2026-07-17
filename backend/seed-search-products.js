const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = [
    {
      id: "demo-party-dress-1",
      name: "Elegant Red Party Dress",
      
      price: 2499,
      mrp: 4999,
      img: "https://assets.myntassets.com/f_webp,dpr_1.0,q_60,w_210,c_limit,fl_progressive/assets/images/1364628/2016/8/31/11472636737718-DressBerry-Women-Black-Lace-Midi-Sheath-Dress-7361472636737160-1.jpg",
      gender: "Women",
      category: "dress",
      macro_category: "Clothing",
      material: "Polyester",
      occasion: "Party",
      purl: "red-party-dress",
      remainingStock: 50,
      status: "Active",
      rating: 4.8,
      ratingTotal: 120,
    },
    {
      id: "demo-kurti-1",
      name: "Designer Floral Kurti",
      
      price: 1299,
      mrp: 2599,
      img: "https://assets.myntassets.com/f_webp,dpr_1.0,q_60,w_210,c_limit,fl_progressive/assets/images/1364628/2016/8/31/11472636737718-DressBerry-Women-Black-Lace-Midi-Sheath-Dress-7361472636737160-1.jpg",
      gender: "Women",
      category: "kurti",
      macro_category: "Clothing",
      material: "Cotton",
      occasion: "Festival",
      ethnic_style: "kurti",
      purl: "floral-kurti",
      remainingStock: 100,
      status: "Active",
      rating: 4.5,
      ratingTotal: 85,
    },
    {
      id: "demo-formal-suit-1",
      name: "Men's Black Formal Suit",
      
      price: 5999,
      mrp: 9999,
      img: "https://assets.myntassets.com/f_webp,dpr_1.0,q_60,w_210,c_limit,fl_progressive/assets/images/1364628/2016/8/31/11472636737718-DressBerry-Women-Black-Lace-Midi-Sheath-Dress-7361472636737160-1.jpg",
      gender: "Men",
      category: "suit",
      macro_category: "Clothing",
      material: "Wool Blend",
      occasion: "Formal",
      purl: "mens-black-suit",
      remainingStock: 20,
      status: "Active",
      rating: 4.9,
      ratingTotal: 45,
    }
  ];

  for (const p of products) {
    const created = await prisma.product.create({ data: p });
    console.log(`Seeded: ${created.name}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
