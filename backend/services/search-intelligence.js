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
  occasion: z.string().describe('Occasion (party, casual, formal, wedding, festive) or NA'),
  budget: z.string().describe('Maximum numerical price or NA')
});

const searchExtractor = llm.withStructuredOutput(searchSchema, {
  name: "searchIntent"
});

async function parseSearchQuery(rawQuery) {
  try {
    const prompt = `Extract shopping search intent from this raw query: "${rawQuery}". Extract specific fields. If a field is not derivable, strictly output "NA" for that string field.`;
    const result = await searchExtractor.invoke(prompt);
    return {
      category: result.category || "NA",
      type: result.type || "NA",
      colour: result.colour || "NA",
      material: result.material || "NA",
      gender: result.gender || "NA",
      occasion: result.occasion || "NA",
      budget: result.budget || "NA"
    };
  } catch (err) {
    console.error("LLM Search Parse Error:", err);
    return { category: "NA", type: "NA", colour: "NA", material: "NA", gender: "NA", occasion: "NA", budget: "NA" };
  }
}

module.exports = {
  parseSearchQuery
};
