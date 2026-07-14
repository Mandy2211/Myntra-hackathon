const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'bharat_ai_secret_key';

app.use(cors());
app.use(express.json());

// Auth Middleware to protect routes
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  if (!token) {
    return res.status(401).json({ error: 'Access token missing' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Role Validation Middleware (RBAC)
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: `Unauthorized: Requires ${role} role` });
    }
    next();
  };
}

// 1. Health check & index
app.get('/', (req, res) => {
  res.json({ message: 'Bharat AI Hackathon Backend is running!' });
});

// 2. Fetch list of cities and their contexts
app.get('/api/cities', async (req, res) => {
  try {
    const cities = await prisma.cityContext.findMany();
    res.json(cities);
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ error: 'Failed to fetch cities context' });
  }
});

const crypto = require('crypto');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// 3. User Registration
app.post('/api/auth/register', async (req, res) => {
  const { phone, password, role, name, city } = req.body;
  if (!phone || !password) {
    return res.status(400).json({ error: 'Phone number and password are required' });
  }

  // Validate role to customer or seller
  const targetRole = role === 'SELLER' ? 'SELLER' : 'CUSTOMER';

  try {
    const existingUser = await prisma.user.findUnique({
      where: { phone }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Phone number already registered' });
    }

    const passwordHash = hashPassword(password);
    const user = await prisma.user.create({
      data: {
        phone,
        passwordHash,
        role: targetRole,
        name: name || `${targetRole === 'SELLER' ? 'Seller' : 'Customer'} ${phone.slice(-4)}`,
        city: city || 'Coimbatore'
      }
    });

    // Sign JWT Token
    const payload = {
      id: user.id,
      phone: user.phone,
      role: user.role,
      city: user.city,
      name: user.name
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    // Exclude password hash
    const { passwordHash: _, ...userWithoutPassword } = user;
    res.status(201).json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'Failed to create user account' });
  }
});

// 3.1 User Login
app.post('/api/auth/login', async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    return res.status(400).json({ error: 'Phone number and password are required' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { phone }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid phone number or password' });
    }

    const inputHash = hashPassword(password);
    if (user.passwordHash !== inputHash) {
      return res.status(401).json({ error: 'Invalid phone number or password' });
    }

    // Sign JWT Token
    const payload = {
      id: user.id,
      phone: user.phone,
      role: user.role,
      city: user.city,
      name: user.name
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    // Exclude password hash
    const { passwordHash: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Failed during authenticating' });
  }
});

// 3.2 Get Current User Details
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const { passwordHash: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to retrieve profile info' });
  }
});

// 4. Hyperlocal storefront matching: cross-reference climate, season, and trends
app.get('/api/products/hyperlocal', async (req, res) => {
  const { city } = req.query;
  const activeCity = city || 'Coimbatore';

  try {
    // A. Fetch the city context
    const cityContext = await prisma.cityContext.findUnique({
      where: { cityName: activeCity }
    });

    if (!cityContext) {
      // If city doesn't exist, return default catalog list
      const fallbackProducts = await prisma.product.findMany({ take: 10 });
      return res.json({
        products: fallbackProducts,
        context: { cityName: activeCity, climate: 'moderate', activeFestival: 'None', prefers: [] }
      });
    }

    // B. Fetch all products
    const products = await prisma.product.findMany();

    // C. Rank products based on city's preferred tags, climate, and festival
    const preferredTags = cityContext.preferredTags || [];
    
    const rankedProducts = products.map(product => {
      let score = 0;
      
      // Award 2 points for every tag of the product that matches the city's preferred tags
      product.tags.forEach(tag => {
        if (preferredTags.includes(tag.toLowerCase())) {
          score += 2;
        }
      });

      // Special contextual checks:
      // If city has an active festival (e.g. Chhath Puja, Pongal) and product is traditional, boost it
      if (cityContext.activeFestival && cityContext.activeFestival !== 'None') {
        const textToMatch = (product.name + ' ' + product.category).toLowerCase();
        if (textToMatch.includes('traditional') || textToMatch.includes('ethnic') || textToMatch.includes('saree') || textToMatch.includes('kurta')) {
          score += 5;
        }
      }

      // Climate boosts
      if (cityContext.climate === 'humid' || cityContext.climate === 'hot') {
        if (product.tags.includes('linen') || product.tags.includes('cotton') || product.tags.includes('lightweight')) {
          score += 3;
        }
      } else if (cityContext.climate === 'cool') {
        if (product.tags.includes('wool') || product.tags.includes('denim') || product.tags.includes('jacket')) {
          score += 3;
        }
      }

      return { ...product, relevanceScore: score };
    });

    // Sort by relevance score descending, then rating descending
    rankedProducts.sort((a, b) => b.relevanceScore - a.relevanceScore || b.rating - a.rating);

    res.json({
      products: rankedProducts,
      context: cityContext
    });
  } catch (error) {
    console.error('Error fetching hyperlocal homepage:', error);
    res.status(500).json({ error: 'Failed to compile hyperlocal catalog' });
  }
});

// 5. Trending around you: group transactions in user's city
app.get('/api/products/trending', async (req, res) => {
  const { city } = req.query;
  const activeCity = city || 'Coimbatore';

  try {
    // A. Query purchase transactions grouped by product ID for this city
    const purchases = await prisma.purchase.groupBy({
      by: ['productId'],
      where: {
        cityName: activeCity
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 8
    });

    // B. Fetch detailed product info for these top selling products
    const productIds = purchases.map(p => p.productId);
    
    let trendingProducts = [];
    if (productIds.length > 0) {
      const detailedProducts = await prisma.product.findMany({
        where: {
          id: { in: productIds }
        }
      });

      // Map back to maintain the sales count order
      trendingProducts = purchases.map(purchaseItem => {
        const prod = detailedProducts.find(d => d.id === purchaseItem.productId);
        return {
          ...prod,
          salesCount: purchaseItem._count.id
        };
      }).filter(item => item.id !== undefined);
    }

    // C. Fallback: if city has little to no purchases, fill with top rated catalog items
    if (trendingProducts.length < 4) {
      const fallbackLimit = 6 - trendingProducts.length;
      const fallbacks = await prisma.product.findMany({
        where: {
          id: { notIn: productIds }
        },
        orderBy: {
          rating: 'desc'
        },
        take: fallbackLimit
      });

      const mappedFallbacks = fallbacks.map(f => ({
        ...f,
        salesCount: Math.floor(Math.random() * 5) + 1 // Add small dummy counts for UI visual proof
      }));

      trendingProducts = [...trendingProducts, ...mappedFallbacks];
    }

    res.json(trendingProducts);
  } catch (error) {
    console.error('Error fetching trending products:', error);
    res.status(500).json({ error: 'Failed to aggregate trending statistics' });
  }
});

// 6. Personalised Budget Shelf endpoint utilizing Bayesian Ranking
app.get('/api/products/budget', async (req, res) => {
  const { maxPrice } = req.query;
  const budgetLimit = parseFloat(maxPrice) || 1000.0;

  try {
    // A. Query products within the strict budget limit
    const productsUnderBudget = await prisma.product.findMany({
      where: {
        price: {
          lte: budgetLimit
        }
      }
    });

    if (productsUnderBudget.length === 0) {
      return res.json([]);
    }

    // B. Fetch average rating (C) of the entire database to act as the prior in Bayesian formulation
    const aggregateRating = await prisma.product.aggregate({
      _avg: {
        rating: true
      }
    });
    
    const C = aggregateRating._avg.rating || 4.2; // Global average rating
    const m = 5; // Minimum number of reviews needed to weight the score heavily

    // C. Compute Bayesian Weighted Rating for each item
    // Bayesian Average Formula: (v / (v + m)) * R + (m / (v + m)) * C
    const rankedProducts = productsUnderBudget.map(product => {
      const v = product.ratingTotal || 0; // Number of reviews
      const R = product.rating || 0.0;     // Average rating
      
      const weightedRating = (v / (v + m)) * R + (m / (v + m)) * C;
      
      return {
        ...product,
        weightedRating: parseFloat(weightedRating.toFixed(4)),
        globalBenchmarkRating: parseFloat(C.toFixed(2))
      };
    });

    // D. Sort products by Bayesian Weighted Rating descending
    rankedProducts.sort((a, b) => b.weightedRating - a.weightedRating);

    res.json(rankedProducts);
  } catch (error) {
    console.error('Error calculating Bayesian budget shelf:', error);
    res.status(500).json({ error: 'Failed to compute Bayesian budget rankings' });
  }
});

// 7. Track User Purchase (creates immediate local trends)
app.post('/api/purchases', authenticateToken, async (req, res) => {
  const { productId, city } = req.body;
  if (!productId || !city) {
    return res.status(400).json({ error: 'ProductId and city are required' });
  }

  try {
    const purchase = await prisma.purchase.create({
      data: {
        productId,
        cityName: city
      },
      include: {
        product: true
      }
    });

    res.json({
      message: 'Purchase recorded!',
      purchase
    });
  } catch (error) {
    console.error('Error creating purchase record:', error);
    res.status(500).json({ error: 'Failed to record purchase' });
  }
});

// 8. Seller analytics hotspot mapper
app.get('/api/seller/analytics', authenticateToken, requireRole('SELLER'), async (req, res) => {
  const { seller } = req.query;
  if (!seller) {
    return res.status(400).json({ error: 'Seller query parameter is required' });
  }

  try {
    // Fetch purchases for products sold by this particular seller
    const purchases = await prisma.purchase.findMany({
      where: {
        product: {
          seller: {
            equals: seller,
            mode: 'insensitive' // case insensitive check
          }
        }
      },
      include: {
        product: true
      }
    });

    // Aggregate sales counts by city
    const cityCounts = {};
    purchases.forEach(p => {
      const city = p.cityName;
      cityCounts[city] = (cityCounts[city] || 0) + 1;
    });

    // Transform into clean chart array format
    const hotspots = Object.keys(cityCounts).map(cityName => ({
      city: cityName,
      sales: cityCounts[cityName]
    })).sort((a, b) => b.sales - a.sales);

    res.json({
      seller,
      totalSales: purchases.length,
      hotspots
    });
  } catch (error) {
    console.error('Error gathering seller insights:', error);
    res.status(500).json({ error: 'Failed to aggregate seller hotspot metadata' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
