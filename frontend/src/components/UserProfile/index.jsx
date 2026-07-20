import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  User, ShoppingBag, Star, MessageSquare, AlertCircle, ChevronLeft,
  Package, Calendar, MapPin, CheckCircle, XCircle, Clock
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

function StarRating({ value, onChange, readonly = false }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange && onChange(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={`text-2xl transition-colors ${readonly ? 'cursor-default' : 'cursor-pointer'}`}
        >
          <span className={`${(hovered || value) >= star ? 'text-amber-400' : 'text-slate-600'}`}>★</span>
        </button>
      ))}
    </div>
  );
}

function ReviewModal({ purchase, onClose, onSubmitted }) {
  const { token } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isComplaint, setIsComplaint] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const product = purchase.Product;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return setError('Please write a comment');
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          productId: purchase.productId,
          purchaseId: purchase.id,
          rating,
          comment,
          isComplaint
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit review');
      onSubmitted();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Write a Review</h3>
            <p className="text-sm text-slate-400 mt-0.5 line-clamp-1">{product?.name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Your Rating</label>
            <StarRating value={rating} onChange={setRating} />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Your Comment</label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Share your experience with this product..."
              rows={4}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-pink-500 resize-none transition"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setIsComplaint(!isComplaint)}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isComplaint ? 'bg-red-500 border-red-500' : 'border-slate-600'}`}
            >
              {isComplaint && <CheckCircle className="w-3 h-3 text-white" />}
            </div>
            <span className="text-sm text-slate-300">
              Mark as complaint <span className="text-slate-500 text-xs">(helps admin monitor seller quality)</span>
            </span>
          </label>

          {error && (
            <div className="text-red-400 text-sm bg-red-950/30 border border-red-900/50 px-3 py-2 rounded-lg">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 text-sm font-semibold hover:border-slate-600 transition">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white text-sm font-bold hover:from-pink-500 hover:to-purple-500 transition disabled:opacity-50">
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UserProfile() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders');
  const [purchases, setPurchases] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewTarget, setReviewTarget] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [purchasesRes, reviewsRes] = await Promise.all([
        fetch(`${API_BASE}/purchases/my`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/reviews/my`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      const purchasesData = await purchasesRes.json();
      const reviewsData = await reviewsRes.json();
      setPurchases(purchasesData.purchases || []);
      setMyReviews(reviewsData.reviews || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [token]);

  const isReviewed = (purchaseId) => myReviews.some(r => r.purchaseId === purchaseId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50 px-4 py-3 sm:px-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="p-2 bg-pink-600 rounded-lg text-white">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-400">
            Bharat AI
          </h1>
        </div>
        <button onClick={logout} className="text-xs text-slate-400 hover:text-rose-400 transition border border-slate-700 px-3 py-1.5 rounded-lg">
          Logout
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-8 space-y-8">

        {/* Profile Card */}
        <div className="bg-gradient-to-br from-slate-900 via-purple-950/20 to-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">{user?.name}</h2>
            <p className="text-slate-400 text-sm">{user?.email}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="flex items-center gap-1.5 text-xs bg-slate-800 border border-slate-700 px-3 py-1 rounded-full text-slate-300">
                <MapPin className="w-3 h-3 text-pink-400" /> {user?.city}, {user?.state}
              </span>
              <span className="flex items-center gap-1.5 text-xs bg-slate-800 border border-slate-700 px-3 py-1 rounded-full text-slate-300">
                <User className="w-3 h-3 text-purple-400" /> {user?.gender}
              </span>
              <span className="flex items-center gap-1.5 text-xs bg-emerald-950/50 border border-emerald-900/50 px-3 py-1 rounded-full text-emerald-400">
                <Package className="w-3 h-3" /> {purchases.length} Orders
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-800 pb-0">
          {[
            { id: 'orders', label: 'My Orders', icon: ShoppingBag },
            { id: 'reviews', label: 'My Reviews', icon: Star }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px ${
                activeTab === tab.id
                  ? 'border-pink-500 text-pink-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin" />
          </div>
        ) : activeTab === 'orders' ? (
          /* Orders Tab */
          <div className="space-y-4">
            {purchases.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="font-medium">No orders yet</p>
                <p className="text-sm mt-1">Start shopping to see your orders here</p>
                <button onClick={() => navigate('/')} className="mt-4 px-6 py-2.5 bg-pink-600 hover:bg-pink-500 text-white text-sm font-bold rounded-xl transition">
                  Shop Now
                </button>
              </div>
            ) : purchases.map(purchase => {
              const product = purchase.Product;
              const reviewed = isReviewed(purchase.id);
              return (
                <div key={purchase.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 hover:border-pink-500/30 transition group">
                  <div className="w-full sm:w-24 h-32 sm:h-24 rounded-xl overflow-hidden bg-slate-800 shrink-0">
                    <img
                      src={product?.img?.split(';')[0]}
                      alt={product?.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={e => { e.target.src = 'https://placehold.co/100x100/1e293b/ec4899?text=?' }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-200 line-clamp-2">{product?.name}</h4>
                    <div className="flex flex-wrap gap-3 mt-2">
                      <span className="text-sm font-bold text-emerald-400">₹{purchase.priceAtPurchase}</span>
                      <span className="text-xs text-slate-500">Qty: {purchase.quantity}</span>
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Calendar className="w-3 h-3" />
                        {new Date(purchase.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    {product?.city && (
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-pink-500" /> {product.city}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 sm:flex-col sm:items-end justify-end shrink-0">
                    {reviewed ? (
                      <span className="flex items-center gap-1.5 text-xs bg-emerald-950/50 border border-emerald-900/50 text-emerald-400 px-3 py-1.5 rounded-lg">
                        <CheckCircle className="w-3 h-3" /> Reviewed
                      </span>
                    ) : (
                      <button
                        onClick={() => setReviewTarget(purchase)}
                        className="flex items-center gap-1.5 text-xs bg-pink-600 hover:bg-pink-500 text-white px-3 py-1.5 rounded-lg font-semibold transition"
                      >
                        <Star className="w-3 h-3" /> Review
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Reviews Tab */
          <div className="space-y-4">
            {myReviews.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <Star className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="font-medium">No reviews yet</p>
                <p className="text-sm mt-1">Buy products to leave reviews</p>
              </div>
            ) : myReviews.map(review => (
              <div key={review.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-purple-500/30 transition">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-800 shrink-0">
                    <img
                      src={review.Product?.img?.split(';')[0]}
                      alt={review.Product?.name}
                      className="w-full h-full object-cover"
                      onError={e => { e.target.src = 'https://placehold.co/50x50/1e293b/ec4899?text=?' }}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-semibold text-slate-200 text-sm line-clamp-1">{review.Product?.name}</h4>
                      <span className="text-xs text-slate-500 shrink-0">
                        {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <StarRating value={review.rating} readonly />
                    <p className="text-sm text-slate-300 mt-2">{review.comment}</p>
                    {review.isComplaint && (
                      <span className="inline-flex items-center gap-1.5 mt-2 text-xs bg-red-950/40 border border-red-900/50 text-red-400 px-2.5 py-1 rounded-lg">
                        <AlertCircle className="w-3 h-3" /> Complaint
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Review Modal */}
      {reviewTarget && (
        <ReviewModal
          purchase={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onSubmitted={fetchData}
        />
      )}
    </div>
  );
}
