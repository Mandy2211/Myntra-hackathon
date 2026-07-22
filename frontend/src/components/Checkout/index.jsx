import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, MapPin, Truck, Wallet, CreditCard, CheckCircle, Store } from 'lucide-react';

// Estimate delivery window from seller location vs buyer location
function getDeliveryEta(product, user) {
  const sellerCity = (product.city || '').toLowerCase();
  const sellerState = (product.state || '').toLowerCase();
  const userCity = (user?.city || '').toLowerCase();
  const userState = (user?.state || '').toLowerCase();
  const isSeller = product.source === 'seller';

  if (isSeller && sellerCity && sellerCity === userCity) {
    return { text: '1–2 days', note: `Local seller in ${product.city}`, local: true };
  }
  if (isSeller && sellerState && sellerState === userState) {
    return { text: '2–4 days', note: `Ships from within ${product.state}`, local: true };
  }
  return { text: '4–6 days', note: 'Ships from national catalog', local: false };
}

export default function CheckoutModal({ product, onClose, onSuccess }) {
  const { user } = useAuth();
  const [payment, setPayment] = useState('cod');
  const [placing, setPlacing] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  if (!product) return null;

  const eta = getDeliveryEta(product, user);
  const img = product.img?.split(';')[0];
  const addressLine = user?.exactLocation?.displayName || `${user?.city || ''}, ${user?.state || ''}`;
  const pincode = user?.exactLocation?.addressInfo?.postcode || user?.pincode;

  const placeOrder = async () => {
    setPlacing(true);
    setError('');
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          productId: product.id,
          quantity: 1,
          cityName: user?.city || 'Unknown',
          stateName: user?.state || 'Unknown'
        })
      });
      const data = await res.json();
      if (data.success) {
        setDone(true);
        if (onSuccess) onSuccess(data.remainingStock);
      } else {
        setError(data.error || 'Could not place order');
      }
    } catch (err) {
      setError('Could not place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100"
        onClick={e => e.stopPropagation()}
      >
        {done ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-emerald-500 dark:text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Order placed!</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
              Arriving in <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{eta.text}</span> · {payment === 'cod' ? 'Cash on Delivery' : 'Paid Online'}
            </p>
            <p className="text-xs text-slate-500 mb-6">{eta.note}</p>
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-sm transition"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white">Confirm Order</h3>
              <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Product summary */}
              <div className="flex gap-3">
                <img
                  src={img}
                  alt={product.name}
                  className="w-16 h-20 object-cover rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0"
                  onError={e => { e.target.src = 'https://placehold.co/120x160/1e293b/ec4899?text=Item' }}
                />
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-2">{product.name}</h4>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-lg font-bold text-emerald-400">₹{product.price}</span>
                    {product.mrp > product.price && <span className="text-xs text-slate-500 line-through">₹{product.mrp}</span>}
                  </div>
                </div>
              </div>

              {/* Delivery ETA */}
              <div className={`rounded-xl p-3 border flex items-center gap-3 ${eta.local ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50' : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800'}`}>
                {eta.local ? <Store className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0" /> : <Truck className="w-5 h-5 text-slate-500 dark:text-slate-400 shrink-0" />}
                <div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">Arrives in {eta.text}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{eta.note}</div>
                </div>
              </div>

              {/* Delivery address */}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Deliver to</div>
                <div className="rounded-xl p-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-pink-500 mt-0.5 shrink-0" />
                  <div className="text-sm text-slate-700 dark:text-slate-300 leading-snug">
                    <span className="font-semibold text-slate-900 dark:text-slate-200">{user?.name}</span>
                    <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{addressLine}</div>
                    {pincode && <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">PIN: {pincode}</div>}
                  </div>
                </div>
              </div>

              {/* Payment method */}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Payment</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPayment('cod')}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition ${payment === 'cod' ? 'bg-pink-500/10 border-pink-500 text-pink-600 dark:text-pink-300' : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'}`}
                  >
                    <Wallet className="w-4 h-4" /> Cash on Delivery
                  </button>
                  <button
                    onClick={() => setPayment('online')}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition ${payment === 'online' ? 'bg-pink-500/10 border-pink-500 text-pink-600 dark:text-pink-300' : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'}`}
                  >
                    <CreditCard className="w-4 h-4" /> Pay Online
                  </button>
                </div>
              </div>

              {error && <div className="text-rose-600 dark:text-rose-400 text-sm bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 px-3 py-2 rounded-lg">{error}</div>}
            </div>

            <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] text-slate-500">Total</div>
                <div className="text-lg font-bold text-slate-900 dark:text-white">₹{product.price}</div>
              </div>
              <button
                onClick={placeOrder}
                disabled={placing}
                className="flex-1 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-sm transition disabled:opacity-50"
              >
                {placing ? 'Placing…' : `Place Order · ${payment === 'cod' ? 'COD' : 'Online'}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
