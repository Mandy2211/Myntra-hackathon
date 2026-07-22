import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Search, ArrowLeft, ShoppingBag, Briefcase, X, BadgeCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import CheckoutModal from '../Checkout';
import MicButton from '../MicButton';

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [products, setProducts] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [officeIntent, setOfficeIntent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkoutProduct, setCheckoutProduct] = useState(null);

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
        setOfficeIntent(!!data.officeIntent);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [query, user]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-50 dark:bg-slate-950 transition-colors text-slate-900 dark:text-slate-100 font-sans flex flex-col">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 backdrop-blur sticky top-0 z-50 px-4 py-3 sm:px-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 hover:bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2">
              <div className="p-1.5 bg-pink-600 rounded-lg text-slate-900 dark:text-white">
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
            className="flex items-center bg-slate-100 dark:bg-slate-800/80 rounded-full border border-slate-300 dark:border-slate-700 focus-within:border-pink-500/50 px-4 py-2 transition"
          >
            <Search className="w-4 h-4 text-slate-500 dark:text-slate-400 mr-2" />
            <input 
              name="search"
              type="text"
              defaultValue={query || ''}
              placeholder="Search for clothes..." 
              className="bg-transparent text-sm focus:outline-none text-slate-800 dark:text-slate-200 w-full placeholder:text-slate-500"
            />
            <MicButton onResult={(text) => navigate(`/search?q=${encodeURIComponent(text)}`)} />
          </form>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
          Showing results for: <span className="text-pink-400">"{query}"</span>
        </h2>

        {/* Smart Office Wear — shows what the AI understood from the query */}
        {officeIntent && parsed && (
          <div className="mb-8 bg-gradient-to-br from-purple-900/30 to-pink-900/20 border border-purple-500/30 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Briefcase className="w-5 h-5 text-pink-400" />
              <h3 className="text-lg font-bold text-white">Smart Office Wear</h3>
              <span className="text-[10px] font-bold bg-pink-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">Beta</span>
            </div>
            <p className="text-sm text-slate-300 mb-3">
              {parsed.occupation && parsed.occupation !== 'NA'
                ? <>Curated for a <span className="text-emerald-400 font-semibold">{parsed.occupation}</span>. </>
                : 'Curated for the workplace. '}
              Ranked every result by an <span className="text-pink-400 font-semibold">Office Suitability Score</span>.
            </p>
            {parsed.exclusions && parsed.exclusions.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Filtered out:</span>
                {parsed.exclusions.map((ex, i) => (
                  <span key={i} className="flex items-center gap-1 text-xs bg-red-950/40 border border-red-900/50 text-red-300 px-2.5 py-1 rounded-full">
                    <X className="w-3 h-3" /> {ex}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Internal Telemetry Check - Requested to keep for Demo */}
        <div className="mb-8 inline-block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-left">
          <p className="text-sm font-semibold text-emerald-400 mb-2">Internal Telemetry Check</p>
          {loading ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono animate-pulse">Extracting intent via LLM...</p>
          ) : parsed ? (
            <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1 font-mono">
              <li>Category: {parsed.category}</li>
              <li>Type: {parsed.type}</li>
              <li>Colour: {parsed.colour}</li>
              <li>Material: {parsed.material}</li>
              <li>Gender: {parsed.gender}</li>
              <li>Occasion: {parsed.occasion}</li>
              <li>Budget: {parsed.budget}</li>
              <li>Occupation: {parsed.occupation}</li>
              <li>Exclusions: {parsed.exclusions?.length ? parsed.exclusions.join(', ') : 'none'}</li>
            </ul>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">No parsed data available.</p>
          )}
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-500 dark:text-slate-400">Searching...</div>
        ) : products === null ? (
          null
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <Search className="w-12 h-12 mx-auto text-slate-600 mb-4" />
            <p>No matches found for "{query}" — try a broader term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map(p => (
              <div key={p.id} className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-pink-500/40 hover:shadow-lg hover:shadow-pink-900/10 transition-all duration-300 group cursor-pointer flex flex-col">
                <div className="relative aspect-[3/4] overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img
                    src={p.img?.split(';')[0] || p.images?.[0]}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    onError={e => { e.target.src = 'https://placehold.co/300x400/1e293b/ec4899?text=Bharat+AI' }}
                  />
                  {p.discount && p.discount !== '0' && p.discount !== '' && (
                    <div className="absolute top-2 left-2 bg-rose-500 text-slate-900 dark:text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg">
                      {p.discount.includes('%') ? p.discount : p.discount + '%'} OFF
                    </div>
                  )}
                  {p.rating > 0 && (
                    <div className="absolute top-2 right-2 bg-slate-50 dark:bg-slate-950/80 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-bold text-amber-400 border border-slate-300 dark:border-slate-700/50">
                      ⭐ {parseFloat(p.rating).toFixed(1)}
                    </div>
                  )}
                  {typeof p.officeScore === 'number' && (
                    <div className={`absolute bottom-2 left-2 flex items-center gap-1 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-bold border ${
                      p.officeScore >= 80 ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60'
                      : p.officeScore >= 60 ? 'bg-amber-950/80 text-amber-300 border-amber-800/60'
                      : 'bg-slate-950/80 text-slate-300 border-slate-700/60'
                    }`}>
                      <Briefcase className="w-3 h-3" /> {p.officeScore}% Office
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1">
                  {p.reason && (
                    <div className="text-[10px] font-medium text-emerald-400 bg-emerald-950/30 border border-emerald-900/50 px-2 py-1 rounded-md mb-2 leading-tight">
                      {p.reason}
                    </div>
                  )}
                  {p.verifiedSeller && (
                    <div className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-300 bg-sky-950/40 border border-sky-800/50 px-2 py-0.5 rounded-full mb-2 w-fit">
                      <BadgeCheck className="w-3 h-3" /> Verified Local Seller
                    </div>
                  )}
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 mb-1">{p.seller || p.asin || 'Brand'}</p>
                  <h3 className="font-medium text-slate-800 dark:text-slate-200 line-clamp-2 text-sm flex-1">{p.name}</h3>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-lg font-bold text-emerald-400">₹{p.price}</span>
                    {p.mrp > p.price && (
                      <span className="text-sm text-slate-500 line-through">₹{p.mrp}</span>
                    )}
                  </div>
                  <button
                    disabled={p.remainingStock === 0}
                    onClick={() => setCheckoutProduct(p)}
                    className="mt-3 w-full py-2 rounded-lg bg-pink-600 hover:bg-pink-500 text-slate-900 dark:text-white font-bold text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {p.remainingStock === 0 ? 'Out of Stock' : 'Buy'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {checkoutProduct && (
        <CheckoutModal
          product={checkoutProduct}
          onClose={() => setCheckoutProduct(null)}
        />
      )}
    </div>
  );
}
