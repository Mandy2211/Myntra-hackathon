const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');


const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'bharat_ai_secret_key';

// --- Auth Middleware ---
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token missing' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token invalid' });
    req.user = user;
    next();
  });
}

// --- Auth Routes ---
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, gender, city, state, language } = req.body;
  if (!email || !password || !name || !gender || !city || !state || !language) {
    return res.status(400).json({ error: 'All fields required' });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email registered' });

    const user = await prisma.user.create({
      data: { name, email, password, gender, city, state, language }
    });
    
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ user, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user, token });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  res.json({ user });
});

app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  const { city, state } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { city, state }
    });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Dynamic Shelf Engine ---
const { buildShelf } = require('./services/shelfBuilder');
const { buildContext } = require('./services/contextEngine');

app.get('/api/homepage', authenticateToken, async (req, res) => {
  const { minBudget = 500, maxBudget = 2500, lat, lon } = req.query;

  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // 1. Fetch auxiliary DB info
    const upcomingFestivals = await prisma.festivalCalendar.findMany({
      where: {
        OR: [{ state: user.state }, { state: 'All' }],
        start_date: { gte: new Date() }
      },
      orderBy: { start_date: 'asc' }
    });

    let selectedFestival = null;
    
    // Split into categories based on our new Seed logic
    const localFests = upcomingFestivals.filter(f => f.type === 'Local');
    const normalFests = upcomingFestivals.filter(f => f.type === 'Normal');

    const getDays = (f) => Math.ceil((f.start_date.getTime() - Date.now())/(1000*60*60*24));

    const closestLocal = localFests[0];
    const closestNormal = normalFests[0];

    // Priority Engine: Local if < 45 days. Else Normal if < 45 days. Else whatever is closest.
    if (closestLocal && getDays(closestLocal) <= 45) {
      selectedFestival = closestLocal;
    } else if (closestNormal && getDays(closestNormal) <= 45) {
      selectedFestival = closestNormal;
    } else {
      selectedFestival = closestLocal || closestNormal || upcomingFestivals[0] || null;
    }

    const dbInfo = {
      festival: selectedFestival ? selectedFestival.festival_name : null,
      festivalDaysAway: selectedFestival ? getDays(selectedFestival) : 0,
      minBudget, maxBudget
    };

    // 2. Build Unified Context Profile
    const context = await buildContext(user, dbInfo, lat, lon);

    // 3. Render Shelves dynamically using clean Context
    const activeGender = req.query.gender || context.gender;

    const festivalShelf = await buildShelf({
      title: "Festival Picks",
      filters: {
        occasion: "Festival",
        macro_category: "Clothing",
        gender: activeGender
      }
    }, context);

    const weatherShelf = await buildShelf({
      title: "Weather Picks",
      filters: {
        climate: context.climate,
        macro_category: "Clothing",
        gender: activeGender
      }
    }, context);

    const budgetShelf = await buildShelf({
      title: "Budget Fits",
      filters: {
        price: { min: context.budgetMin, max: context.budgetMax },
        macro_category: "Clothing",
        gender: activeGender
      }
    }, context);

    res.json({
      weatherInfo: context.weatherInfo,
      festivalInfo: context.festival ? { name: context.festival, daysAway: context.festivalDaysAway } : null,
      shelves: [festivalShelf, weatherShelf, budgetShelf]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to build dynamic homepage' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
