const API_BASE_URL = 'http://localhost:5000/api';

export const fetchCities = async () => {
  const res = await fetch(`${API_BASE_URL}/cities`);
  if (!res.ok) throw new Error('Failed to fetch cities');
  return res.json();
};

export const fetchHyperlocalProducts = async (city) => {
  const cityParam = encodeURIComponent(city);
  const res = await fetch(`${API_BASE_URL}/products/hyperlocal?city=${cityParam}`);
  if (!res.ok) throw new Error('Failed to fetch hyperlocal products');
  return res.json();
};

export const fetchTrendingProducts = async (city) => {
  const cityParam = encodeURIComponent(city);
  const res = await fetch(`${API_BASE_URL}/products/trending?city=${cityParam}`);
  if (!res.ok) throw new Error('Failed to fetch trending products');
  return res.json();
};

export const fetchBudgetProducts = async (limit) => {
  const res = await fetch(`${API_BASE_URL}/products/budget?maxPrice=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch budget products');
  return res.json();
};

export const fetchSellerAnalytics = async (sellerName, token) => {
  const sellerParam = encodeURIComponent(sellerName || 'Roadster');
  const res = await fetch(`${API_BASE_URL}/seller/analytics?seller=${sellerParam}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) throw new Error('Failed to fetch seller analytics');
  return res.json();
};

export const simulatePurchase = async (productId, city, token) => {
  const res = await fetch(`${API_BASE_URL}/purchases`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ productId, city })
  });
  if (!res.ok) throw new Error('Purchase failed');
  return res.json(); // if it returns any
};
