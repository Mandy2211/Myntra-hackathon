import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, MapPin, User as UserIcon, LogOut, Sun, CloudRain, ThermometerSnowflake, Search } from 'lucide-react';
import { fetchCities } from '../../services/api';
import DynamicShelf from '../DynamicShelf';

export default function MainAppContent() {
  const { user, logout, updateCity } = useAuth();

  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customCityMode, setCustomCityMode] = useState(false);
  const [customCityInput, setCustomCityInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const [shelves, setShelves] = useState(null);
  const [budgetPicks, setBudgetPicks] = useState(null);
  const [budget, setBudget] = useState(2000);
  const [loadingShelves, setLoadingShelves] = useState(false);
  const [loadingBudget, setLoadingBudget] = useState(false);

  useEffect(() => {
    fetchCities()
      .then(data => setCities(data))
      .catch(err => console.error('Error fetching cities:', err));
  }, []);

  useEffect(() => {
    if (customCityInput.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const query = encodeURIComponent(customCityInput.trim());
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&countrycodes=in&format=json&addressdetails=1&limit=5`);
        const data = await res.json();
        setSuggestions(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 600);

    return () => clearTimeout(delayDebounceFn);
  }, [customCityInput]);

  // Main Shelves Effect (Fires on Context Change - weather, festival)
  useEffect(() => {
    const fetchShelves = async () => {
      setLoadingShelves(true);
      try {
        const token = sessionStorage.getItem('token');
        const query = new URLSearchParams({
          city: user?.city || 'Coimbatore',
          state: user?.state || 'Tamil Nadu',
          gender: user?.gender || 'Men',
          maxPrice: budget // Send current budget so initial structure syncs
        });
        const res = await fetch(`http://localhost:5000/api/homepage/shelves?${query}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setShelves(data);
          // Just use the first dynamic shelf as budgetPicks fallback if needed, or don't set it since we use dynamic shelves now
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingShelves(false);
      }
    };

    fetchShelves();
    // We intentionally bypass 'budget' dependency here to prevent deep re-renders!
  }, [user?.city, user?.state, user?.gender]);

  // Budget Slider Effect
  useEffect(() => {
    if (!shelves) return; // Wait for initial context load first

    const fetchBudgetPicks = async () => {
      setLoadingBudget(true);
      try {
        const token = sessionStorage.getItem('token');
        const query = new URLSearchParams({
          gender: user?.gender || 'Men',
          maxPrice: budget
        });
        const res = await fetch(`http://localhost:5000/api/homepage/budget-picks?${query}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setBudgetPicks(data.budgetPicks);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingBudget(false);
      }
    };

    const debounce = setTimeout(fetchBudgetPicks, 500);
    return () => clearTimeout(debounce);
  }, [budget, user?.gender]);

  const handleAutoDetect = () => {
    if ("geolocation" in navigator) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`);
            const data = await res.json();
            const detectCity = data.address.city || data.address.town || data.address.state_district || "Unknown";
            const exactLocation = {
              displayName: data.display_name,
              lat: position.coords.latitude,
              lon: position.coords.longitude,
              addressInfo: data.address
            };

            updateCity(detectCity, exactLocation);
            setCustomCityMode(false);
          } catch (err) {
            console.error(err);
            alert("Location detection failed");
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          console.error(error);
          alert("Location access denied or unavailable");
          setLoading(false);
        }
      );
    } else {
      alert("Geolocation is not supported by your browser");
    }
  };

  const getClimateIcon = (climate) => {
    if (climate === 'Hot') return <Sun className="w-5 h-5 text-yellow-500" />;
    if (climate === 'Cold') return <ThermometerSnowflake className="w-5 h-5 text-cyan-400" />;
    return <CloudRain className="w-5 h-5 text-blue-400" />;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50 px-4 py-3 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-pink-600 rounded-lg text-white">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-400">Bharat AI</span>
            </h1>
          </div>
        </div>

        <div className="flex-1 max-w-xl mx-4 hidden md:block">
          <form 
            onSubmit={async (e) => {
              e.preventDefault();
              if(!searchQuery.trim()) return;
              try {
                const token = sessionStorage.getItem('token');
                // The API track call happens silently in the background
                fetch('http://localhost:5000/api/search/track', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                  body: JSON.stringify({ rawQuery: searchQuery })
                }).catch(err => console.error('Silent search track failed', err));
                
                // Navigate immediately to the new search placeholder page
                navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
              } catch(err) {
                console.error('Navigation failed', err);
              }
            }}
            className="flex items-center bg-slate-800/80 rounded-full border border-slate-700 focus-within:border-pink-500/50 px-4 py-2 transition"
          >
            <Search className="w-4 h-4 text-slate-400 mr-2" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for clothes (e.g., 'Red Velvet Dress')..." 
              className="bg-transparent text-sm focus:outline-none text-slate-200 w-full placeholder:text-slate-500"
            />
          </form>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
              <MapPin className="text-pink-500 w-4 h-4" />

              {customCityMode ? (
                <div className="relative">
                  <form onSubmit={(e) => e.preventDefault()} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={customCityInput}
                      onChange={(e) => setCustomCityInput(e.target.value)}
                      placeholder="Enter city..."
                      className="bg-transparent text-sm focus:outline-none text-slate-200 w-36 border-b border-pink-500/50 focus:border-pink-500 pb-0.5"
                      autoFocus
                    />
                    <button type="button" onClick={() => { setCustomCityMode(false); setCustomCityInput(''); setSuggestions([]); }} className="text-xs text-slate-400 hover:text-white transition">Cancel</button>
                    {isSearching && <div className="w-3 h-3 border border-pink-500 border-t-transparent rounded-full animate-spin"></div>}
                  </form>
                  {suggestions.length > 0 && (
                    <div className="absolute top-full left-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-xl shadow-slate-950 z-50 overflow-hidden text-xs max-h-64 overflow-y-auto">
                      {suggestions.map((loc) => {
                        const cityName = loc.address?.city || loc.address?.town || loc.address?.state_district || loc.name;
                        return (
                          <div
                            key={loc.place_id}
                            onClick={() => {
                              updateCity(cityName, {
                                displayName: loc.display_name,
                                lat: loc.lat,
                                lon: loc.lon,
                                addressInfo: loc.address
                              });
                              setCustomCityMode(false);
                              setCustomCityInput('');
                              setSuggestions([]);
                            }}
                            className="p-2 cursor-pointer hover:bg-slate-700 border-b border-slate-700/50 text-slate-200 flex flex-col justify-center"
                          >
                            <span className="font-bold text-pink-400 capitalize">{cityName}</span>
                            <span className="text-[10px] text-slate-400 truncate">{loc.display_name}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-100 min-w-[3rem] px-1 group relative flex items-center">
                      {user?.city || 'Select city'}
                    </span>
                    {user?.exactLocation?.displayName && (
                      <span className="text-[10px] text-slate-400 px-1 max-w-[220px] truncate" title={user.exactLocation.displayName}>
                        {user.exactLocation.displayName}
                      </span>
                    )}
                  </div>
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value === 'custom') {
                        setCustomCityMode(true);
                      } else {
                        updateCity(e.target.value);
                      }
                    }}
                    className="bg-transparent text-slate-400 text-xs focus:outline-none cursor-pointer hover:text-slate-200"
                    title="Change location"
                  >
                    <option value="" disabled>Change...</option>
                    {cities.map(c => (
                      <option key={c.cityName} value={c.cityName} className="bg-slate-900 text-slate-200">
                        {c.cityName}
                      </option>
                    ))}
                    <option value="custom" className="bg-slate-900 text-pink-400 font-bold">+ Custom Search</option>
                  </select>
                </div>
              )}
            </div>

            {!customCityMode && (
              <button
                onClick={handleAutoDetect}
                className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-lg text-emerald-400 flex items-center gap-1.5 transition"
                title="Auto-detect location from GPS"
                disabled={loading}
              >
                <div className={`w-2 h-2 rounded-full ${loading ? 'bg-emerald-500 animate-ping' : 'bg-emerald-500'}`} />
                {loading ? 'Detecting...' : 'Auto-detect'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm bg-slate-850 px-3 py-1.5 rounded-lg border border-slate-800">
              <UserIcon className="w-4 h-4 text-purple-400" />
              <div className="text-right">
                <p className="font-semibold text-slate-200 leading-none">{user?.name}</p>
                <span className="text-[10px] text-purple-300 font-medium uppercase tracking-wider">{user?.role}</span>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-2 bg-slate-800 hover:bg-rose-950/40 hover:text-rose-450 border border-slate-700 hover:border-rose-900/50 rounded-lg transition"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 flex flex-col gap-6">

        {/* Context bar / Controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-4">
            {shelves?.context && (
              <div className="bg-slate-950 px-4 py-2 rounded-xl flex items-center gap-3 border border-slate-800">
                {getClimateIcon(shelves.context.climate)}
                <div>
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Current Forecast</div>
                  <div className="font-medium text-slate-200">
                    <span className="font-bold text-white">{shelves.context.temperature}°C</span>, {shelves.context.climate}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Loading overlay for shelves */}
        {loadingShelves ? (
          <div className="flex-1 flex flex-col items-center justify-center p-20">
            <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent flex items-center justify-center rounded-full animate-spin">
              <div className="w-6 h-6 border-4 border-purple-500 border-b-transparent rounded-full animate-spin-reverse opacity-70"></div>
            </div>
            <p className="mt-4 text-sm text-slate-400 font-medium">Building contextual shelves for {user?.city}...</p>
          </div>
        ) : shelves ? (
          <div className="space-y-12">

            {shelves.dynamicShelves?.map((shelf, idx) => (
              <Shelf
                key={idx}
                title={shelf.title}
                products={shelf.products}
              />
            ))}

            {/* Budget Picks Area */}
            <div>
              <div className="w-full max-w-md mb-6 bg-slate-900 p-4 rounded-xl border border-slate-800 relative overflow-hidden">
                {loadingBudget && (
                  <div className="absolute top-0 right-0 p-2">
                    <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent flex items-center justify-center rounded-full animate-spin"></div>
                  </div>
                )}
                <div className="flex justify-between items-end mb-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Adjust Max Budget Priority</label>
                  <span className={`text-lg font-bold transition-colors ${loadingBudget ? 'text-slate-500' : 'text-emerald-400'}`}>₹{budget}</span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="10000"
                  step="100"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full accent-emerald-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className={`transition-opacity duration-300 ${loadingBudget ? 'opacity-30' : 'opacity-100'}`}>
                <Shelf title="💎 Top Rated under Budget" products={budgetPicks} />
              </div>
            </div>

          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            Select a location to view personalized shelves.
          </div>
        )}

      </main>
    </div>
  );
}

const Shelf = ({ title, products }) => {
  const { user } = useAuth();

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

  if (!products || products.length === 0) return null;

  return (
    <div className="w-full">
      <h3 className="text-2xl font-extrabold text-slate-100 mb-6 flex items-center gap-2">
        {title}
        <span className="text-xs font-medium bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full ml-2 border border-slate-700">
          {products.length} items
        </span>
      </h3>
      <div className="flex overflow-x-auto gap-4 pb-4 snap-x hide-scroll">
        {products.map(p => (
          <div key={p.id} className="snap-start shrink-0 w-[220px] bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-pink-500/50 hover:shadow-lg hover:shadow-pink-900/10 transition-all duration-300 group">
            <div className="relative h-[280px] overflow-hidden bg-slate-950">
              <img
                src={p.img?.split(';')[0]}
                alt={p.name}
                onError={(e) => {
                  if (e.target.src !== '/fallback.png') {
                    e.target.src = '/fallback.png';
                  }
                }}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {p.discount && p.discount !== '0' && p.discount !== '' && (
                <div className="absolute top-2 left-2 bg-rose-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg">
                  {p.discount.includes('%') ? p.discount : p.discount + '%'} OFF
                </div>
              )}
            </div>
            <div className="p-4 relative min-h-[140px] flex flex-col">
              {p.reason && (
                <div className="text-[10px] font-medium text-emerald-400 bg-emerald-950/30 border border-emerald-900/50 px-2 py-1 rounded-md mb-2 leading-tight">
                  {p.reason}
                </div>
              )}
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">{p.seller || p.brand || p.brand_name || 'Brand'}</div>
              <h4 className="font-medium text-sm text-slate-200 line-clamp-2 mb-3 h-10" title={p.name}>{p.name}</h4>
              <div className="flex justify-between items-center mt-auto">
                <div>
                  <span className="font-bold text-lg text-emerald-400">₹{p.price}</span>
                  {p.mrp > p.price && <span className="text-xs text-slate-500 line-through ml-2">₹{p.mrp}</span>}
                </div>
                <div className="flex items-center gap-1 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                  <span className="text-[10px] font-bold text-amber-400">⭐ {p.rating}</span>
                </div>
              </div>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleBuy(p.id, user?.city, user?.state);
                }}
                disabled={p.remainingStock === 0}
                className="mt-3 w-full py-2 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {p.remainingStock === 0 ? "Out of stock" : "Buy"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
