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

const searchSchema = z.object({
  category: z.string().describe('Broad product category (e.g. dress, top, jacket, accessories, sarees, jeans, kurtas, shoes, bags, watches, jewellery, shorts, sports wear), or NA'),
  type: z.string().describe('Specific product type (e.g. long dress, t shirt) or NA'),
  colour: z.string().describe('Color mentioned or NA'),
  material: z.string().describe('Material mentioned (e.g. leather, cotton) or NA'),
  gender: z.string().describe('Gender (Men, Women, Boys, Girls) for specific searches like saree you can decide gender or NA'),
  occasion: z.string().describe('Occasion (party, casual, formal, wedding, festive, office, work) or NA'),
  budget: z.string().describe('Maximum numerical price or NA'),
  occupation: z.string().describe('Profession or workplace mentioned (e.g. software engineer, teacher, doctor) or NA'),
  exclusions: z.array(z.string()).describe('Styles or attributes the user explicitly does NOT want (e.g. crop top, sleeveless, deep neck, shirt). Empty array if none.')
});

const searchExtractor = llm.withStructuredOutput(searchSchema, {
  name: "searchIntent"
});

async function parseSearchQuery(rawQuery) {
  try {
    const prompt = `Extract shopping search intent from this raw query: "${rawQuery}". Extract specific fields. Capture anything the user says they do NOT want into exclusions (e.g. "no crop tops", "not sleeveless" -> ["crop top","sleeveless"]). If a field is not derivable, strictly output "NA" for that string field and [] for exclusions.`;
    const result = await searchExtractor.invoke(prompt);
    return {
      category: result.category || "NA",
      type: result.type || "NA",
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
  parseSearchQuery
};
