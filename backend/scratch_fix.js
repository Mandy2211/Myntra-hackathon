const fs = require('fs');
const file = 'e:/BHARAT_AI/backend/index.js';
let content = fs.readFileSync(file, 'utf8');

let lines = content.split('\n');

// Find the line where 'take: 15' for budgetPicks happens
let sliceIndex = -1;
for (let i = 370; i < 390; i++) {
  if (lines[i].includes('take: 15') && lines[i-3].includes('rating:')) {
    sliceIndex = i;
    break;
  }
}

if(sliceIndex !== -1) {
  content = lines.slice(0, sliceIndex + 1).join('\n');
} else {
  console.log("Could not find slice index");
  process.exit(1);
}

const footer = `
    });

    res.json({ budgetPicks });
  } catch (error) {
    console.error('Error fetching budget picks:', error);
    res.status(500).json({ error: 'Failed to generate budget picks' });
  }
});

// Seller hotspots map (fallback to old behaviour)
app.get('/api/seller/analytics', authenticateToken, requireRole('SELLER'), async (req, res) => {
  const { seller } = req.query;
  const purchases = await prisma.purchase.findMany({
    where: { product: { seller: { equals: seller, mode: 'insensitive' } } },
    include: { product: true }
  });
  const cityCounts = {};
  purchases.forEach(p => { cityCounts[p.cityName] = (cityCounts[p.cityName] || 0) + 1; });
  const hotspots = Object.keys(cityCounts).map(city => ({ city, sales: cityCounts[city] })).sort((a, b) => b.sales - a.sales);
  res.json({ seller, totalSales: purchases.length, hotspots });
});

// --- NEW SELLER GROWTH HUB ROUTES ---

// 1. Consumer Search Telemetry (Phase 1)
app.post('/api/search/track', authenticateToken, async (req, res) => {
  try {
    const { rawQuery } = req.body;
    const { city, state } = req.user;

    const openRouterKey = process.env.OPENROUTER_API_KEY;
    let structuredData = {
      category: 'NA', type: 'NA', colour: 'NA', material: 'NA', gender: 'NA', occasion: 'NA'
    };

    if (openRouterKey) {
      try {
        const { ChatOpenAI } = require('@langchain/openai');
        const { z } = require('zod');
        
        const searchSchema = z.object({
          category: z.string().describe("e.g. Topwear, Bottomwear, Ethnic. Use 'NA' if absent"),
          type: z.string().describe("the core clothing item e.g. Saree, Kurti. Use 'NA' if absent"),
          colour: z.string().describe("Use 'NA' if absent"),
          material: z.string().describe("Use 'NA' if absent"),
          gender: z.string().describe("Use 'NA' if absent"),
          occasion: z.string().describe("Use 'NA' if absent"),
        });

        // Initialize ChatOpenAI pointing to OpenRouter
        const llm = new ChatOpenAI({
          modelName: 'nvidia/nemotron-3-nano-30b-a3b:free',
          openAIApiKey: openRouterKey,
          temperature: 0,
        }, {
          baseURL: 'https://openrouter.ai/api/v1',
        });

        // The exact .withStructuredOutput LangChain API (equivalent to Pydantic binding)
        const structuredLlm = llm.withStructuredOutput(searchSchema, { name: 'extract_attributes', includeRaw: false });
        
        console.log('Invoking LangChain OpenRouter...');
        const result = await structuredLlm.invoke(\`Extract attributes from this e-commerce query. Reply strictly in JSON schema. Query: \${rawQuery}\`);
        
        console.log('LangChain Extraction Success:', result);
        structuredData = {
          category: result.category || 'NA',
          type: result.type || 'NA',
          colour: result.colour || 'NA',
          material: result.material || 'NA',
          gender: result.gender || 'NA',
          occasion: result.occasion || 'NA',
        };
      } catch(err) {
        console.error('LangChain Error executing structured output:', err);
      }
    } else {
      console.error('NO OPENROUTER_API_KEY FOUND IN .ENV');
    }

    // Save to the DB
    const searchQuery = await prisma.searchQuery.create({
      data: {
        rawQuery,
        ...structuredData,
        city: city || 'Coimbatore',
        state: state || 'Tamil Nadu'
      }
    });

    res.json({ success: true, searchQuery });
  } catch (error) {
    console.error('Search tracking error:', error);
    res.status(500).json({ error: 'Failed to track search' });
  }
});

// 2. Real-Time Seller Dashboard Metrics (Phase 2)
app.get('/api/seller/dashboard', authenticateToken, requireRole('SELLER'), async (req, res) => {
  try {
    const { city, state } = req.user;

    const popularSearches = await prisma.searchQuery.groupBy({
      by: ['type'],
      where: { state, type: { not: 'NA' } },
      _count: { type: true },
      orderBy: { _count: { type: 'desc' } },
      take: 3
    });

    const marketInsights = await Promise.all(popularSearches.map(async (search) => {
      const keyword = search.type;
      const searchVolume = search._count.type * 100;

      const supplyCount = await prisma.product.count({
        where: {
          OR: [
            { name: { contains: keyword, mode: 'insensitive' } },
            { category: { contains: keyword, mode: 'insensitive' } },
            { macro_category: { contains: keyword, mode: 'insensitive' } }
          ]
        }
      });

      let gapScore = 0;
      if (supplyCount === 0) {
        gapScore = 100;
      } else {
        const ratio = searchVolume / supplyCount;
        gapScore = Math.min(Math.round((ratio / 10) * 100), 100); 
      }

      return {
        keyword,
        searchVolume,
        availableProducts: supplyCount,
        gapScore,
        recommendation: gapScore > 75 
          ? \`High demand for '\${keyword}' detected in \${city} with critical supply shortage. Add stock immediately!\`
          : \`Market is saturated with '\${keyword}'. Compete on price or add unique variations.\`
      };
    }));

    res.json({
      sellerRegion: { city, state },
      marketInsights
    });
  } catch (error) {
    console.error('Seller dashboard error:', error);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

app.listen(PORT, () => {
  console.log(\`Server running on http://localhost:\${PORT}\`);
});
`;

fs.writeFileSync(file, content + '\n' + footer);
console.log('Fixed index.js completely');
