import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, MapPin, CloudRain, Sun, Cloud, Thermometer, Calendar, Star, Sliders, DollarSign, CloudSnow, Wind } from 'lucide-react';
import BudgetShelf from '../BudgetShelf';

export default function DynamicShelf() {
  const { user, token } = useAuth();
  
  const [shelfData, setShelfData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [budget, setBudget] = useState(2000);
  const [debouncedBudget, setDebouncedBudget] = useState(2000);
  
  const [activeFilter, setActiveFilter] = useState('All');
  const [genderOverride, setGenderOverride] = useState('');

  // Debounce the slider to prevent DDOSing the server
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedBudget(budget), 600);
    return () => clearTimeout(handler);
  }, [budget]);

  useEffect(() => {
    const fetchHomepage = async () => {
      setLoading(true);
      try {
        let url = `http://localhost:5000/api/homepage?minBudget=0&maxBudget=${debouncedBudget}`;
        if (user?.exactLocation) {
          url += `&lat=${user.exactLocation.lat}&lon=${user.exactLocation.lon}`;
        }
        if (genderOverride) {
          url += `&gender=${genderOverride}`;
        }
        
        const res = await fetch(url, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || 'Failed to fetch Dynamic Shelf');
        
        setShelfData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (user && token) fetchHomepage();
  }, [user, token, debouncedBudget, genderOverride]);

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

  const handleBuy = async (productId, cityName, stateName) => {
    try {
      const res = await fetch("http://localhost:5000/api/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1, cityName, stateName }),
      });

      const data = await res.json();

      if (data.success) {
        alert(`Order placed. ${data.remainingStock} left in stock.`);
      } else {
        alert(data.error ?? "Purchase failed");
      }
    } catch (err) {
      alert("Purchase failed");
    }
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

      {/* --- FILTERS & SHARED BUDGET SLIDER --- */}
      <div className="flex flex-col gap-5">

        {/* Filter pills + gender */}
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

          <div className="hidden sm:block h-6 w-px bg-slate-700 mx-2" />

          <select
            value={genderOverride}
            onChange={e => setGenderOverride(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-300 text-xs font-semibold rounded-full px-4 py-2 outline-none focus:border-pink-500 transition-colors cursor-pointer appearance-none text-center"
          >
            <option value="">Target: {user?.gender} (You)</option>
            <option value="Men">Target: Men</option>
            <option value="Women">Target: Women</option>
            <option value="Kids">Target: Kids</option>
            <option value="Unisex">Target: Unisex</option>
          </select>
        </div>

        {/* Single unified budget slider */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-2xl px-5 py-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-pink-500" />
              Max Budget — all shelves
            </span>
            <span className="text-base font-black text-pink-600 dark:text-pink-400">₹{budget.toLocaleString('en-IN')}</span>
          </div>
          <input
            type="range"
            min={100}
            max={10000}
            step={50}
            value={budget}
            onChange={e => setBudget(parseInt(e.target.value))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #ec4899 ${(budget - 100) / (10000 - 100) * 100}%, #cbd5e1 ${(budget - 100) / (10000 - 100) * 100}%)`
            }}
          />
          <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-600 mt-2 font-medium">
            <span>₹100</span><span>₹2,500</span><span>₹5,000</span><span>₹10,000</span>
          </div>
          {loading && <p className="text-[10px] text-slate-500 text-center mt-1 animate-pulse">Syncing shelves...</p>}
        </div>

      </div>

      {/* --- DYNAMIC SHELVES DIRECT RENDER --- */}
      <div className="space-y-16">
        {shelfData.shelves.filter(s => activeFilter === 'All' || activeFilter === 'Near Me' || s.title.includes(activeFilter)).map(section => (
          <div key={section.id} className="space-y-6">
            <div className="flex flex-col">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                {section.title.includes("Festival") && <Calendar className="w-6 h-6 text-purple-400" />}
                {section.title.includes("Weather") && <Sun className="w-6 h-6 text-yellow-400" />}
                {section.title.includes("Budget") && <DollarSign className="w-6 h-6 text-emerald-400" />}
                {section.title}
              </h3>
            </div>
            
            {section.products.length === 0 ? (
              <div className="text-center py-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 text-sm">
                No products found in this category right now. Try expanding your filters.
              </div>
            ) : (
              <div className="flex overflow-x-auto pb-6 gap-6 hide-scrollbar snap-x scroll-smooth">
                {section.products.map(product => (
                  <div 
                    key={product.id} 
                    className="min-w-[200px] max-w-[200px] sm:min-w-[240px] sm:max-w-[240px] snap-start bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-pink-500/50 shadow-sm dark:shadow-none hover:shadow-md transition-all duration-300 group flex flex-col cursor-pointer"
                  >
                    <div className="relative h-56 sm:h-64 overflow-hidden bg-slate-100 dark:bg-slate-800">
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
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm line-clamp-2 group-hover:text-pink-500 transition leading-snug" title={product.name}>
                        {product.name}
                      </h4>
                      
                      <div className="mt-auto pt-3 flex items-baseline gap-2">
                        <span className="text-lg font-bold text-slate-900 dark:text-slate-100">₹{product.price}</span>
                        {product.price < product.mrp && (
                          <span className="text-xs text-slate-500 mx-1 line-through">₹{product.mrp}</span>
                        )}
                        {product.discount && product.discount !== '0' && (
                          <span className="text-[10px] font-bold text-pink-500 bg-pink-500/10 px-1.5 py-0.5 rounded ml-auto">
                            {product.discount}
                          </span>
                        )}
                      </div>
                      
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBuy(product.id, user?.city, user?.state);
                        }}
                        disabled={product.remainingStock === 0}
                        className="mt-3 w-full py-2 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {product.remainingStock === 0 ? "Out of stock" : "Buy"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── BAYESIAN BUDGET SHELF — receives shared budget prop ── */}
      <div className="mt-4">
        <BudgetShelf budget={debouncedBudget} />
      </div>
    </div>
  );
}
