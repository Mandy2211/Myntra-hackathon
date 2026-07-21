const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const enrichment = require('./services/enrichment');
const llmEnrichment = require('./services/llm-enrichment');
const searchIntelligence = require('./services/search-intelligence');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'bharat_ai_products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
  }
});
const upload = multer({ storage: storage });

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-here-123';

const app = express();
app.use(cors());
app.use(express.json());

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token missing' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: `Requires ${role} role` });
    }
    next();
  };
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// ─── Admin Auto-Seed ──────────────────────────────────────────────────────────
async function seedAdmin(retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      let adminEmail = process.env.ADMIN_EMAIL;
      let adminPassword = process.env.ADMIN_PASSWORD;

      if (!adminEmail || !adminPassword) {
        if (attempt === 1) console.warn('[Admin Seed] Warning: ADMIN_EMAIL or ADMIN_PASSWORD missing from .env. Skipping auto-seed.');
        return;
      }
      
      // Strip accidental quotes if they were loaded verbatim from .env
      adminEmail = adminEmail.replace(/^["']|["']$/g, '').trim();
      adminPassword = adminPassword.replace(/^["']|["']$/g, '').trim();

      const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
      if (!existing) {
        await prisma.user.create({
          data: {
            email: adminEmail,
            passwordHash: hashPassword(adminPassword),
            role: 'ADMIN',
            name: 'Admin',
            city: 'Delhi',
            state: 'Delhi',
            gender: 'Men'
          }
        });
        console.log(`[Admin Seeded] ${adminEmail}`);
      } else {
        console.log(`[Admin Verified] ${adminEmail}`);
      }
      return;
    } catch (e) {
      console.warn(`[Admin Seed Attempt ${attempt}/${retries} Notice]`, e.message);
      if (attempt === retries) {
        console.error('[Admin Seed Error] Could not seed admin after retries:', e.message);
      } else {
        await new Promise(r => setTimeout(r, 1500));
      }
    }
  }
}

async function syncAllProductRatings() {
  try {
    const groups = await prisma.review.groupBy({
      by: ['productId'],
      _avg: { rating: true },
      _count: { id: true }
    });

    for (const group of groups) {
      const avgRating = group._avg.rating ? Math.round(group._avg.rating * 10) / 10 : 0;
      const count = group._count.id || 0;
      await prisma.product.update({
        where: { id: group.productId },
        data: {
          rating: avgRating,
          ratingTotal: count
        }
      });
    }
    if (groups.length > 0) {
      console.log(`[Rating Sync] Synced ratings for ${groups.length} reviewed product(s).`);
    }
  } catch (err) {
    console.error('[Rating Sync Error]', err.message);
  }
}

// ─── Bayesian Rating Engine ────────────────────────────────────────────────────
// Implements: score = (v/(v+m))*R + (m/(v+m))*C
//   R = item avgRating, v = numRatings, C = catalog mean, m = min-vote threshold

function computeGlobalStats(items) {
  if (!items || items.length === 0) return { C: 4.0, m: 5 };
  const withRatings = items.filter(i => (i.ratingTotal || 0) > 0);
  const C = withRatings.length > 0
    ? withRatings.reduce((sum, i) => sum + (i.rating || 0), 0) / withRatings.length
    : 4.0;
  const voteCounts = items.map(i => i.ratingTotal || 0).sort((a, b) => a - b);
  const pctIdx = Math.floor(voteCounts.length * 0.25);
  const m = Math.max(voteCounts[pctIdx] || 1, 1);
  return { C: parseFloat(C.toFixed(4)), m };
}

function computeStatsByCategory(items) {
  const grouped = {};
  items.forEach(item => {
    const cat = item.category || 'Other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  });
  const result = {};
  for (const [cat, catItems] of Object.entries(grouped)) {
    result[cat] = computeGlobalStats(catItems);
  }
  return result;
}

// In-memory cache: refreshes every hour
let _statsCache = { byCategory: {}, global: { C: 4.0, m: 5 }, computedAt: 0 };

async function getStatsByCategory() {
  const ONE_HOUR = 60 * 60 * 1000;
  if (Date.now() - _statsCache.computedAt < ONE_HOUR && Object.keys(_statsCache.byCategory).length > 0) {
    return _statsCache;
  }
  try {
    const items = await prisma.product.findMany({
      select: { id: true, rating: true, ratingTotal: true, category: true, price: true }
    });
    const byCategory = computeStatsByCategory(items);
    const global = computeGlobalStats(items);
    _statsCache = { byCategory, global, computedAt: Date.now() };
    console.log(`[Bayes Cache] Refreshed stats for ${Object.keys(byCategory).length} categories. Global C=${global.C.toFixed(2)}, m=${global.m}`);
  } catch (err) {
    console.error('[Bayes Cache Error]', err.message);
  }
  return _statsCache;
}

function bayesianScore(item, C, m) {
  const v = item.ratingTotal || 0;
  const R = item.rating || 0;
  return (v / (v + m)) * R + (m / (v + m)) * C;
}

// Recency-decayed rating using raw review timestamps (halfLife = 180 days)
function computeDecayedRating(reviews, halfLifeDays = 180) {
  const now = Date.now();
  let weightedSum = 0;
  let totalWeight = 0;
  for (const r of reviews) {
    const ageDays = (now - new Date(r.createdAt).getTime()) / 86400000;
    const weight = Math.pow(0.5, ageDays / halfLifeDays);
    weightedSum += (r.rating || 0) * weight;
    totalWeight += weight;
  }
  return {
    avgRating: totalWeight > 0 ? weightedSum / totalWeight : 0,
    effectiveVotes: totalWeight
  };
}

// Rank items by Bayesian score, optionally price-adjusted, with discovery slots for new items
function getTopItemsWithDiscovery(items, statsCache, { topN = 12, priceAdjusted = false, budget = null } = {}) {
  let filtered = budget != null ? items.filter(i => i.price <= budget) : items;

  const ranked = filtered
    .map(item => {
      const cat = item.category || 'Other';
      const { C, m } = statsCache.byCategory[cat] || statsCache.global;
      const score = bayesianScore(item, C, m);
      // sqrt(price) softens over-reward of cheap items; exponent 0.4 is tuned
      const valueScore = priceAdjusted && item.price > 0
        ? score / Math.pow(item.price, 0.4)
        : score;
      return { ...item, bayesianScore: parseFloat(score.toFixed(3)), valueScore };
    })
    .sort((a, b) => b.valueScore - a.valueScore);

  const topItems = ranked.slice(0, topN - 2);
  const topIds = new Set(topItems.map(i => i.id));

  // Discovery: 2 newest items with < 5 reviews not already in top list
  const discoveryItems = filtered
    .filter(i => (i.ratingTotal || 0) < 5 && !topIds.has(i.id))
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 2)
    .map(item => ({ ...item, bayesianScore: 0, valueScore: 0, isNew: true }));

  return [...topItems, ...discoveryItems];
}

app.get('/', (req, res) => res.json({ message: 'Bharat AI Backend running!' }));

const FESTIVALS_2026 = [
  { name: "Raksha Bandhan", date: "2026-08-12", states: ["All"], tags: ["Festive", "Ethnic", "Kurta", "Saree"] },
  { name: "Ganesh Chaturthi", date: "2026-09-14", states: ["Maharashtra", "Karnataka", "Telangana"], tags: ["Ethnic", "Festive", "Traditional"] },
  { name: "Onam", date: "2026-08-25", states: ["Kerala"], tags: ["Saree", "Kasavu", "Ethnic", "Dhoti", "Traditional"] },
  { name: "Durga Puja", date: "2026-10-17", states: ["West Bengal", "Assam", "Bihar"], tags: ["Saree", "Festive", "Kurta", "Ethnic"] },
  { name: "Diwali", date: "2026-11-08", states: ["All"], tags: ["Festive", "Ethnic", "Premium", "Saree"] },
  { name: "Ugadi", date: "2026-03-22", states: ["Andhra Pradesh", "Telangana", "Karnataka"], tags: ["Ethnic", "Traditional", "Silk"] },
  { name: "Pongal", date: "2026-01-14", states: ["Tamil Nadu"], tags: ["Saree", "Dhoti", "Ethnic", "Traditional"] },
  { name: "Bihu", date: "2026-04-14", states: ["Assam"], tags: ["Mekhela", "Ethnic", "Traditional"] },
  { name: "Navratri", date: "2026-10-11", states: ["Gujarat", "Maharashtra", "All"], tags: ["Chaniya Choli", "Garba", "Ethnic", "Festive"] },
  { name: "Makar Sankranti", date: "2026-01-14", states: ["Gujarat", "Maharashtra", "Rajasthan", "All"], tags: ["Festive", "Ethnic", "Kurta"] }
];

function getUpcomingFestival(stateName, today = new Date()) {
  const upcoming = FESTIVALS_2026
    .filter(f => f.states.includes("All") || f.states.includes(stateName))
    .map(f => ({ ...f, parsedDate: new Date(f.date) }))
    .filter(f => f.parsedDate >= today)
    .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());

  if (!upcoming.length) return null;

  const daysLeft = Math.ceil((upcoming[0].parsedDate.getTime() - today.getTime()) / 86400000);

  if (daysLeft <= 45) {
    return { name: upcoming[0].name, daysLeft, tags: upcoming[0].tags };
  }

  return null;
}

app.get('/api/cities', async (req, res) => {
  res.json([]);
});

// ─── Auth Routes ──────────────────────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  const {
    email, password, role, name, city, state, gender,
    pincode, mobileNumber, businessType, businessName, gstNumber, yearsInBusiness, primaryProduct
  } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const targetRole = role === 'SELLER' ? 'SELLER' : 'CUSTOMER';
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'Email registered' });

    const passwordHash = hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: targetRole,
        gender: gender || 'Men',
        name: name || `${targetRole} ${email.split('@')[0]}`,
        city: city || 'Coimbatore',
        state: state || 'Tamil Nadu',
        pincode: pincode || null,
        mobileNumber: mobileNumber || null,
        businessType: businessType || null,
        businessName: businessName || null,
        gstNumber: gstNumber || null,
        yearsInBusiness: yearsInBusiness ? parseInt(yearsInBusiness, 10) : null,
        primaryProduct: primaryProduct || null
      }
    });

    const payload = { id: user.id, email: user.email, role: user.role, gender: user.gender, city: user.city, state: user.state, name: user.name, pincode: user.pincode };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    const { passwordHash: _, ...u } = user;
    res.status(201).json({ user: u, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Credentials required' });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.passwordHash !== hashPassword(password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.isBlocked && user.role === 'SELLER') {
      return res.status(403).json({ error: 'Your seller account has been blocked by admin due to excessive complaints. Please contact support.' });
    }

    const payload = { id: user.id, email: user.email, role: user.role, gender: user.gender, city: user.city, state: user.state, name: user.name, pincode: user.pincode, isBlocked: user.isBlocked };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    const { passwordHash: _, ...u } = user;
    res.json({ user: u, token });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { passwordHash: _, ...u } = user;
  res.json({ user: u });
});

app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  const { city, state } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'Not found' });
    const { passwordHash: _, ...u } = user;
    res.json({ user: u });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

// ─── Homepage Shelves ─────────────────────────────────────────────────────────
app.get('/api/homepage/shelves', async (req, res) => {
  try {
    const { city, state, gender, maxPrice, pincode } = req.query;
    const resolvedCity = city || 'Coimbatore';
    const resolvedState = state || 'Tamil Nadu';
    const targetGender = gender || 'Men';
    const budget = parseFloat(maxPrice) || 2000;

    let climate = 'Hot';
    let temperature = 30;
    try {
      let geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(resolvedCity)}&count=1`, {
        signal: AbortSignal.timeout(5000)
      });
      let geoData = await geoRes.json();
      if (geoData.results && geoData.results.length > 0) {
        let lat = geoData.results[0].latitude;
        let lon = geoData.results[0].longitude;

        let weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`, {
          signal: AbortSignal.timeout(5000)
        });
        let weatherData = await weatherRes.json();
        if (weatherData.current_weather) {
          temperature = weatherData.current_weather.temperature;
          if (temperature < 20) climate = 'Cold';
          else if (temperature > 28) climate = 'Hot';
          else climate = 'Rainy';
        }
      }
    } catch (e) {
      console.error('Weather fetch failed', e);
    }

    // ── LOCAL SELLER SHELF (3-Tier: City → Neighboring → State, Sellers Only) ──
    let localPicks = [];
    let localTier = 'none'; // Track which tier we're at

    const sellerBaseWhere = {
      source: 'seller',
      status: 'Active',
      img: { not: '-' }
    };

    // Tier 1: Exact City match
    localPicks = await prisma.product.findMany({
      where: {
        ...sellerBaseWhere,
        city: { equals: resolvedCity, mode: 'insensitive' }
      },
      orderBy: [{ rating: 'desc' }],
      take: 15
    });
    if (localPicks.length > 0) localTier = 'city';

    // Tier 2: Pincode prefix (neighboring cities / district)
    if (localPicks.length < 5 && pincode && pincode.length === 6) {
      const prefix = pincode.substring(0, 3);
      const neighborPicks = await prisma.product.findMany({
        where: {
          ...sellerBaseWhere,
          pincode: { startsWith: prefix },
          id: { notIn: localPicks.map(p => p.id) }
        },
        orderBy: [{ rating: 'desc' }],
        take: 15 - localPicks.length
      });
      localPicks.push(...neighborPicks);
      if (localPicks.length > 0) localTier = 'district';
    }

    // Tier 3: Entire state
    if (localPicks.length < 5) {
      const statePicks = await prisma.product.findMany({
        where: {
          ...sellerBaseWhere,
          state: { equals: resolvedState, mode: 'insensitive' },
          id: { notIn: localPicks.map(p => p.id) }
        },
        orderBy: [{ rating: 'desc' }],
        take: 15 - localPicks.length
      });
      localPicks.push(...statePicks);
      if (localPicks.length > 0 && localTier === 'none') localTier = 'state';
    }

    const hasLocalSellers = localPicks.length > 0;

    // ── WEATHER PICKS ─────────────────────────────────────────────────────────
    let weatherWhere = {
      climate: climate,
      gender: { contains: targetGender, mode: 'insensitive' },
      img: { not: '-' },
      status: 'Active',
      NOT: {
        OR: [
          { name: { contains: 'party', mode: 'insensitive' } },
          { name: { contains: 'festival', mode: 'insensitive' } },
          { purl: { contains: 'party', mode: 'insensitive' } },
          { purl: { contains: 'festival', mode: 'insensitive' } },
          { occasion: { contains: 'party', mode: 'insensitive' } },
          { occasion: { contains: 'festival', mode: 'insensitive' } }
        ]
      }
    };

    if (climate === 'Hot') {
      weatherWhere.OR = [
        { material: { contains: 'Cotton', mode: 'insensitive' } },
        { material: { contains: 'Linen', mode: 'insensitive' } },
        { category: { contains: 'Shorts', mode: 'insensitive' } },
        { category: { contains: 'Dress', mode: 'insensitive' } },
        { name: { contains: 'Frock', mode: 'insensitive' } }
      ];
    } else if (climate === 'Cold') {
      weatherWhere.OR = [
        { material: { contains: 'Wool', mode: 'insensitive' } },
        { category: { contains: 'Jacket', mode: 'insensitive' } },
        { category: { contains: 'Sweatshirt', mode: 'insensitive' } },
        { category: { contains: 'Sweater', mode: 'insensitive' } }
      ];
    } else if (climate === 'Rainy') {
      weatherWhere.OR = [
        { category: { contains: 'Umbrella', mode: 'insensitive' } },
        { category: { contains: 'Raincoat', mode: 'insensitive' } },
        { category: { contains: 'Sweatshirt', mode: 'insensitive' } },
        { name: { contains: 'Umbrella', mode: 'insensitive' } },
        { name: { contains: 'Raincoat', mode: 'insensitive' } },
        { name: { contains: 'Waterproof', mode: 'insensitive' } },
        { material: { contains: 'Cotton', mode: 'insensitive' } }
      ];
    }

    const weatherPicks = await prisma.product.findMany({
      where: { ...weatherWhere, city: { equals: resolvedCity, mode: 'insensitive' } },
      orderBy: [{ weather_priority: 'desc' }, { rating: 'desc' }],
      take: 15
    });

    if (weatherPicks.length < 5) {
      const nationalWeather = await prisma.product.findMany({
        where: weatherWhere,
        orderBy: [{ weather_priority: 'desc' }, { rating: 'desc' }],
        take: 15
      });
      weatherPicks.push(...nationalWeather.filter(nw => !weatherPicks.find(wp => wp.id === nw.id)));
    }

    // ── BUDGET PICKS ──────────────────────────────────────────────────────────
    const budgetPicks = await prisma.product.findMany({
      where: {
        price: { lte: budget },
        gender: { contains: targetGender, mode: 'insensitive' },
        img: { not: '-' },
        status: 'Active'
      },
      orderBy: [{ rating: 'desc' }, { ratingTotal: 'desc' }],
      take: 15
    });

    // ── FESTIVAL PICKS ────────────────────────────────────────────────────────
    const activeFestival = getUpcomingFestival(resolvedState);
    let festivalPicks = [];

    if (activeFestival) {
      const orConditions = [];
      activeFestival.tags.forEach(tag => {
        orConditions.push({ occasion: { contains: tag, mode: 'insensitive' } });
        orConditions.push({ ethnic_style: { contains: tag, mode: 'insensitive' } });
        orConditions.push({ category: { contains: tag, mode: 'insensitive' } });
        orConditions.push({ name: { contains: tag, mode: 'insensitive' } });
      });

      festivalPicks = await prisma.product.findMany({
        where: {
          OR: orConditions,
          gender: { contains: targetGender, mode: 'insensitive' },
          img: { not: '-' },
          status: 'Active'
        },
        orderBy: { rating: 'desc' },
        take: 15
      });
    }

    // ── VERIFIED PICKS (Bayesian — per-category stats) ────────────────────────
    const verifiedCandidates = await prisma.product.findMany({
      where: {
        price: { lte: budget },
        gender: { contains: targetGender, mode: 'insensitive' },
        img: { not: '-' },
        status: 'Active'
      },
      take: 200
    });

    const statsCache = await getStatsByCategory();
    const scoredVerified = getTopItemsWithDiscovery(verifiedCandidates, statsCache, { topN: 15, priceAdjusted: false });

    // ── TRENDING ──────────────────────────────────────────────────────────────
    const recentPurchases = await prisma.purchase.findMany({
      where: { stateName: resolvedState },
      include: { Product: true },
      take: 1000
    });

    const productCounts = {};
    recentPurchases.forEach(p => {
      if (p.Product && (!p.Product.gender || p.Product.gender.toLowerCase().includes(targetGender.toLowerCase()))) {
        productCounts[p.productId] = (productCounts[p.productId] || 0) + 1;
      }
    });

    const trendingProductIds = Object.keys(productCounts)
      .sort((a, b) => productCounts[b] - productCounts[a])
      .slice(0, 15);

    let trendingPicks = [];
    if (trendingProductIds.length > 0) {
      trendingPicks = await prisma.product.findMany({
        where: { id: { in: trendingProductIds }, img: { not: '-' }, status: 'Active' }
      });
      trendingPicks = trendingPicks.sort((a, b) => productCounts[b.id] - productCounts[a.id]);
    }

    // ── NATIONAL CATALOG FALLBACK (when no local sellers) ────────────────────
    // Used only when localPicks is empty
    let nationalCatalogFallback = [];
    if (!hasLocalSellers) {
      nationalCatalogFallback = await prisma.product.findMany({
        where: {
          gender: { contains: targetGender, mode: 'insensitive' },
          img: { not: '-' },
          status: 'Active',
          source: 'imported'
        },
        orderBy: [{ rating: 'desc' }, { ratingTotal: 'desc' }],
        take: 15
      });
    }

    // ── BUILD SHELVES ─────────────────────────────────────────────────────────
    const dynamicShelves = [];

    // 0. Local Boutiques — only real local sellers
    if (hasLocalSellers) {
      let localTitle = `🏪 Local Boutiques in ${resolvedCity}`;
      if (localTier === 'district') localTitle = `🏪 Local Boutiques Near ${resolvedCity}`;
      if (localTier === 'state') localTitle = `🏪 Local Boutiques in ${resolvedState}`;

      dynamicShelves.push({
        title: localTitle,
        type: 'local',
        isLocalSeller: true,
        products: localPicks.map(p => ({ ...p, reason: `✓ Ships locally from ${p.city || resolvedCity}` }))
      });
    } else {
      // No local sellers — show national catalog without "ships locally" label
      dynamicShelves.push({
        title: `🏪 Explore Products`,
        type: 'local',
        isLocalSeller: false,
        noLocalSellers: true,
        products: nationalCatalogFallback.map(p => ({ ...p, reason: null }))
      });
    }

    // 1. Weather Shelf
    if (weatherPicks.length > 0) {
      dynamicShelves.push({
        title: `🌡️ ${climate} Climate Comfort`,
        type: 'weather',
        products: weatherPicks.map(p => ({ ...p, reason: `✓ Perfect for ${climate.toLowerCase()} weather` }))
      });
    }

    // 2. Festival Shelf
    if (activeFestival && festivalPicks.length > 0) {
      dynamicShelves.push({
        title: `✨ ${activeFestival.name} in ${activeFestival.daysLeft} days`,
        type: 'festival',
        products: festivalPicks.map(p => ({ ...p, reason: `✓ Trending for ${activeFestival.name}` }))
      });
    }

    // 3. Trending Around You
    if (trendingPicks.length > 0) {
      dynamicShelves.push({
        title: `🔥 Trending in ${resolvedState}`,
        type: 'trending',
        products: trendingPicks.map(p => ({ ...p, reason: `✓ Bought ${productCounts[p.id]} times in ${resolvedState} recently` }))
      });
    }

    // 4. Verified Picks
    if (scoredVerified.length > 0) {
      dynamicShelves.push({
        title: `⭐ Verified Picks For You`,
        type: 'verified',
        products: scoredVerified.map(p => ({ ...p, reason: `✓ Highly rated by verified buyers` }))
      });
    }

    // 5. Under Budget
    if (budgetPicks.length > 0) {
      dynamicShelves.push({
        title: `💰 Under ₹${budget}`,
        type: 'budget',
        products: budgetPicks.map(p => ({ ...p, reason: `✓ Under your ₹${budget} budget` }))
      });
    }

    res.json({
      context: {
        city: resolvedCity, state: resolvedState, temperature, climate, targetGender, budget,
        festival: activeFestival ? { name: activeFestival.name, daysLeft: activeFestival.daysLeft } : null
      },
      dynamicShelves
    });

  } catch (error) {
    console.error('Error fetching shelves:', error);
    res.status(500).json({ error: 'Failed to generate shelves' });
  }
});

app.get('/api/homepage/budget-picks', async (req, res) => {
  try {
    const { gender, maxPrice } = req.query;
    const targetGender = gender || 'Men';
    const budget = parseFloat(maxPrice) || 2000;

    const candidates = await prisma.product.findMany({
      where: {
        price: { lte: budget },
        gender: { contains: targetGender, mode: 'insensitive' },
        img: { not: '-' },
        status: 'Active'
      },
      take: 200
    });

    const statsCache = await getStatsByCategory();
    const budgetPicks = getTopItemsWithDiscovery(candidates, statsCache, {
      topN: 15, priceAdjusted: false, budget
    });

    res.json({ budgetPicks });
  } catch (error) {
    console.error('Error fetching budget picks:', error);
    res.status(500).json({ error: 'Failed to generate budget picks' });
  }
});

// ─── Bayesian Budget Shelf API ────────────────────────────────────────────────
// GET /api/shelf?budget=1500&gender=Women&priceAdjusted=true&n=12
app.get('/api/shelf', authenticateToken, async (req, res) => {
  try {
    const budget = parseFloat(req.query.budget);
    if (!budget || budget <= 0) {
      return res.status(400).json({ error: 'Invalid budget. Pass ?budget=<positive number>' });
    }

    const gender = req.query.gender || req.user?.gender || 'Men';
    const priceAdjusted = req.query.priceAdjusted === 'true';
    const topN = Math.min(parseInt(req.query.n) || 12, 50);

    // Fetch candidate products under budget
    const candidates = await prisma.product.findMany({
      where: {
        price: { lte: budget },
        gender: { contains: gender, mode: 'insensitive' },
        img: { not: '-' },
        status: 'Active'
      },
      include: { Reviews: { select: { rating: true, createdAt: true } } },
      take: 500
    });

    // Apply recency-decayed rating to items that have review rows
    const enriched = candidates.map(item => {
      if (item.Reviews && item.Reviews.length > 0) {
        const { avgRating, effectiveVotes } = computeDecayedRating(item.Reviews);
        return {
          ...item,
          rating: parseFloat(avgRating.toFixed(2)),
          ratingTotal: Math.round(effectiveVotes),
          Reviews: undefined
        };
      }
      const { Reviews: _, ...rest } = item;
      return rest;
    });

    const statsCache = await getStatsByCategory();
    const shelf = getTopItemsWithDiscovery(enriched, statsCache, { topN, priceAdjusted, budget });

    // Strip valueScore from response
    const response = shelf.map(({ valueScore, ...p }) => p);

    res.json({
      shelf: response,
      meta: {
        budget,
        gender,
        priceAdjusted,
        total: response.length,
        globalC: parseFloat(statsCache.global.C.toFixed(2)),
        globalM: statsCache.global.m,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('/api/shelf error:', error);
    res.status(500).json({ error: 'Failed to generate shelf' });
  }
});

// ─── Seller Routes ────────────────────────────────────────────────────────────
app.get('/api/seller/dashboard', authenticateToken, requireRole('SELLER'), async (req, res) => {
  try {
    const { city, state } = req.user;

    const popularSearches = await prisma.searchQuery.groupBy({
      by: ['type'],
      where: { state, type: { not: 'NA' } },
      _count: { type: true },
      orderBy: { _count: { type: 'desc' } },
      take: 6
    });

    const marketInsights = await Promise.all(popularSearches.map(async (search) => {
      const keyword = search.type;
      const searchVolume = search._count.type;

      const supplyCount = await prisma.product.count({
        where: {
          city: city,
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
          ? `High demand for '${keyword}' detected in ${city} with critical supply shortage. Add stock immediately!`
          : `Market is saturated with '${keyword}'. Compete on price or add unique variations.`
      };
    }));

    res.json({ sellerRegion: { city, state }, marketInsights });
  } catch (error) {
    console.error('Seller dashboard error:', error);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

app.get('/api/seller/products', authenticateToken, requireRole('SELLER'), async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { sellerId: req.user.id },
      orderBy: { id: 'desc' }
    });
    const mapped = products.map(p => ({ ...p, images: p.img, description: p.purl }));
    res.json({ products: mapped });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.post('/api/seller/products', authenticateToken, requireRole('SELLER'), upload.array('images', 5), async (req, res) => {
  try {
    const { name, description, price, mrp, stock, gender, category, material, occasion } = req.body;

    const nameStr = name.toLowerCase();
    let macroCategory = enrichment.extractMacroCategory(nameStr, category);
    let season = enrichment.extractSeason(nameStr, category, material);
    let climate = enrichment.extractClimate(nameStr, category, material);
    let finalOccasion = occasion || enrichment.extractOccasion(nameStr, category);
    const priceSegment = enrichment.computePriceSegment(parseFloat(price) || 0);

    try {
      const llmResult = await llmEnrichment.extractIntelligence(
        { name, description, category, material },
        { city: req.user.city, state: req.user.state }
      );
      if (llmResult) {
        macroCategory = llmResult.macroCategory || macroCategory;
        season = llmResult.season || season;
        climate = llmResult.climate || climate;
        finalOccasion = llmResult.occasion || finalOccasion;
      }
    } catch (llmErr) {
      console.warn("LLM Overfailing securely to heuristic bounds:", llmErr);
    }

    const imagePaths = req.files ? req.files.map(f => f.path).join(';') : '';

    const product = await prisma.product.create({
      data: {
        id: 'seller_' + Date.now().toString(),
        sellerId: req.user.id,
        name,
        purl: description || '',
        price: parseFloat(price) || 0,
        mrp: parseFloat(mrp) || 0,
        img: imagePaths,
        asin: req.user.businessName,
        rating: 0,
        ratingTotal: 0,
        gender,
        category,
        material,
        occasion: finalOccasion,
        macro_category: macroCategory,
        season,
        climate,
        price_segment: priceSegment,
        city: req.user.city,
        state: req.user.state,
        pincode: req.user.pincode,
        status: 'Pending',   // Requires admin approval
        source: 'seller',
        remainingStock: parseInt(stock, 10) || 50,
        weather_priority: 999,
        festival_priority: 999
      }
    });

    res.json({ message: 'Product submitted for admin approval', product });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

app.post('/api/seller/category-request', authenticateToken, requireRole('SELLER'), upload.single('sampleImage'), async (req, res) => {
  try {
    const { categoryName, gender, isSeasonal, origin, description } = req.body;
    let sampleImageUrl = null;
    if (req.file && req.file.path) {
      sampleImageUrl = req.file.path;
    }

    const request = await prisma.categoryRequest.create({
      data: {
        sellerId: req.user.id,
        categoryName,
        gender,
        isSeasonal: isSeasonal === 'true' || isSeasonal === true,
        origin,
        description,
        sampleImageUrl
      }
    });

    res.json({ message: 'Category request submitted successfully', request });
  } catch (error) {
    console.error('Error submitting category request:', error);
    res.status(500).json({ error: 'Failed to submit request' });
  }
});

app.get('/api/seller/category-requests', authenticateToken, requireRole('SELLER'), async (req, res) => {
  try {
    const requests = await prisma.categoryRequest.findMany({
      where: { sellerId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ requests });
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

app.delete('/api/seller/products/:id', authenticateToken, requireRole('SELLER'), async (req, res) => {
  try {
    await prisma.product.deleteMany({
      where: { id: req.params.id, sellerId: req.user.id }
    });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Seller Feedback: complaints received + warnings from admin
app.get('/api/seller/feedback', authenticateToken, requireRole('SELLER'), async (req, res) => {
  try {
    const sellerId = req.user.id;

    // Get all seller product IDs
    const sellerProducts = await prisma.product.findMany({
      where: { sellerId },
      select: { id: true, name: true }
    });
    const productIds = sellerProducts.map(p => p.id);

    // Get all reviews/complaints for seller products
    const reviews = await prisma.review.findMany({
      where: { productId: { in: productIds } },
      include: { User: { select: { name: true, city: true } }, Product: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });

    // Get admin warnings
    const warnings = await prisma.sellerWarning.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' }
    });

    // Stats
    const totalReviews = reviews.length;
    const complaints = reviews.filter(r => r.isComplaint).length;
    const complaintRatio = totalReviews > 0 ? Math.round((complaints / totalReviews) * 100) : 0;

    res.json({ reviews, warnings, stats: { totalReviews, complaints, complaintRatio } });
  } catch (error) {
    console.error('Seller feedback error:', error);
    res.status(500).json({ error: 'Failed to load feedback' });
  }
});

app.get('/api/seller/analytics', authenticateToken, requireRole('SELLER'), async (req, res) => {
  try {
    const sellerId = req.user.id;

    const demand = await prisma.purchase.groupBy({
      by: ["productId"],
      where: { sellerId },
      _sum: { quantity: true, priceAtPurchase: true },
      _count: { _all: true },
      orderBy: { _sum: { quantity: "desc" } },
    });

    const productIds = demand.map(d => d.productId);
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } });

    const productDemand = demand.map(d => {
      const product = products.find(p => p.id === d.productId);
      return {
        productId: d.productId,
        name: product?.name ?? "Unknown product",
        category: product?.category ?? "Uncategorized",
        img: product?.img,
        unitsSold: d._sum.quantity ?? 0,
        revenue: (d._sum.priceAtPurchase ?? 0) * (d._sum.quantity ?? 0),
        orderCount: d._count._all,
        remainingStock: product?.remainingStock ?? 0,
      };
    });

    const totals = {
      totalUnits: productDemand.reduce((sum, p) => sum + p.unitsSold, 0),
      totalRevenue: productDemand.reduce((sum, p) => sum + p.revenue, 0),
      totalOrders: productDemand.reduce((sum, p) => sum + p.orderCount, 0),
    };

    const categoryMap = new Map();
    productDemand.forEach(p => {
      if (p.unitsSold > 0) {
        let cat = p.category;
        if (!cat || cat.toUpperCase() === 'NA') cat = 'Other';
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + p.unitsSold);
      }
    });

    const categoryBreakdown = Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const since = new Date();
    since.setDate(since.getDate() - 14);

    const purchases = await prisma.purchase.findMany({
      where: { sellerId, createdAt: { gte: since } },
      select: { createdAt: true, quantity: true },
    });

    const buckets = new Map();
    for (let i = 0; i < 14; i++) {
      const d = new Date(since);
      d.setDate(d.getDate() + i);
      buckets.set(d.toISOString().slice(0, 10), 0);
    }

    for (const p of purchases) {
      const key = p.createdAt.toISOString().slice(0, 10);
      buckets.set(key, (buckets.get(key) ?? 0) + p.quantity);
    }
    const trend = Array.from(buckets.entries()).map(([date, units]) => ({ date, units }));

    const lowStock = productDemand
      .filter(p => p.remainingStock <= 5 && p.unitsSold > 0)
      .sort((a, b) => a.remainingStock - b.remainingStock);

    res.json({ totals, productDemand, trend, lowStock, categoryBreakdown });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to load analytics" });
  }
});

// ─── Purchase Route ───────────────────────────────────────────────────────────
app.post('/api/purchase', authenticateToken, async (req, res) => {
  try {
    const { productId, quantity = 1, cityName, stateName } = req.body;

    if (!productId || !cityName) {
      return res.status(400).json({ success: false, error: "productId and cityName are required" });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });

    if (!product) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    if (product.remainingStock < quantity) {
      return res.status(400).json({ success: false, error: "Not enough stock" });
    }

    const [purchase, updatedProduct] = await prisma.$transaction([
      prisma.purchase.create({
        data: {
          productId,
          sellerId: product.sellerId,
          userId: req.user?.id || null,
          quantity,
          priceAtPurchase: product.price,
          cityName,
          stateName: stateName ?? "Uttar Pradesh",
        },
      }),
      prisma.product.update({
        where: { id: productId },
        data: {
          remainingStock: { decrement: quantity },
          ...(product.remainingStock - quantity <= 0 ? { status: "OutOfStock" } : {}),
        },
      }),
    ]);

    return res.json({ success: true, purchase, remainingStock: updatedProduct.remainingStock });
  } catch (error) {
    console.error('Purchase error:', error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// ─── My Purchases (Customer Profile) ─────────────────────────────────────────
app.get('/api/purchases/my', authenticateToken, async (req, res) => {
  try {
    const purchases = await prisma.purchase.findMany({
      where: { userId: req.user.id },
      include: {
        Product: true,
        Reviews: { where: { userId: req.user.id } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ purchases });
  } catch (error) {
    console.error('My purchases error:', error);
    res.status(500).json({ error: 'Failed to load purchases' });
  }
});

// ─── Reviews ──────────────────────────────────────────────────────────────────
app.post('/api/reviews', authenticateToken, async (req, res) => {
  try {
    const { productId, purchaseId, rating, comment, isComplaint } = req.body;

    if (!productId || !purchaseId || !comment) {
      return res.status(400).json({ error: 'productId, purchaseId and comment are required' });
    }

    // Verify this purchase belongs to the user
    const purchase = await prisma.purchase.findFirst({
      where: { id: purchaseId, userId: req.user.id, productId }
    });
    if (!purchase) {
      return res.status(403).json({ error: 'You can only review products you have purchased' });
    }

    // Check for existing review
    const existing = await prisma.review.findFirst({
      where: { userId: req.user.id, purchaseId }
    });
    if (existing) {
      return res.status(400).json({ error: 'You have already reviewed this purchase' });
    }

    const review = await prisma.review.create({
      data: {
        userId: req.user.id,
        productId,
        purchaseId,
        rating: parseInt(rating) || 5,
        comment,
        isComplaint: isComplaint || false
      }
    });

    // Recalculate average rating and total reviews for the product
    const stats = await prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { id: true }
    });

    const avgRating = stats._avg.rating ? Math.round(stats._avg.rating * 10) / 10 : 0;
    const ratingTotal = stats._count.id || 0;

    await prisma.product.update({
      where: { id: productId },
      data: {
        rating: avgRating,
        ratingTotal: ratingTotal
      }
    });

    res.json({ message: 'Review submitted', review });
  } catch (error) {
    console.error('Review error:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

app.get('/api/reviews/product/:productId', async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { productId: req.params.productId },
      include: { User: { select: { name: true, city: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ reviews });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

app.get('/api/reviews/my', authenticateToken, async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { userId: req.user.id },
      include: { Product: { select: { name: true, img: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ reviews });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// ─── Admin Routes ─────────────────────────────────────────────────────────────
// Middleware for admin
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Requires ADMIN role' });
  }
  next();
}

// Pending products
app.get('/api/admin/products/pending', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { status: 'Pending', source: 'seller' },
      include: { Seller: { select: { name: true, email: true, city: true, businessName: true } } },
      orderBy: { id: 'desc' }
    });
    res.json({ products });
  } catch (error) {
    console.error('Admin pending products error:', error);
    res.status(500).json({ error: 'Failed to fetch pending products' });
  }
});

// Approve product
app.post('/api/admin/products/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { status: 'Active' }
    });
    res.json({ message: 'Product approved', product });
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve product' });
  }
});

// Reject product
app.post('/api/admin/products/:id/reject', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { status: 'Rejected' }
    });
    res.json({ message: 'Product rejected', product });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject product' });
  }
});

// All sellers with complaint stats
app.get('/api/admin/sellers', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const sellers = await prisma.user.findMany({
      where: { role: 'SELLER' },
      select: {
        id: true, name: true, email: true, city: true, state: true,
        businessName: true, isBlocked: true,
        Products: { select: { id: true } },
        WarningsReceived: { select: { id: true, type: true, message: true, createdAt: true } }
      }
    });

    const sellersWithStats = await Promise.all(sellers.map(async (seller) => {
      const productIds = seller.Products.map(p => p.id);
      const totalReviews = await prisma.review.count({ where: { productId: { in: productIds } } });
      const complaints = await prisma.review.count({ where: { productId: { in: productIds }, isComplaint: true } });
      const complaintRatio = totalReviews > 0 ? Math.round((complaints / totalReviews) * 100) : 0;
      const warningCount = seller.WarningsReceived.filter(w => w.type === 'WARNING').length;

      return {
        ...seller,
        totalProducts: seller.Products.length,
        totalReviews,
        complaints,
        complaintRatio,
        warningCount,
        canWarn: totalReviews >= 5 && complaintRatio > 20 && warningCount < 2 && !seller.isBlocked,
        canBlock: totalReviews >= 5 && complaintRatio > 40 && !seller.isBlocked
      };
    }));

    res.json({ sellers: sellersWithStats });
  } catch (error) {
    console.error('Admin sellers error:', error);
    res.status(500).json({ error: 'Failed to fetch sellers' });
  }
});

// Send warning to seller
app.post('/api/admin/sellers/:id/warn', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { message } = req.body;
    const sellerId = req.params.id;

    // Check warning count
    const warningCount = await prisma.sellerWarning.count({
      where: { sellerId, type: 'WARNING' }
    });
    if (warningCount >= 2) {
      return res.status(400).json({ error: 'Maximum 2 warnings already sent. Consider blocking the seller.' });
    }

    const warning = await prisma.sellerWarning.create({
      data: {
        sellerId,
        adminId: req.user.id,
        message: message || 'Your seller account has received excessive complaints from customers.',
        type: 'WARNING'
      }
    });

    res.json({ message: 'Warning sent', warning });
  } catch (error) {
    console.error('Warn seller error:', error);
    res.status(500).json({ error: 'Failed to send warning' });
  }
});

// Block seller
app.post('/api/admin/sellers/:id/block', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { message } = req.body;
    const sellerId = req.params.id;

    await prisma.user.update({
      where: { id: sellerId },
      data: { isBlocked: true }
    });

    await prisma.sellerWarning.create({
      data: {
        sellerId,
        adminId: req.user.id,
        message: message || 'Your seller account has been blocked due to excessive complaints (>40% complaint rate).',
        type: 'BLOCK'
      }
    });

    res.json({ message: 'Seller blocked successfully' });
  } catch (error) {
    console.error('Block seller error:', error);
    res.status(500).json({ error: 'Failed to block seller' });
  }
});

// Unblock seller
app.post('/api/admin/sellers/:id/unblock', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.params.id },
      data: { isBlocked: false }
    });
    res.json({ message: 'Seller unblocked' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to unblock seller' });
  }
});

// All reviews (admin view)
app.get('/api/admin/reviews', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      include: {
        User: { select: { name: true, email: true } },
        Product: { select: { name: true, sellerId: true, Seller: { select: { name: true } } } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    res.json({ reviews });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// ─── Search Route ─────────────────────────────────────────────────────────────
app.post('/api/search', authenticateToken, async (req, res) => {
  try {
    const { rawQuery, city, state } = req.body;
    const parsed = await searchIntelligence.parseSearchQuery(rawQuery);

    await prisma.searchQuery.create({
      data: {
        rawQuery,
        category: parsed.category ?? "NA",
        type: parsed.type ?? "NA",
        colour: parsed.colour ?? "NA",
        material: parsed.material ?? "NA",
        gender: parsed.gender ?? "NA",
        occasion: parsed.occasion ?? "NA",
        budget: String(parsed.budget ?? "NA"),
        city: city || req.user?.city || "Unknown",
        state: state || req.user?.state || "Unknown",
      },
    });

    const where = { status: "Active" };

    if (parsed.gender && parsed.gender !== "NA") where.gender = parsed.gender;
    if (parsed.occasion && parsed.occasion !== "NA") where.occasion = { contains: parsed.occasion, mode: "insensitive" };
    if (parsed.material && parsed.material !== "NA") where.material = { contains: parsed.material, mode: "insensitive" };
    if (parsed.budget && parsed.budget !== "NA" && !isNaN(Number(parsed.budget))) {
      where.price = { lte: Number(parsed.budget) };
    }

    const freeTextTerms = [parsed.category, parsed.type, parsed.colour].filter(t => t && t !== "NA");
    if (freeTextTerms.length) {
      where.OR = freeTextTerms.flatMap(term => [
        { name: { contains: term, mode: "insensitive" } },
        { category: { contains: term, mode: "insensitive" } },
        { ethnic_style: { contains: term, mode: "insensitive" } },
      ]);
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: [{ festival_priority: "desc" }, { rating: "desc" }],
      take: 30,
    });

    res.json({ parsed, products });
  } catch (error) {
    console.error('Search API error:', error);
    res.status(500).json({ error: "Failed to perform search" });
  }
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  await seedAdmin();
  await syncAllProductRatings();
});
