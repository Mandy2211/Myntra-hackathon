const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CITY_COORDINATES = {
  'Mumbai': { lat: 19.0760, lon: 72.8777 },
  'Delhi': { lat: 28.7041, lon: 77.1025 },
  'Bangalore': { lat: 12.9716, lon: 77.5946 },
  'Coimbatore': { lat: 11.0168, lon: 76.9558 },
  'Patna': { lat: 25.5941, lon: 85.1376 },
  'Vizag': { lat: 17.6868, lon: 83.2185 },
  'Belgaum': { lat: 15.8497, lon: 74.4977 }
};

function mapWeatherCode(code, temp) {
  if (code <= 3) {
    if (temp > 30) return 'Hot';
    if (temp < 15) return 'Cold';
    return code === 0 ? 'Sunny' : 'Cloudy';
  }
  if (code >= 51 && code <= 99) return 'Rain';
  return 'Cloudy';
}

async function getWeather(city, lat = null, lon = null) {
  try {
    const cached = await prisma.weatherCache.findUnique({ where: { city } });
    const ONE_HOUR = 60 * 60 * 1000;
    
    if (cached && (Date.now() - new Date(cached.last_updated).getTime() < ONE_HOUR)) {
      // If we don't need highly granular exact lat/lon refresh this second, rely on cached city name
      return { temp: cached.temperature, condition: cached.weather };
    }

    let fetchLat = lat;
    let fetchLon = lon;
    if (!fetchLat || !fetchLon) {
      const coords = CITY_COORDINATES[city] || { lat: 20.59, lon: 78.96 }; // Default center India
      fetchLat = coords.lat;
      fetchLon = coords.lon;
    }
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${fetchLat}&longitude=${fetchLon}&current_weather=true`);
    const data = await response.json();
    
    const temp = data.current_weather.temperature;
    const condition = mapWeatherCode(data.current_weather.weathercode, temp);

    await prisma.weatherCache.upsert({
      where: { city },
      update: { temperature: temp, weather: condition, last_updated: new Date() },
      create: { city, temperature: temp, weather: condition }
    });

    return { temp, condition };
  } catch (error) {
    console.error('Weather error:', error);
    return { temp: 28, condition: 'Sunny' }; // Fallback
  }
}

module.exports = { getWeather };
