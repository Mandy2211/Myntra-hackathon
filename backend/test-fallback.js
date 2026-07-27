require('dotenv').config();

const { parseSearchQuery } = require('./services/search-intelligence');
const { extractIntelligence } = require('./services/llm-enrichment');

const GREEN  = (s) => `\x1b[32m${s}\x1b[0m`;
const RED    = (s) => `\x1b[31m${s}\x1b[0m`;
const YELLOW = (s) => `\x1b[33m${s}\x1b[0m`;
const BOLD   = (s) => `\x1b[1m${s}\x1b[0m`;

async function testSearch(label, query) {
  console.log(`\n${BOLD(`[SEARCH] ${label}`)}`);
  console.log(`  Query: "${query}"`);
  try {
    const result = await parseSearchQuery(query);
    const isNA = Object.values(result).every(v => v === 'NA' || (Array.isArray(v) && v.length === 0));
    if (isNA) {
      console.log(RED('  ✗ Result: all NA — LLM did not parse correctly'));
    } else {
      console.log(GREEN('  ✓ Parsed successfully'));
    }
    console.log('  Result:', JSON.stringify(result, null, 4).replace(/\n/g, '\n  '));
    return !isNA;
  } catch (err) {
    console.log(RED(`  ✗ Error: ${err.message}`));
    return false;
  }
}

async function testEnrichment(label, product, seller) {
  console.log(`\n${BOLD(`[ENRICHMENT] ${label}`)}`);
  console.log(`  Product: ${product.name}`);
  try {
    const result = await extractIntelligence(product, seller);
    if (!result) {
      console.log(RED('  ✗ Result: null — both LLMs failed, heuristic fallback will be used'));
      return false;
    }
    console.log(GREEN('  ✓ Extracted successfully'));
    console.log('  Result:', JSON.stringify(result, null, 4).replace(/\n/g, '\n  '));
    return true;
  } catch (err) {
    console.log(RED(`  ✗ Error: ${err.message}`));
    return false;
  }
}

async function run() {
  console.log(BOLD('\n================================================'));
  console.log(BOLD('   BHARAT AI -- LLM Fallback Chain Tests        '));
  console.log(BOLD('================================================'));
  console.log(`  OpenRouter Key: ${process.env.OPENROUTER_API_KEY ? GREEN('SET') : RED('NOT SET')}`);
  console.log(`  Groq Key:       ${process.env.GROQ_API_KEY ? GREEN('SET') : RED('NOT SET')}`);

  const results = [];

  // Test 1: Normal search
  results.push(await testSearch(
    'Test 1 - Normal: "cotton kurti under 800"',
    'cotton kurti under 800'
  ));

  // Test 2: Regional language
  results.push(await testSearch(
    'Test 2 - Regional: "cheera for wedding"',
    'cheera for wedding'
  ));

  // Test 3: Office intent + exclusions
  results.push(await testSearch(
    'Test 3 - Office: "tops for teacher no sleeveless"',
    'tops for teacher no sleeveless'
  ));

  // Test 4: Force Groq fallback directly
  console.log(`\n${BOLD('[FALLBACK TEST] Confirming Groq responds independently')}`);
  let fallbackPassed = false;
  try {
    const Groq = require('groq-sdk');
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const chat = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0,
      messages: [
        { role: 'system', content: 'Return only valid JSON.' },
        { role: 'user', content: 'Extract category and occasion from: "silk saree for Navratri". Return JSON like {"category":"saree","occasion":"festive"}' }
      ],
      response_format: { type: 'json_object' }
    });
    const parsed = JSON.parse(chat.choices[0].message.content);
    if (parsed.category || parsed.occasion) {
      console.log(GREEN('  ✓ Groq (llama-3.3-70b) is live and responding'));
      console.log('  Groq response:', JSON.stringify(parsed));
      fallbackPassed = true;
    }
  } catch (err) {
    console.log(RED(`  ✗ Groq direct test failed: ${err.message}`));
  }
  results.push(fallbackPassed);

  // Test 5: Enrichment
  results.push(await testEnrichment(
    'Test 5 - Product enrichment tagging',
    { name: 'Cotton Kurti', description: 'Breathable summer kurti', category: 'Kurti', material: 'Cotton' },
    { city: 'Coimbatore', state: 'Tamil Nadu' }
  ));

  // Summary
  const passed = results.filter(Boolean).length;
  const total  = results.length;
  console.log(BOLD('\n================================================'));
  console.log(`  Results: ${passed === total ? GREEN(`${passed}/${total} PASSED`) : YELLOW(`${passed}/${total} passed`)}`);
  console.log(BOLD('================================================\n'));
  process.exit(passed === total ? 0 : 1);
}

run();
