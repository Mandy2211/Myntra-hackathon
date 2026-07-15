const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'bharat_ai_secret_key';

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
      let geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(resolvedCity)}&count=1`);
      let geoData = await geoRes.json();
      if (geoData.results && geoData.results.length > 0) {
        let lat = geoData.results[0].latitude;
        let lon = geoData.results[0].longitude;

        // 2. Weather
        let weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
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

    // Weather Picks
    const weatherPicks = await prisma.product.findMany({
      where: {
        climate: climate,
        gender: { contains: targetGender, mode: 'insensitive' }
      },
      orderBy: { weather_priority: 'desc' },
      take: 15
    });

    // Budget Picks
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

    // Festival Picks logic - nearest upcoming festival
    const festivalPicks = await prisma.product.findMany({
      where: {
        OR: [
          { occasion: 'Festival' },
          { occasion: 'Festive' },
          { ethnic_style: 'Ethnic' }
        ],
        gender: { contains: targetGender, mode: 'insensitive' }
      },
      orderBy: { festival_priority: 'desc' },
      take: 15
    });

    res.json({
      context: {
        city: resolvedCity, state: resolvedState, temperature, climate, targetGender, budget
      },
      shelves: {
        weatherPicks,
        budgetPicks,
        festivalPicks
      }
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
  const hotspots = Object.keys(cityCounts).map(city => ({ city, sales: cityCounts[city] })).sort((a,b) => b.sales - a.sales);
  res.json({ seller, totalSales: purchases.length, hotspots });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
