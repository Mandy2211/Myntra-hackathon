import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Search, ArrowLeft, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [products, setProducts] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [loading, setLoading] = useState(false);

  const lastQuery = useRef('');

  useEffect(() => {
    if (!query) return;
    if (lastQuery.current === query) return;
    lastQuery.current = query;

    setLoading(true);
    
    const token = sessionStorage.getItem('token');
    fetch('http://localhost:5000/api/search', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ rawQuery: query, city: user?.city, state: user?.state })
    })
      .then(res => res.json())
      .then(data => {
        setProducts(data.products || []);
        setParsed(data.parsed || null);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [query, user]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50 px-4 py-3 sm:px-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2">
              <div className="p-1.5 bg-pink-600 rounded-lg text-white">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-400 hidden sm:block">
                Bharat AI
              </h1>
            </Link>
          </div>
        </div>
        
        <div className="flex-1 max-w-xl mx-4">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const val = e.target.search.value;
              if(!val.trim()) return;
              navigate(`/search?q=${encodeURIComponent(val)}`);
            }}
            className="flex items-center bg-slate-800/80 rounded-full border border-slate-700 focus-within:border-pink-500/50 px-4 py-2 transition"
          >
            <Search className="w-4 h-4 text-slate-400 mr-2" />
            <input 
              name="search"
              type="text" 
              defaultValue={query || ''}
              placeholder="Search for clothes..." 
              className="bg-transparent text-sm focus:outline-none text-slate-200 w-full placeholder:text-slate-500"
            />
          </form>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
        <h2 className="text-2xl font-bold text-white mb-6">
          Showing results for: <span className="text-pink-400">"{query}"</span>
        </h2>
        
        {/* Internal Telemetry Check - Requested to keep for Demo */}
        <div className="mb-8 inline-block bg-slate-900 border border-slate-800 rounded-xl p-4 text-left">
          <p className="text-sm font-semibold text-emerald-400 mb-2">Internal Telemetry Check</p>
          {loading ? (
            <p className="text-xs text-slate-400 font-mono animate-pulse">Extracting intent via LLM...</p>
          ) : parsed ? (
            <ul className="text-xs text-slate-400 space-y-1 font-mono">
              <li>Category: {parsed.category}</li>
              <li>Type: {parsed.type}</li>
              <li>Colour: {parsed.colour}</li>
              <li>Material: {parsed.material}</li>
              <li>Gender: {parsed.gender}</li>
              <li>Occasion: {parsed.occasion}</li>
              <li>Budget: {parsed.budget}</li>
            </ul>
          ) : (
            <p className="text-xs text-slate-400 font-mono">No parsed data available.</p>
          )}
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-400">Searching...</div>
        ) : products === null ? (
          null
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-slate-400 bg-slate-900 rounded-2xl border border-slate-800">
            <Search className="w-12 h-12 mx-auto text-slate-600 mb-4" />
            <p>No matches found for "{query}" — try a broader term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map(p => (
              <div key={p.id} className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 hover:border-slate-700 transition group cursor-pointer">
                <div className="aspect-[3/4] overflow-hidden bg-slate-800">
                  <img src={p.img || p.images?.[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-slate-200 line-clamp-1">{p.name}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-lg font-bold text-white">₹{p.price}</span>
                    {p.mrp > p.price && (
                      <span className="text-sm text-slate-500 line-through">₹{p.mrp}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
