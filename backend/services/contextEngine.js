const { getWeather } = require('./weather');

const STATE_CLIMATE_DEFAULTS = {
  'Jammu & Kashmir': 'Cold',
  'Himachal Pradesh': 'Cold',
  'Uttarakhand': 'Cold',
  'Sikkim': 'Cold',
  'Arunachal Pradesh': 'Rainy',
  'Assam': 'Rainy',
  'Meghalaya': 'Rainy',
  'Kerala': 'Rainy',
  'Rajasthan': 'Hot',
  'Gujarat': 'Hot',
  'Madya Pradesh': 'Hot',
  'Tamil Nadu': 'Hot',
  'Andhra Pradesh': 'Hot',
  'Telangana': 'Hot',
  'Maharashtra': 'Neutral',
  'Karnataka': 'Neutral',
  'Delhi': 'Neutral',
  'West Bengal': 'Neutral'
};

async function buildContext(user, dbInfo = {}, lat = null, lon = null) {
  // 1. Fetch live weather & condition
  const weather = await getWeather(user.city, lat, lon);
  
  // 2. Fetch baseline state climate
  const defaultClimate = STATE_CLIMATE_DEFAULTS[user.state] || 'Neutral';

  // 3. Resolve actual Context Climate (combining rules smoothly without LLM)
  let resolvedClimate = defaultClimate; 
  if (weather.condition === 'Hot' || weather.temp > 30) {
    resolvedClimate = 'Hot'; // Override if extremely high override today
  } else if (weather.condition === 'Rain' || weather.condition === 'Monsoon') {
    resolvedClimate = 'Rainy'; // A rainy day dictates fashion regardless of state baseline
  } else if (weather.condition === 'Cold' || weather.temp < 20) {
    resolvedClimate = 'Cold';
  } else if (defaultClimate === 'Cold' && weather.temp < 25) {
    // If it's Kashmir and 22 degrees (neutral weather), it's still "Cold" fashion-wise compared to baseline
    resolvedClimate = 'Cold';
  }

  return {
    climate: resolvedClimate,
    weatherInfo: weather,
    festival: dbInfo.festival || 'None', 
    festivalDaysAway: dbInfo.festivalDaysAway || 0,
    gender: user.gender,
    budgetMin: dbInfo.minBudget || 500,
    budgetMax: dbInfo.maxBudget || 2500
  };
}

module.exports = { buildContext };
