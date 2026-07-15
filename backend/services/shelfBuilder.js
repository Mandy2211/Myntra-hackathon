const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Single backend function that applies filters
async function buildShelf(shelfConfig, context, baseLimit = 30) {
  const { title, filters } = shelfConfig;
  
  // Construct the Prisma where clause dynamically based on filters
  const whereClause = {};

  if (filters.gender) {
    if (filters.gender !== 'Unisex') {
      whereClause.context = { ...whereClause.context, gender_category: { in: [filters.gender, 'Unisex'] } };
    }
  }

  if (filters.occasion) {
    whereClause.context = { ...whereClause.context, occasion: filters.occasion };
  }

  if (filters.climate) {
    whereClause.context = { ...whereClause.context, climate: filters.climate };
  }

  if (filters.macro_category) {
    whereClause.context = { ...whereClause.context, macro_category: filters.macro_category };
  }

  if (filters.price) {
    whereClause.price = {
      gte: parseFloat(filters.price.min) || 0,
      lte: parseFloat(filters.price.max) || 50000
    };
  }

  // Fetch the items matching the rule-based logic
  const products = await prisma.product.findMany({
    where: whereClause,
    take: baseLimit,
    include: {
      context: true
    },
    orderBy: {
      ratingTotal: 'desc'
    }
  });

  return {
    id: title.toLowerCase().replace(/\s+/g, '-'),
    title,
    products
  };
}

module.exports = {
  buildShelf
};
