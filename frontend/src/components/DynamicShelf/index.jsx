import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, MapPin, CloudRain, Sun, Cloud, Thermometer, Calendar, Star, Sliders, DollarSign, CloudSnow, Wind } from 'lucide-react';

export default function DynamicShelf() {
  const { user, token } = useAuth();
  
  const [shelfData, setShelfData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [minBudget, setMinBudget] = useState(500);
  const [maxBudget, setMaxBudget] = useState(2500);
  const [debouncedBudgetChange, setDebouncedBudgetChange] = useState({ min: 500, max: 2500 });
  
  const [activeFilter, setActiveFilter] = useState('All');
  const [genderOverride, setGenderOverride] = useState('');

  // Debounce the slider to prevent DDOSing the server
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedBudgetChange({ min: minBudget, max: maxBudget });
    }, 600);
    return () => clearTimeout(handler);
  }, [minBudget, maxBudget]);

  useEffect(() => {
    const fetchHomepage = async () => {
      setLoading(true);
      try {
        let url = `http://localhost:5000/api/homepage?minBudget=${debouncedBudgetChange.min}&maxBudget=${debouncedBudgetChange.max}`;
        if (user?.exactLocation) {
          url += `&lat=${user.exactLocation.lat}&lon=${user.exactLocation.lon}`;
        }
        if (genderOverride) {
          url += `&gender=${genderOverride}`;
        }
        
        const res = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch Dynamic Shelf');
        }
        
        setShelfData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (user && token) {
      fetchHomepage();
    }
  }, [user, token, debouncedBudgetChange, genderOverride]);

  const getWeatherIcon = (condition) => {
    if (condition === 'Rain' || condition === 'Monsoon') return <CloudRain className="w-4 h-4 text-sky-400" />;
    if (condition === 'Hot' || condition === 'Sunny') return <Sun className="w-4 h-4 text-yellow-400" />;
    if (condition === 'Cold' || condition === 'Winter') return <CloudSnow className="w-4 h-4 text-blue-200" />;
    return <Cloud className="w-4 h-4 text-slate-300" />;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading && !shelfData) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center space-y-4 py-32">
        <div className="w-12 h-12 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin"></div>
        <p className="text-pink-400 font-bold uppercase tracking-widest text-sm animate-pulse">Building your AI Shelf...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full flex items-center justify-center py-32">
        <div className="bg-rose-950/20 border border-rose-900/50 p-6 rounded-xl flex flex-col items-center max-w-md text-center">
          <p className="text-rose-450 font-semibold mb-2">Error loading shelf</p>
          <p className="text-slate-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!shelfData) return null;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-12 pb-24">
      
      {/* --- HOMEPAGE MVP GREETING BLOCK --- */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Sparkles className="w-32 h-32 text-pink-500" />
        </div>
        
        <div className="relative z-10 flex flex-col gap-6">
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
            {getGreeting()}, {user?.name.split(' ')[0]}
          </h2>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 border-t border-slate-700/50 pt-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-300 bg-slate-950/40 px-3 py-1.5 rounded-lg border border-slate-700/50">
              <MapPin className="w-4 h-4 text-pink-500" />
              {user?.city}
            </div>
            
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-300 bg-slate-950/40 px-3 py-1.5 rounded-lg border border-slate-700/50">
               {getWeatherIcon(shelfData.weatherInfo.condition)}
               {shelfData.weatherInfo.temp}°C • {shelfData.weatherInfo.condition}
            </div>
            
            {shelfData.festivalInfo && (
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-300 bg-slate-950/40 px-3 py-1.5 rounded-lg border border-slate-700/50">
                <Calendar className="w-4 h-4 text-purple-400" />
                {shelfData.festivalInfo.name} in {shelfData.festivalInfo.daysAway} days
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- FILTERS & BUDGET SLIDER --- */}
      <div className="flex flex-col md:flex-row gap-8 justify-between items-start md:items-center">
        
        <div className="flex flex-wrap gap-3 items-center">
          {['All', 'Festival', 'Weather', 'Near Me'].map(f => (
            <button 
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 border ${
                activeFilter === f 
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white border-transparent shadow-lg' 
                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-pink-500/50 hover:text-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
          
          <div className="hidden sm:block h-6 w-px bg-slate-700 mx-2"></div>
          
          <select
            value={genderOverride}
            onChange={(e) => setGenderOverride(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-300 text-xs font-semibold rounded-full px-4 py-2 outline-none focus:border-pink-500 transition-colors cursor-pointer appearance-none text-center"
          >
            <option value="">Target: {user?.gender} (You)</option>
            <option value="Men">Target: Men</option>
            <option value="Women">Target: Women</option>
            <option value="Kids">Target: Kids</option>
            <option value="Unisex">Target: Unisex</option>
          </select>
        </div>

        <div className="w-full md:w-96 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex justify-between items-center w-full">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Budget Shelf Limits
            </span>
            <span className="text-xs font-bold text-pink-400">₹{minBudget} - ₹{maxBudget}</span>
          </div>
          
          <div className="relative pt-1 flex items-center gap-3 w-full">
            <span className="text-xs text-slate-500">₹500</span>
            <input 
              type="range" min="500" max="2500" step="100" 
              value={maxBudget} 
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (val >= minBudget) setMaxBudget(val);
              }}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
            />
            <span className="text-xs text-slate-500">₹2500+</span>
          </div>
          {loading && <div className="text-[10px] text-slate-500 text-center animate-pulse">Syncing...</div>}
        </div>
        
      </div>

      {/* --- DYNAMIC SHELVES DIRECT RENDER --- */}
      <div className="space-y-16">
        {shelfData.shelves.filter(s => activeFilter === 'All' || activeFilter === 'Near Me' || s.title.includes(activeFilter)).map(section => (
          <div key={section.id} className="space-y-6">
            <div className="flex flex-col">
              <h3 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                {section.title.includes("Festival") && <Calendar className="w-6 h-6 text-purple-400" />}
                {section.title.includes("Weather") && <Sun className="w-6 h-6 text-yellow-400" />}
                {section.title.includes("Budget") && <DollarSign className="w-6 h-6 text-emerald-400" />}
                {section.title}
              </h3>
            </div>
            
            {section.products.length === 0 ? (
              <div className="text-center py-8 bg-slate-900 rounded-2xl border border-slate-800 text-slate-500 text-sm">
                No products found in this category right now. Try expanding your filters.
              </div>
            ) : (
              <div className="flex overflow-x-auto pb-6 gap-6 hide-scrollbar snap-x scroll-smooth">
                {section.products.map(product => (
                  <div 
                    key={product.id} 
                    className="min-w-[200px] max-w-[200px] sm:min-w-[240px] sm:max-w-[240px] snap-start bg-slate-900 rounded-xl overflow-hidden border border-slate-800 hover:border-pink-500/50 transition-all duration-300 group flex flex-col cursor-pointer"
                  >
                    <div className="relative h-56 sm:h-64 overflow-hidden bg-slate-800">
                      <img 
                        src={product.img} 
                        alt={product.name} 
                        className="w-full h-full object-cover transition duration-700 group-hover:scale-110"
                        loading="lazy"
                        onError={(e) => { e.target.src = 'https://placehold.co/240x350/1e293b/ec4899?text=Bharat+AI' }}
                      />
                      
                      <div className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-bold text-emerald-400 flex items-center gap-1 border border-slate-700/50">
                        {parseFloat(product.rating || 0).toFixed(1)} ★
                      </div>
                    </div>
                    
                    <div className="p-4 flex flex-col flex-1">
                      <h4 className="font-bold text-slate-200 text-sm line-clamp-2 group-hover:text-pink-400 transition leading-snug" title={product.name}>
                        {product.name}
                      </h4>
                      
                      <div className="mt-auto pt-3 flex items-baseline gap-2">
                        <span className="text-lg font-bold text-slate-100">₹{product.price}</span>
                        {product.price < product.mrp && (
                          <span className="text-xs text-slate-500 mx-1 line-through">₹{product.mrp}</span>
                        )}
                        {product.discount && product.discount !== '0' && (
                          <span className="text-[10px] font-bold text-pink-500 bg-pink-500/10 px-1.5 py-0.5 rounded ml-auto">
                            {product.discount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
