const { ChatOpenAI } = require('@langchain/openai');
const { z } = require('zod');

// Using the same reliable OpenRouter configuration
const llm = new ChatOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  configuration: {
    baseURL: 'https://openrouter.ai/api/v1',
  },
  modelName: 'google/gemma-4-26b-a4b-it:free',
  temperature: 0,
});

const ALLOWED_CATEGORIES = [
  'saree',
  'kurti',
  'dress',
  't-shirt',
  'top',
  'jeans',
  'trouser',
  'blazer',
  'jacket',
  'gym wear',
  'lehenga',
  'shoes',
  'accessories',
  'skirt',
  'hoodie',
  'sweatshirt',
  'shorts',
  'ethnic wear',
  'footwear',
  'bags',
  'watches',
  'jewellery',
  'NA'
];

const SYNONYM_MAP = {
  cheera: 'saree',
  cheeralu: 'saree',
  sari: 'saree',
  sarees: 'saree',
  kurta: 'kurti',
  kurtas: 'kurti',
  kurtis: 'kurti',
  tshirt: 't-shirt',
  tee: 't-shirt',
  't shirt': 't-shirt',
  gown: 'dress',
  'long dress': 'dress',
  frock: 'dress',
  dr: 'dress',
  dresses: 'dress',
  sportswear: 'gym wear',
  activewear: 'gym wear',
  'sports wear': 'gym wear',
  'workout wear': 'gym wear'
};

function normalizeTerm(term) {
  if (!term || term === 'NA') return 'NA';
  let lower = String(term).toLowerCase().trim();
  if (SYNONYM_MAP[lower]) return SYNONYM_MAP[lower];
  // Strip trailing 's' or 'es' for plurals (except items like 'jeans', 'shoes', 'accessories')
  if (lower.endsWith('s') && !['jeans', 'shoes', 'accessories'].includes(lower)) {
    let singular = lower.endsWith('es') ? lower.slice(0, -2) : lower.slice(0, -1);
    if (SYNONYM_MAP[singular]) return SYNONYM_MAP[singular];
    return singular;
  }
  return lower;
}

const searchSchema = z.object({
  category: z
    .enum(ALLOWED_CATEGORIES)
    .describe('Broad product category. Map regional terms like cheera -> saree, gown -> dress, sportswear -> gym wear.'),
  type: z.string().describe('Specific product type (e.g. saree, long dress, t-shirt) or NA'),
  colour: z.string().describe('Color mentioned or NA'),
  material: z.string().describe('Material mentioned (e.g. leather, cotton) or NA'),
  gender: z.enum(['Men', 'Women', 'Boys', 'Girls', 'NA']),
  occasion: z.enum(['office', 'party', 'casual', 'formal', 'wedding', 'festive', 'sports', 'NA']),
  budget: z.string().describe('Maximum numerical price or NA'),
  occupation: z.string().describe('Profession or workplace mentioned (e.g. software engineer, teacher, doctor) or NA'),
  exclusions: z.array(z.string()).describe('Styles or attributes the user explicitly does NOT want (e.g. crop top, sleeveless, deep neck). Empty array if none.')
});

const searchExtractor = llm.withStructuredOutput(searchSchema, {
  name: "searchIntent"
});

async function parseSearchQuery(rawQuery) {
  try {
    const prompt = `Extract shopping search intent from this raw query: "${rawQuery}". Extract specific fields. Map regional or synonym terms to standard categories (e.g. "cheera" -> "saree", "gown" -> "dress", "sportswear" -> "gym wear"). Capture anything the user says they do NOT want into exclusions (e.g. "no crop tops", "not sleeveless" -> ["crop top","sleeveless"]). If a field is not derivable, strictly output "NA" for that string field and [] for exclusions.`;
    const result = await searchExtractor.invoke(prompt);
    return {
      category: normalizeTerm(result.category || "NA"),
      type: normalizeTerm(result.type || result.category || "NA"),
      colour: result.colour || "NA",
      material: result.material || "NA",
      gender: result.gender || "NA",
      occasion: result.occasion || "NA",
      budget: result.budget || "NA",
      occupation: result.occupation || "NA",
      exclusions: Array.isArray(result.exclusions) ? result.exclusions : []
    };
  } catch (err) {
    console.error("LLM Search Parse Error:", err);
    return { category: "NA", type: "NA", colour: "NA", material: "NA", gender: "NA", occasion: "NA", budget: "NA", occupation: "NA", exclusions: [] };
  }
}

module.exports = {
  parseSearchQuery,
  normalizeTerm
};
