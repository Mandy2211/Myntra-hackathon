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
              <div key={p.id} className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 hover:border-pink-500/40 hover:shadow-lg hover:shadow-pink-900/10 transition-all duration-300 group cursor-pointer flex flex-col">
                <div className="relative aspect-[3/4] overflow-hidden bg-slate-800">
                  <img
                    src={p.img?.split(';')[0] || p.images?.[0]}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    onError={e => { e.target.src = 'https://placehold.co/300x400/1e293b/ec4899?text=Bharat+AI' }}
                  />
                  {p.discount && p.discount !== '0' && p.discount !== '' && (
                    <div className="absolute top-2 left-2 bg-rose-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg">
                      {p.discount.includes('%') ? p.discount : p.discount + '%'} OFF
                    </div>
                  )}
                  {p.rating > 0 && (
                    <div className="absolute top-2 right-2 bg-slate-950/80 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-bold text-amber-400 border border-slate-700/50">
                      ⭐ {parseFloat(p.rating).toFixed(1)}
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">{p.seller || p.asin || 'Brand'}</p>
                  <h3 className="font-medium text-slate-200 line-clamp-2 text-sm flex-1">{p.name}</h3>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-lg font-bold text-emerald-400">₹{p.price}</span>
                    {p.mrp > p.price && (
                      <span className="text-sm text-slate-500 line-through">₹{p.mrp}</span>
                    )}
                  </div>
                  <button
                    disabled={p.remainingStock === 0}
                    onClick={async () => {
                      try {
                        const token = sessionStorage.getItem('token');
                        const res = await fetch('http://localhost:5000/api/purchase', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                          },
                          body: JSON.stringify({
                            productId: p.id,
                            quantity: 1,
                            cityName: user?.city || 'Unknown',
                            stateName: user?.state || 'Unknown'
                          })
                        });
                        const data = await res.json();
                        if (data.success) {
                          alert(`✅ Order placed! ${data.remainingStock} left in stock.`);
                        } else {
                          alert(data.error || 'Purchase failed');
                        }
                      } catch (err) {
                        alert('Purchase failed. Please try again.');
                      }
                    }}
                    className="mt-3 w-full py-2 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {p.remainingStock === 0 ? 'Out of Stock' : 'Buy'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
