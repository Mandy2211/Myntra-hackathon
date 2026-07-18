require('dotenv').config();
const { parseSearchQuery } = require('./services/search-intelligence');

async function main() {
  console.log("OPENROUTER_API_KEY:", process.env.OPENROUTER_API_KEY ? "EXISTS" : "MISSING");
  console.log("Testing parseSearchQuery...");
  const res = await parseSearchQuery("Red Kurti under 500");
  console.log("Result:", res);
}

main();
