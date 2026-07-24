import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, Tag, Star, ShoppingBag, TrendingUp, Zap } from 'lucide-react';

/**
 * BudgetShelf
 * Budget is controlled externally by DynamicShelf via the shared slider.
 * Ranks items using Bayesian score + optional price-adjusted value mode.
 */
export default function BudgetShelf({ budget = 2000 }) {
  const { user, token } = useAuth();

  const [priceAdjusted, setPriceAdjusted] = useState(false);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchShelf = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const gender = user?.gender || 'Men';
      const url = `http://localhost:5000/api/shelf?budget=${budget}&gender=${gender}&priceAdjusted=${priceAdjusted}&n=12`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load shelf');
      setItems(data.shelf || []);
      setMeta(data.meta || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, budget, priceAdjusted, user?.gender]);

  useEffect(() => { fetchShelf(); }, [fetchShelf]);

  const handleBuy = async (productId) => {
    try {
      const res = await fetch('http://localhost:5000/api/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          productId, quantity: 1,
          cityName: user?.city || 'Delhi',
          stateName: user?.state || 'Delhi'
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`✅ Order placed! ${data.remainingStock} left in stock.`);
        fetchShelf();
      } else {
        alert(data.error || 'Purchase failed');
      }
    } catch {
      alert('Purchase failed. Please try again.');
    }
  };

  const renderStars = (rating) => {
    const r = parseFloat(rating) || 0;
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <Star
            key={i}
            className={`w-3 h-3 ${i <= Math.round(r) ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="w-full space-y-5">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-violet-500 dark:text-violet-400" />
            Smart Budget Picks
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Bayesian rating smoothing — distrusts low-review items, rewards proven quality
          </p>
          {meta && (
            <p className="text-[10px] text-slate-500 dark:text-slate-600 mt-0.5">
              Global baseline: C={meta.globalC}★ · m={meta.globalM} votes · {meta.total} results under ₹{budget.toLocaleString('en-IN')}
            </p>
          )}
        </div>

        {/* Value-mode toggle */}
        <button
          onClick={() => setPriceAdjusted(v => !v)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border transition-all duration-200 whitespace-nowrap ${
            priceAdjusted
              ? 'bg-violet-600/20 border-violet-500 text-violet-600 dark:text-violet-300'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-violet-500/50'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          Value Mode {priceAdjusted ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* ── States ── */}
      {loading && (
        <div className="flex items-center justify-center gap-3 py-16">
          <div className="w-8 h-8 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
          <span className="text-violet-500 dark:text-violet-400 text-sm font-semibold animate-pulse">Computing Bayesian scores...</span>
        </div>
      )}

      {error && !loading && (
        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-xl p-4 text-rose-600 dark:text-rose-400 text-sm text-center">
          {error}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="text-center py-12 text-slate-500 text-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          No products found under ₹{budget.toLocaleString('en-IN')}. Try raising the budget above.
        </div>
      )}

      {/* ── Product Cards ── */}
      {!loading && items.length > 0 && (
        <div className="flex overflow-x-auto pb-6 gap-5 hide-scrollbar snap-x scroll-smooth">
          {items.map(item => (
            <div
              key={item.id}
              className="min-w-[200px] max-w-[200px] sm:min-w-[230px] sm:max-w-[230px] snap-start bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-violet-500/40 shadow-sm dark:shadow-none transition-all duration-300 group flex flex-col relative"
            >
              {/* Discovery badge */}
              {item.isNew && (
                <div className="absolute top-2 left-2 z-10 bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> New
                </div>
              )}

              {/* Bayesian score badge */}
              {!item.isNew && item.bayesianScore > 0 && (
                <div className="absolute top-2 right-2 z-10 bg-slate-950/90 backdrop-blur-sm border border-violet-700/50 text-violet-300 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  <Zap className="w-2.5 h-2.5" />
                  {item.bayesianScore.toFixed(2)}
                </div>
              )}

              {/* Image */}
              <div className="relative h-52 overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img
                  src={item.img}
                  alt={item.name}
                  className="w-full h-full object-cover transition duration-700 group-hover:scale-110"
                  loading="lazy"
                  onError={e => { e.target.src = 'https://placehold.co/230x208/1e293b/7c3aed?text=Bharat+AI'; }}
                />
                {item.discount && item.discount !== '0' && (
                  <div className="absolute bottom-2 left-2 bg-pink-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    {item.discount}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3 flex flex-col flex-1">
                <div className="text-[9px] uppercase font-bold tracking-wider text-slate-500 mb-0.5 truncate">
                  {item.seller || item.brand || item.category || 'Brand'}
                </div>
                <h4
                  className="font-semibold text-sm text-slate-800 dark:text-slate-200 line-clamp-2 leading-snug group-hover:text-violet-500 dark:group-hover:text-violet-300 transition mb-2"
                  title={item.name}
                >
                  {item.name}
                </h4>

                {/* Stars + count */}
                <div className="flex items-center gap-2 mb-2">
                  {renderStars(item.rating)}
                  <span className="text-[10px] text-slate-500">
                    {parseFloat(item.rating || 0).toFixed(1)}
                    {item.ratingTotal > 0 && ` (${item.ratingTotal})`}
                  </span>
                </div>

                <div className="mt-auto flex items-baseline gap-2">
                  <span className="text-base font-black text-slate-900 dark:text-slate-100">₹{item.price}</span>
                  {item.mrp > item.price && (
                    <span className="text-xs text-slate-600 line-through">₹{item.mrp}</span>
                  )}
                </div>

                <button
                  onClick={() => handleBuy(item.id)}
                  disabled={item.remainingStock === 0}
                  className="mt-3 w-full py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  {item.remainingStock === 0 ? 'Out of Stock' : 'Buy'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
