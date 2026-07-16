const GENDER_MAP = {
  male: 'Men', men: 'Men', mens: 'Men', boy: 'Men', boys: 'Men',
  female: 'Women', women: 'Women', womens: 'Women', girl: 'Women', girls: 'Women', ladies: 'Women',
  kid: 'Kids', kids: 'Kids', baby: 'Kids', toddler: 'Kids'
};

const CATEGORY_MAP = [
  'shirt', 'tshirt', 'tee', 'jeans', 'trouser', 'trousers', 'pant', 'pants', 'track pant', 'trackpants', 
  'shorts', 'cargo', 'hoodie', 'sweatshirt', 'jacket', 'blazer', 'coat', 'dress', 'gown', 'kurta', 'kurti', 
  'lehenga', 'blouse', 'dupatta', 'saree', 'kanjeevaram', 'banarasi', 'skirt', 'top', 'crop top', 'shrug',
  'accessories', 'shoes', 'bags', 'bag', 'jewellery', 'watch', 'wallet', 'puffer', 'face wash', 'facewash', 
  'cream', 'serum', 'lotion', 'lipstick', 'makeup', 'skincare', 'hair', 'shampoo',
  'trimmer', 'dryer', 'straightener', 'epilator', 'shaver',
  'carpet', 'pillow', 'bedsheet', 'blanket', 'cushion', 'curtain', 'towel', 'rug', 'dohar',
  'sharara', 'nehru', 'churidar', 'moisturizer', 'moisturiser', 'backpack', 'pouch', 'carry bag',
  'ballerinas', 'heels', 'flats', 'sandals', 'sneakers', 'boots', 'slippers', 'footwear', 'sweatshirt'
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
  'rayon', 'polyester', 'denim', 'leather', 'wool', 'velvet', 'satin'
];

const OCCASION_MAP = {
  festival: ['kurta', 'kurti', 'lehenga', 'dupatta', 'saree', 'kanjeevaram', 'banarasi', 'ethnic', 'sharara', 'nehru', 'churidar'],
  formal: ['blazer', 'formal', 'coat', 'trouser', 'shirt'],
  sports: ['running', 'gym', 'training', 'track pant', 'sneakers', 'sports']
};

const SEASON_MAP = {
  summer: ['cotton', 'linen', 'shorts', 'tshirt', 'tee'],
  winter: ['hoodie', 'sweater', 'jacket', 'coat', 'wool', 'puffer', 'boots', 'shrug'],
  monsoon: ['raincoat', 'quick dry', 'waterproof', 'crocs']
};

const CLIMATE_MAP = {
  hot: ['cotton', 'linen', 'summer', 'tshirt', 'shorts', 'flats'],
  cold: ['hoodie', 'sweater', 'wool', 'puffer', 'jacket', 'coat', 'winter', 'leather', 'boots'],
  rainy: ['raincoat', 'waterproof', 'quick dry', 'monsoon', 'crocs']
};

function extractGender(nameWords) {
  for (let w of nameWords) {
    if (w in GENDER_MAP) return GENDER_MAP[w];
  }
  return 'Unisex'; // Default fallback
}

function extractCategory(nameStr) {
  for (let cat of CATEGORY_MAP) {
    if (nameStr.includes(cat)) {
      return cat.split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
    }
  }
  return 'Clothing';
}

function extractMacroCategory(nameStr, existingCategory = '') {
  for (const [macro, keywords] of Object.entries(MACRO_MAP)) {
    for (let word of keywords) {
      if (nameStr.includes(word) || existingCategory.toLowerCase().includes(word)) return macro;
    }
  }
  return 'Clothing';
}

function extractClimate(nameStr, category = '', material = '') {
  const combined = nameStr + ' ' + category.toLowerCase() + ' ' + (material !== 'Unknown' ? material.toLowerCase() : '');
  for (let word of CLIMATE_MAP.hot) {
    if (combined.includes(word)) return 'Hot';
  }
  for (let word of CLIMATE_MAP.cold) {
    if (combined.includes(word)) return 'Cold';
  }
  for (let word of CLIMATE_MAP.rainy) {
    if (combined.includes(word)) return 'Rainy';
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

function extractOccasion(nameStr, category = '') {
  const combined = nameStr + ' ' + category.toLowerCase();
  for (let word of OCCASION_MAP.festival) {
    if (combined.includes(word)) return 'Festival';
  }
  for (let word of OCCASION_MAP.formal) {
    if (combined.includes(word)) return 'Formal';
  }
  for (let word of OCCASION_MAP.sports) {
    if (combined.includes(word)) return 'Sports';
  }
  return 'Casual';
}

function extractSeason(nameStr, category = '', material = '') {
  const combined = nameStr + ' ' + category.toLowerCase() + ' ' + (material !== 'Unknown' ? material.toLowerCase() : '');
  for (let word of SEASON_MAP.summer) {
    if (combined.includes(word)) return 'Summer';
  }
  for (let word of SEASON_MAP.winter) {
    if (combined.includes(word)) return 'Winter';
  }
  for (let word of SEASON_MAP.monsoon) {
    if (combined.includes(word)) return 'Monsoon';
  }
  return 'All Season';
}

function computePriceSegment(price) {
  if (price <= 500) return 'Budget';
  if (price <= 1500) return 'Economy';
  if (price <= 3500) return 'Premium';
  return 'Luxury';
}

module.exports = {
  extractGender,
  extractCategory,
  extractMacroCategory,
  extractClimate,
  extractMaterial,
  extractOccasion,
  extractSeason,
  computePriceSegment
};
