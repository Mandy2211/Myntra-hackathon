import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, Package, Users, MessageSquare, ChevronLeft,
  CheckCircle, XCircle, AlertTriangle, Ban, RefreshCw,
  Star, TrendingUp, Eye, ShoppingBag, Clock, Unlock
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

// ── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color = 'pink' }) {
  const colors = {
    pink: 'from-pink-900/40 to-pink-950/20 border-pink-900/50 text-pink-400',
    purple: 'from-purple-900/40 to-purple-950/20 border-purple-900/50 text-purple-400',
    emerald: 'from-emerald-900/40 to-emerald-950/20 border-emerald-900/50 text-emerald-400',
    amber: 'from-amber-900/40 to-amber-950/20 border-amber-900/50 text-amber-400',
    red: 'from-red-900/40 to-red-950/20 border-red-900/50 text-red-400'
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-5 flex items-center gap-4`}>
      <div className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl">
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{value}</div>
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</div>
      </div>
    </div>
  );
}

// ── Complaint Ratio Bar ────────────────────────────────────────────────────────
function ComplaintBar({ ratio }) {
  const color = ratio > 40 ? 'bg-red-500' : ratio > 20 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${Math.min(ratio, 100)}%` }} />
      </div>
      <span className={`text-xs font-bold w-10 text-right ${ratio > 40 ? 'text-red-400' : ratio > 20 ? 'text-amber-400' : 'text-emerald-400'}`}>
        {ratio}%
      </span>
    </div>
  );
}

// ── Pending Product Card ───────────────────────────────────────────────────────
function PendingProductCard({ product, onApprove, onReject }) {
  const [loading, setLoading] = useState(false);
  const img = product.img?.split(';')[0];

  const handle = async (action) => {
    setLoading(true);
    await action();
    setLoading(false);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:border-purple-500/40 transition group">
      <div className="relative h-48 bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <img
          src={img}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={e => { e.target.src = 'https://placehold.co/300x200/1e293b/ec4899?text=Product' }}
        />
        <div className="absolute top-2 right-2 bg-amber-500 text-black text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
          <Clock className="w-3 h-3" /> PENDING
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <h4 className="font-bold text-slate-800 dark:text-slate-200 line-clamp-2 text-sm">{product.name}</h4>
          <p className="text-xs text-slate-500 mt-0.5">
            by <span className="text-purple-400 font-medium">{product.Seller?.businessName || product.Seller?.name}</span>
          </p>
          <p className="text-xs text-slate-500">{product.Seller?.city}</p>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-bold text-emerald-400">₹{product.price}</span>
          <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{product.category}</span>
        </div>
        {product.purl && (
          <p className="text-xs text-slate-500 line-clamp-2">{product.purl}</p>
        )}
        <div className="flex gap-2 pt-1">
          <button
            disabled={loading}
            onClick={() => handle(onApprove)}
            className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-900 dark:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition disabled:opacity-50"
          >
            <CheckCircle className="w-3.5 h-3.5" /> Approve
          </button>
          <button
            disabled={loading}
            onClick={() => handle(onReject)}
            className="flex-1 py-2 rounded-xl bg-red-900/50 hover:bg-red-900/80 border border-red-900/50 text-red-400 text-xs font-bold flex items-center justify-center gap-1.5 transition disabled:opacity-50"
          >
            <XCircle className="w-3.5 h-3.5" /> Reject
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Admin Dashboard ───────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingProducts, setPendingProducts] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [allReviews, setAllReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [warnMessage, setWarnMessage] = useState('');
  const [warningSellerId, setWarningSellerId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const authHeaders = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pRes, sRes, rRes] = await Promise.all([
        fetch(`${API_BASE}/admin/products/pending`, { headers: authHeaders }),
        fetch(`${API_BASE}/admin/sellers`, { headers: authHeaders }),
        fetch(`${API_BASE}/admin/reviews`, { headers: authHeaders })
      ]);
      const [pData, sData, rData] = await Promise.all([pRes.json(), sRes.json(), rRes.json()]);
      setPendingProducts(pData.products || []);
      setSellers(sData.sellers || []);
      setAllReviews(rData.reviews || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const approveProduct = async (id) => {
    await fetch(`${API_BASE}/admin/products/${id}/approve`, { method: 'POST', headers: authHeaders });
    setPendingProducts(prev => prev.filter(p => p.id !== id));
    showToast('✅ Product approved & published!');
  };

  const rejectProduct = async (id) => {
    await fetch(`${API_BASE}/admin/products/${id}/reject`, { method: 'POST', headers: authHeaders });
    setPendingProducts(prev => prev.filter(p => p.id !== id));
    showToast('❌ Product rejected');
  };

  const sendWarning = async (sellerId) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/sellers/${sellerId}/warn`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ message: warnMessage || undefined })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast('⚠️ Warning sent to seller');
      setWarningSellerId(null);
      setWarnMessage('');
      fetchAll();
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const blockSeller = async (sellerId) => {
    if (!window.confirm('Block this seller? They will not be able to login.')) return;
    setActionLoading(true);
    try {
      await fetch(`${API_BASE}/admin/sellers/${sellerId}/block`, { method: 'POST', headers: authHeaders });
      showToast('🚫 Seller blocked from platform');
      fetchAll();
    } catch (err) {
      showToast('Failed to block seller');
    } finally {
      setActionLoading(false);
    }
  };

  const unblockSeller = async (sellerId) => {
    setActionLoading(true);
    try {
      await fetch(`${API_BASE}/admin/sellers/${sellerId}/unblock`, { method: 'POST', headers: authHeaders });
      showToast('✅ Seller unblocked');
      fetchAll();
    } catch (err) {
      showToast('Failed to unblock');
    } finally {
      setActionLoading(false);
    }
  };

  const complaints = allReviews.filter(r => r.isComplaint);
  const pendingCount = pendingProducts.length;
  const blockedSellers = sellers.filter(s => s.isBlocked).length;

  const tabs = [
    { id: 'pending', label: 'Pending Products', icon: Package, badge: pendingCount },
    { id: 'sellers', label: 'Sellers', icon: Users },
    { id: 'reviews', label: 'Complaints', icon: MessageSquare, badge: complaints.length }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors text-slate-900 dark:text-slate-100 font-sans p-4 sm:p-8">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-medium animate-bounce-in">
          {toast}
        </div>
      )}

      {/* Warning Modal */}
      {warningSellerId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-amber-900/50 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-950/50 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Send Warning</h3>
            </div>
            <textarea
              value={warnMessage}
              onChange={e => setWarnMessage(e.target.value)}
              placeholder="Write a warning message to the seller (optional — a default message will be sent if left blank)..."
              rows={4}
              className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setWarningSellerId(null); setWarnMessage(''); }}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-sm font-semibold hover:border-slate-600 transition">
                Cancel
              </button>
              <button
                disabled={actionLoading}
                onClick={() => sendWarning(warningSellerId)}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-900 dark:text-white text-sm font-bold transition disabled:opacity-50"
              >
                {actionLoading ? 'Sending...' : 'Send Warning'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 backdrop-blur sticky top-0 z-40 px-4 py-3 sm:px-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-600 rounded-lg">
            <ShieldCheck className="w-5 h-5 text-slate-900 dark:text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Admin Panel
            </h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Bharat AI Control Center</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchAll} className="p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:border-slate-600 transition">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={logout} className="text-xs text-slate-500 dark:text-slate-400 hover:text-rose-400 transition border border-slate-300 dark:border-slate-700 px-3 py-1.5 rounded-lg">
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Clock} label="Pending Approval" value={pendingCount} color="amber" />
          <StatCard icon={Users} label="Total Sellers" value={sellers.length} color="purple" />
          <StatCard icon={AlertTriangle} label="Complaints" value={complaints.length} color="red" />
          <StatCard icon={Ban} label="Blocked Sellers" value={blockedSellers} color="red" />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px whitespace-nowrap ${activeTab === tab.id
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-300'
                }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.badge > 0 && (
                <span className="bg-red-500 text-slate-900 dark:text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ── PENDING PRODUCTS TAB ── */}
            {activeTab === 'pending' && (
              <div>
                {pendingProducts.length === 0 ? (
                  <div className="text-center py-20">
                    <CheckCircle className="w-16 h-16 mx-auto mb-4 text-emerald-500 opacity-50" />
                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">All caught up!</h3>
                    <p className="text-slate-500 text-sm mt-1">No products pending approval</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {pendingProducts.map(p => (
                      <PendingProductCard
                        key={p.id}
                        product={p}
                        onApprove={() => approveProduct(p.id)}
                        onReject={() => rejectProduct(p.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── SELLERS TAB ── */}
            {activeTab === 'sellers' && (
              <div className="space-y-4">
                {sellers.length === 0 ? (
                  <div className="text-center py-20 text-slate-500">No sellers registered yet</div>
                ) : sellers.map(seller => (
                  <div key={seller.id} className={`bg-gradient-to-r from-pink-100/80 via-pink-50/50 to-white dark:from-slate-900 dark:to-slate-950 border rounded-2xl p-5 transition shadow-sm ${seller.isBlocked ? 'border-red-900/50 opacity-80' : 'border-pink-200 dark:border-slate-800 hover:border-pink-400 dark:hover:border-purple-500/30 hover:shadow-md'}`}>
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      {/* Seller Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h4 className="font-bold text-black dark:text-white">{seller.businessName || seller.name}</h4>
                          {seller.isBlocked && (
                            <span className="text-xs bg-red-950/50 border border-red-900/50 text-red-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Ban className="w-3 h-3" /> Blocked
                            </span>
                          )}
                          {seller.warningCount > 0 && !seller.isBlocked && (
                            <span className="text-xs bg-amber-950/50 border border-amber-900/50 text-amber-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> {seller.warningCount} Warning{seller.warningCount > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-black dark:text-slate-300 mt-0.5">{seller.email} · {seller.city}, {seller.state}</p>

                        {/* Stats row */}
                        <div className="flex flex-wrap gap-4 mt-3 text-xs font-semibold text-black dark:text-slate-300">
                          <span className="flex items-center gap-1"><Package className="w-3 h-3 text-purple-400" /> {seller.totalProducts} Products</span>
                          <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400" /> {seller.totalReviews} Reviews</span>
                          <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-red-400" /> {seller.complaints} Complaints</span>
                        </div>
                      </div>

                      {/* Complaint Ratio */}
                      <div className="w-full md:w-48 space-y-1.5">
                        <div className="flex justify-between text-xs font-bold text-black dark:text-slate-400">
                          <span>Complaint Ratio</span>
                          <span className={seller.complaintRatio > 40 ? 'text-red-400 font-bold' : seller.complaintRatio > 20 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                            {seller.complaintRatio > 40 ? '🚨' : seller.complaintRatio > 20 ? '⚠️' : '✅'}
                          </span>
                        </div>
                        <ComplaintBar ratio={seller.complaintRatio} />
                        <div className="text-[10px] font-semibold text-black dark:text-slate-400">
                          {seller.totalReviews < 5 ? 'Need ≥5 reviews for action' : seller.complaintRatio > 40 ? 'Eligible for block (>40%)' : seller.complaintRatio > 20 ? 'Eligible for warning (>20%)' : 'Within acceptable range'}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 shrink-0">
                        {seller.isBlocked ? (
                          <button
                            onClick={() => unblockSeller(seller.id)}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-pink-600 dark:text-pink-400 bg-pink-100 dark:bg-pink-950/40 border border-pink-300 dark:border-pink-900/50 rounded-xl hover:bg-pink-200 dark:hover:bg-pink-900/30 transition shadow-sm"
                          >
                            <Unlock className="w-3.5 h-3.5" /> Unblock
                          </button>
                        ) : (
                          <>
                            {seller.canWarn && (
                              <button
                                onClick={() => setWarningSellerId(seller.id)}
                                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-amber-400 bg-amber-950/40 border border-amber-900/50 rounded-xl hover:bg-amber-900/30 transition"
                              >
                                <AlertTriangle className="w-3.5 h-3.5" /> Warn ({seller.warningCount}/2)
                              </button>
                            )}
                            {seller.canBlock ? (
                              <button
                                onClick={() => blockSeller(seller.id)}
                                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-400 bg-red-950/40 border border-red-900/50 rounded-xl hover:bg-red-900/30 transition"
                              >
                                <Ban className="w-3.5 h-3.5" /> Block
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  if (window.confirm('FORCE BLOCK: Are you sure you want to immediately block this seller for severe violations?')) {
                                    blockSeller(seller.id);
                                  }
                                }}
                                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-red-950/30 hover:border-red-900/50 hover:text-red-400 transition"
                                title="Block immediately regardless of complaint ratio (e.g. for scams)"
                              >
                                <Ban className="w-3.5 h-3.5" /> Force Block
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Warnings history */}
                    {seller.WarningsReceived?.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                        {seller.WarningsReceived.map(w => (
                          <div key={w.id} className={`text-xs font-bold px-3 py-2 rounded-lg border shadow-sm ${w.type === 'BLOCK' ? 'bg-red-100 dark:bg-red-950/30 border-red-300 dark:border-red-900/50 text-red-900 dark:text-red-300' : 'bg-amber-100 dark:bg-amber-950/30 border-amber-300 dark:border-amber-900/50 text-amber-900 dark:text-amber-300'}`}>
                            <span className="font-extrabold">{w.type}:</span> {w.message}
                            <span className="text-slate-500 dark:text-slate-600 font-semibold ml-2">{new Date(w.createdAt).toLocaleDateString('en-IN')}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ── REVIEWS / COMPLAINTS TAB ── */}
            {activeTab === 'reviews' && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    Showing {allReviews.length} reviews · <span className="text-red-400 font-semibold">{complaints.length} complaints</span>
                  </span>
                </div>
                {allReviews.length === 0 ? (
                  <div className="text-center py-20 text-slate-500">No reviews yet</div>
                ) : allReviews.map(review => (
                  <div key={review.id} className={`bg-white dark:bg-slate-900 border rounded-xl p-4 ${review.isComplaint ? 'border-red-900/40' : 'border-slate-200 dark:border-slate-800'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                      <div className="flex-1">
                        <div className="flex flex-wrap gap-2 items-center">
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{review.User?.name}</span>
                          <span className="text-xs text-slate-500">reviewed</span>
                          <span className="text-sm font-semibold text-purple-400 line-clamp-1">{review.Product?.name}</span>
                          {review.isComplaint && (
                            <span className="text-[10px] bg-red-950/50 border border-red-900/50 text-red-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <AlertTriangle className="w-2.5 h-2.5" /> COMPLAINT
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map(s => (
                              <span key={s} className={`text-sm ${s <= review.rating ? 'text-amber-400' : 'text-slate-700'}`}>★</span>
                            ))}
                          </div>
                          <span className="text-xs text-slate-500">{new Date(review.createdAt).toLocaleDateString('en-IN')}</span>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300 mt-2">{review.comment}</p>
                        {review.Product?.Seller && (
                          <p className="text-xs text-slate-600 mt-1.5">Seller: {review.Product.Seller.name}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
