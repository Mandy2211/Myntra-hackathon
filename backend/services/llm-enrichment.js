const { ChatOpenAI } = require('@langchain/openai');
const { z } = require('zod');

// We use meta-llama/llama-3.1-8b-instruct on OpenRouter because it has excellent latency out of the box for JSON extraction
const llm = new ChatOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  configuration: {
    baseURL: 'https://openrouter.ai/api/v1',
  },
  modelName: 'google/gemma-4-26b-a4b-it:free',
  temperature: 0,
});

const enrichmentSchema = z.object({
  macroCategory: z.enum([
    'Clothing', 'Skincare & Face Care', 'Electrical Appliances', 'Accessories', 'Home Furnishing', 'Footwear'
  ]).describe('The highest level parent category for the product.'),
  season: z.enum([
    'Summer', 'Winter', 'Monsoon', 'All Season'
  ]).describe('The optimal season to use or wear this product.'),
  climate: z.enum([
    'Hot', 'Cold', 'Rainy', 'Neutral'
  ]).describe('The optimal climate demographic for this product.'),
  occasion: z.enum([
    'Casual', 'Festival', 'Sports', 'Formal', 'Party Wear'
  ]).describe('The event setting the product is built for.')
});

const extractor = llm.withStructuredOutput(enrichmentSchema, {
  name: "productIntelligence"
});

async function extractIntelligence(productDetails, sellerDetails) {
  const prompt = `You are an expert hyperlocal telemetry AI for a storefront in India.
Your job is to read raw product details uploaded by a seller and extract exact categorical mapping tags.

Product Name: ${productDetails.name}
Description: ${productDetails.description || 'none'}
Category: ${productDetails.category}
Material: ${productDetails.material}

Seller Location: ${sellerDetails.city || 'Unknown'}, ${sellerDetails.state || 'Unknown'}

Return the optimal JSON extraction. Pay close attention to Material. If Material is Cotton, it should heavily skew to Summer/Hot.
If the description mentions rain, Monsoon/Rainy.`;

  try {
    const result = await extractor.invoke(prompt);
    return result;
  } catch (err) {
    console.error("LLM Extraction Error", err);
    // Silent Fallback if API fails
    return null;
  }
}

module.exports = {
  extractIntelligence
};
