import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShoppingBag, MapPin, User as UserIcon, LogOut } from 'lucide-react';
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

  // Fetch Cities list for dropdown
  useEffect(() => {
    fetchCities()
      .then(data => setCities(data))
      .catch(err => console.error('Error fetching cities:', err));
  }, []);

  // Autocomplete fetcher for custom location using OpenStreetMap Nominatim
  useEffect(() => {
    if (customCityInput.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const query = encodeURIComponent(customCityInput.trim());
        // countrycodes=in constraints search to India only
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&countrycodes=in&format=json&addressdetails=1&limit=5`);
        const data = await res.json();
        setSuggestions(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 600); // 600ms debounce
    
    return () => clearTimeout(delayDebounceFn);
  }, [customCityInput]);

  const handleAutoDetect = () => {
    if ("geolocation" in navigator) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`);
            const data = await res.json();
            const detectCity = data.address.city || data.address.town || data.address.state_district || "Unknown";
            
            // Save precise details (display name, lat/lon, full address object) for future dashboards
            const exactLocation = {
              displayName: data.display_name,
              lat: position.coords.latitude,
              lon: position.coords.longitude,
              addressInfo: data.address
            };
            
            updateCity(detectCity, exactLocation);
            
            // Revert back from custom mode if used
            setCustomCityMode(false);
          } catch(err) {
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header Bar */}
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

        <div className="flex flex-wrap items-center gap-4">
          {/* Location Selection & Auto Detect */}
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
                    <button type="button" onClick={() => {setCustomCityMode(false); setCustomCityInput(''); setSuggestions([]);}} className="text-xs text-slate-400 hover:text-white transition">Cancel</button>
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
                      )})}
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

      {/* Main Content Area */}
      <main className="flex-1 w-full mx-auto px-4 sm:px-8 py-10 relative">
        <DynamicShelf />
      </main>
    </div>
  );
}
