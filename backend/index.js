const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
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

  // Show only if within 45 days
  if (daysLeft <= 45) {
    return { name: upcoming[0].name, daysLeft, tags: upcoming[0].tags };
  }

  return null;
}

app.get('/api/cities', async (req, res) => {
  res.json([]);
});

app.post('/api/auth/register', async (req, res) => {
  const { email, password, role, name, city, state, gender } = req.body;
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
        state: state || 'Tamil Nadu'
      }
    });

    const payload = { id: user.id, email: user.email, role: user.role, gender: user.gender, city: user.city, state: user.state, name: user.name };
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

    const payload = { id: user.id, email: user.email, role: user.role, gender: user.gender, city: user.city, state: user.state, name: user.name };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    const { passwordHash: _, ...u } = user;
    res.json({ user: u, token });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  res.json({ user });
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

app.get('/api/homepage/shelves', async (req, res) => {
  try {
    const { city, state, gender, maxPrice } = req.query;
    const resolvedCity = city || 'Coimbatore';
    const resolvedState = state || 'Tamil Nadu';
    const targetGender = gender || 'Men'; // Default for demo
    const budget = parseFloat(maxPrice) || 2000;

    let climate = 'Hot'; // Fallback
    let temperature = 30;
    try {
      // 1. Geocoding
      let geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(resolvedCity)}&count=1`, {
        signal: AbortSignal.timeout(1500)
      });
      let geoData = await geoRes.json();
      if (geoData.results && geoData.results.length > 0) {
        let lat = geoData.results[0].latitude;
        let lon = geoData.results[0].longitude;

        // 2. Weather
        let weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`, {
          signal: AbortSignal.timeout(1500)
        });
        let weatherData = await weatherRes.json();
        if (weatherData.current_weather) {
          temperature = weatherData.current_weather.temperature;
          if (temperature < 20) climate = 'Cold';
          else if (temperature > 28) climate = 'Hot';
          else climate = 'Rainy'; // Just fallback mapping
        }
      }
    } catch (e) {
      console.error('Weather fetch failed', e);
    }

    // Weather Logic Builder
    let weatherWhere = {
      climate: climate,
      gender: { contains: targetGender, mode: 'insensitive' },
      img: { not: '-' }
    };

    // Explicit overrides for higher relevance based on climate
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
    }

    // Weather Picks
    const weatherPicks = await prisma.product.findMany({
      where: weatherWhere,
      orderBy: [
        { weather_priority: 'desc' },
        { rating: 'desc' }
      ],
      take: 15
    });

    // Budget Picks
    const budgetPicks = await prisma.product.findMany({
      where: {
        price: { lte: budget },
        gender: { contains: targetGender, mode: 'insensitive' },
        img: { not: '-' }
      },
      orderBy: [
        { rating: 'desc' },
        { ratingTotal: 'desc' }
      ],
      take: 15
    });

    // Festival Picks logic - nearest upcoming festival
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
          img: { not: '-' }
        },
        orderBy: { rating: 'desc' },
        take: 15
      });
    }

    // Verified Picks (Bayesian logic)
    const verifiedPicks = await prisma.product.findMany({
      where: {
        price: { lte: budget },
        gender: { contains: targetGender, mode: 'insensitive' },
        img: { not: '-' }
      },
      take: 100
    });
    
    const m = 50;
    const C = 4.0;
    const scoredVerified = verifiedPicks.map(p => {
      const v = p.ratingTotal || 0;
      const R = p.rating || 0;
      const bayesianScore = ((v / (v + m)) * R) + ((m / (v + m)) * C);
      return { ...p, bayesianScore };
    }).sort((a, b) => b.bayesianScore - a.bayesianScore).slice(0, 15);

    // Trending Around You (State-wise purchases)
    const recentPurchases = await prisma.purchase.findMany({
      where: {
        stateName: resolvedState
      },
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
        where: { 
          id: { in: trendingProductIds },
          img: { not: '-' }
        }
      });
      // Reorder to match trending sort
      trendingPicks = trendingPicks.sort((a, b) => productCounts[b.id] - productCounts[a.id]);
    }

    // Build Dynamic Shelves Array
    const dynamicShelves = [];

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

    // 4. Verified Picks For You
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

    const budgetPicks = await prisma.product.findMany({
      where: {
        price: { lte: budget },
        gender: { contains: targetGender, mode: 'insensitive' }
      },
      orderBy: [
        { rating: 'desc' },
        { ratingTotal: 'desc' }
      ],
      take: 15
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
