import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { TrendingUp, AlertTriangle, CheckCircle, Search, Activity, Package, Plus, LayoutDashboard, LogOut, Lightbulb, MessageSquare, Star, Shield, Trash2, Clock, Ban, X, ListFilter, ShoppingBag, Sun, Moon, User, Building, Mail, MapPin, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UploadForm from './UploadForm';
import ProductsTable from './ProductsTable';
import CategoryRequestForm from './CategoryRequestForm';
import { SellerTrendChart, SellerCategoryPieChart, MarketGapChart } from './SellerTrendChart';
import SellerSummary from './seller-summary';

export default function SellerDashboard() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Navigation State
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard | products | upload | feedback
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (user && user.role !== 'SELLER') {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/seller/dashboard', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const result = await res.json();
          setData(result);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.role === 'SELLER') {
      fetchDashboard();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors flex flex-col items-center justify-center font-sans">
        <Activity className="w-12 h-12 text-pink-500 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Loading Intelligence Engine...</h2>
      </div>
    );
  }

  const handleUploadSuccess = () => {
    setActiveTab('products');
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors text-slate-900 dark:text-slate-100 font-sans flex flex-col">
      {/* Sticky Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-sm">
        {/* Left: App Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-pink-600 rounded-xl text-white shadow-md shadow-pink-500/20 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-400 tracking-tight">
              Bharat AI
            </span>
            <span className="text-[10px] font-bold bg-pink-500/10 text-pink-500 border border-pink-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider hidden sm:inline-block">
              Seller Hub
            </span>
          </div>
        </div>

        {/* Right: Theme Toggle & Profile Details Dropdown */}
        <div className="flex items-center gap-3">
          {/* Dark / Light Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:border-pink-500/50 transition-colors shadow-sm"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* Profile Dropdown (Hover/Click) */}
          <div 
            className="relative"
            onMouseEnter={() => setIsProfileOpen(true)}
            onMouseLeave={() => setIsProfileOpen(false)}
          >
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 hover:border-pink-500/50 transition-all shadow-sm"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{user?.name || 'Seller'}</div>
                <div className="text-[10px] text-slate-400 font-medium line-clamp-1">{user?.city}</div>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Profile Dropdown Card (Wrapped in pt-1 container so cursor bridge never breaks) */}
            {isProfileOpen && (
              <div className="absolute right-0 top-full pt-1.5 w-72 z-50">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-left">
                  <div className="flex items-center gap-3 pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 text-white font-black flex items-center justify-center text-lg shadow-md shrink-0">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.name || 'Seller'}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                        <Mail className="w-3 h-3 shrink-0 text-pink-500" /> {user?.email}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4 text-xs">
                    {user?.businessName && (
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <Building className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span className="font-semibold truncate">{user.businessName}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="font-semibold">{user?.city}, {user?.state}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => {
                        logout();
                        navigate('/login');
                      }}
                      className="w-full py-2.5 px-3 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800/60 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center justify-center gap-2 transition"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Secure Logout
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="max-w-7xl mx-auto w-full p-4 sm:p-8 flex flex-col md:flex-row gap-8 flex-1">
        {/* Left Sidebar Navigation */}
        <aside className="w-full md:w-64 shrink-0 space-y-6">
          <div>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-400 mb-1">
              Growth Hub
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">{user?.name} / {user?.city}</p>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === 'dashboard' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-slate-900 dark:text-white shadow-lg' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:bg-slate-900 hover:text-slate-800 dark:text-slate-200'}`}
            >
              <LayoutDashboard className="w-4 h-4" /> Market Intelligence
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === 'products' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-slate-900 dark:text-white shadow-lg' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:bg-slate-900 hover:text-slate-800 dark:text-slate-200'}`}
            >
              <Package className="w-4 h-4" /> My Products
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === 'upload' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-slate-900 dark:text-white shadow-lg' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:bg-slate-900 hover:text-slate-800 dark:text-slate-200'}`}
            >
              <Plus className="w-4 h-4" /> Upload Catalog
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === 'analytics' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-slate-900 dark:text-white shadow-lg' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:bg-slate-900 hover:text-slate-800 dark:text-slate-200'}`}
            >
              <TrendingUp className="w-4 h-4" /> Sales Analytics
            </button>
            <button
              onClick={() => setActiveTab('request-category')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === 'request-category' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-slate-900 dark:text-white shadow-lg' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:bg-slate-900 hover:text-slate-800 dark:text-slate-200'}`}
            >
              <Lightbulb className="w-4 h-4" /> Suggest Category
            </button>
            <button
              onClick={() => setActiveTab('feedback')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === 'feedback' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-slate-900 dark:text-white shadow-lg' : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:bg-slate-900 hover:text-slate-800 dark:text-slate-200'}`}
            >
              <MessageSquare className="w-4 h-4" /> Feedback & Alerts
            </button>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">

          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <header className="mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <TrendingUp className="text-emerald-400" /> Real-Time Search Gap Analysis
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Live competitive intelligence for {data?.sellerRegion?.city || user?.city}. Upload products that are trending to capture unmatched local demand.</p>
              </header>

              <SellerSummary categoryData={data?.marketInsights} />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {data?.marketInsights?.length > 0 ? (
                  data.marketInsights.map((insight, idx) => (
                    <GapCard key={idx} insight={insight} />
                  ))
                ) : (
                  <div className="col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center">
                    <Search className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">Waiting for local consumer signals</h3>
                    <p className="text-slate-500 max-w-md mx-auto">No recent searches captured in your region yet. Check back later.</p>
                  </div>
                )}
              </div>

              {data?.marketInsights?.length > 0 && (
                <div className="mt-8">
                  <MarketGapChart insights={data.marketInsights} />
                </div>
              )}
            </div>
          )}

          {activeTab === 'products' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <ProductsTable refreshTrigger={refreshTrigger} />
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <UploadForm onSuccess={handleUploadSuccess} />
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <AnalyticsTab />
            </div>
          )}

          {activeTab === 'request-category' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
              <CategoryRequestForm />
            </div>
          )}

          {activeTab === 'feedback' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <FeedbackTab />
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

function GapCard({ insight }) {
  const isHighOpportunity = insight.gapScore > 75;
  const isSaturated = insight.gapScore < 30;
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className={`bg-white dark:bg-slate-900 border ${isHighOpportunity ? 'border-emerald-500/50 shadow-lg shadow-emerald-900/20' : 'border-slate-200 dark:border-slate-800'} rounded-2xl p-6 relative overflow-hidden flex flex-col`}>
      {isHighOpportunity && (
        <div className="absolute top-0 right-0 bg-emerald-500 text-slate-900 dark:text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl origin-top-right">
          HIGH DEMAND
        </div>
      )}

      <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-1 uppercase tracking-wider">{insight.keyword}</h3>
      <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-widest mb-6">Trending Category</p>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <div className="text-3xl font-black text-rose-400">{insight.searchVolume}</div>
          <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">Live Searches</div>
        </div>
        <div>
          <div className="text-3xl font-black text-slate-700 dark:text-slate-300">{insight.availableProducts}</div>
          <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">Local Supply</div>
        </div>
      </div>

      <div className="mt-auto">
        <div className="flex justify-between items-end mb-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Opportunity Score</span>
          <span className={`text-xl font-black ${isHighOpportunity ? 'text-emerald-400' : isSaturated ? 'text-amber-400' : 'text-blue-400'}`}>
            {insight.gapScore}/100
          </span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full ${isHighOpportunity ? 'bg-emerald-500' : isSaturated ? 'bg-amber-500' : 'bg-blue-500'}`}
            style={{ width: `${insight.gapScore}%` }}
          />
        </div>

        <div className={`mt-4 p-3 rounded-lg text-xs flex items-start gap-2 shadow-sm ${isHighOpportunity ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-300 font-bold' : 'bg-slate-100 dark:bg-slate-800/50 text-slate-900 dark:text-slate-300 font-bold'}`}>
          {isHighOpportunity ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" /> : <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500 dark:text-amber-400" />}
          {insight.recommendation}
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="mt-4 w-full py-2.5 px-3 bg-pink-50 dark:bg-pink-950/40 hover:bg-pink-100 dark:hover:bg-pink-900/60 border border-pink-200 dark:border-pink-800/60 rounded-xl text-xs font-bold text-pink-600 dark:text-pink-300 flex items-center justify-center gap-2 transition shadow-sm hover:shadow"
        >
          <ListFilter className="w-4 h-4" /> View Search Breakdown
        </button>
      </div>

      {/* Specific Search Breakdown Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-left">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <Search className="w-5 h-5 text-pink-500" />
              <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wide">
                {insight.keyword} Search Breakdown
              </h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              Specific phrases consumers typed when searching for <span className="font-semibold text-pink-500 uppercase">{insight.keyword}</span> in your region.
            </p>

            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {insight.topQueries?.length > 0 ? (
                insight.topQueries.map((q, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-3 text-xs">
                    <div className="flex items-center gap-2.5 font-medium text-slate-800 dark:text-slate-200">
                      <span className="w-5 h-5 rounded-full bg-pink-100 dark:bg-pink-900/50 text-pink-600 dark:text-pink-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">"{q.query}"</span>
                    </div>
                    <span className="bg-pink-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                      {q.count} {q.count === 1 ? 'search' : 'searches'}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-center py-6 text-xs text-slate-400">No specific phrases recorded yet.</p>
              )}
            </div>

            <button
              onClick={() => setIsModalOpen(false)}
              className="mt-6 w-full py-2.5 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold transition"
            >
              Close Breakdown
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AnalyticsTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/seller/analytics', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return <div className="text-slate-500 dark:text-slate-400 text-center py-12">Loading Analytics...</div>;
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      <header className="mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="text-pink-500" /> Sales Analytics
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Track your product demand and revenue.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl">
          <div className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase mb-1">Units Sold</div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">{data.totals.totalUnits}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl">
          <div className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase mb-1">Revenue</div>
          <div className="text-3xl font-black text-emerald-400">₹{data.totals.totalRevenue.toFixed(0)}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl">
          <div className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase mb-1">Orders</div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">{data.totals.totalOrders}</div>
        </div>
      </div>

      {data.lowStock && data.lowStock.length > 0 && (
        <div className="bg-amber-950/40 border border-amber-900/50 p-4 rounded-xl mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-amber-400 font-bold text-sm">Restock Alert</h4>
            <p className="text-amber-200/80 text-xs mt-1">
              {data.lowStock.map(p => `${p.name} (${p.remainingStock} left)`).join(", ")}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {data.trend && <SellerTrendChart trend={data.trend} />}
        {data.categoryBreakdown && <SellerCategoryPieChart data={data.categoryBreakdown} />}
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden mt-8">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">
              <th className="px-6 py-4 font-semibold">Product</th>
              <th className="px-6 py-4 font-semibold text-center">Units Sold</th>
              <th className="px-6 py-4 font-semibold text-right">Revenue</th>
              <th className="px-6 py-4 font-semibold text-center">Stock Left</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
            {data.productDemand.map(p => (
              <tr key={p.productId} className="hover:bg-slate-100 dark:bg-slate-800/30 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-slate-800 dark:text-slate-200">
                  <div className="flex items-center gap-3">
                    {p.img && <img src={p.img.split(';')[0]} alt={p.name} className="w-10 h-10 rounded-md object-cover bg-slate-100 dark:bg-slate-800" />}
                    <span className="line-clamp-2" title={p.name}>{p.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-bold text-center text-rose-400">{p.unitsSold}</td>
                <td className="px-6 py-4 text-sm font-bold text-right text-emerald-400">₹{p.revenue.toFixed(0)}</td>
                <td className="px-6 py-4 text-sm font-medium text-center text-slate-500 dark:text-slate-400">{p.remainingStock}</td>
              </tr>
            ))}
            {data.productDemand.length === 0 && (
              <tr>
                <td colSpan="4" className="px-6 py-12 text-center text-slate-500 text-sm">
                  No sales recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FeedbackTab() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [deleteLoading, setDeleteLoading] = useState(null);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [fbRes, prodRes] = await Promise.all([
        fetch('http://localhost:5000/api/seller/feedback', { headers }),
        fetch('http://localhost:5000/api/seller/products', { headers })
      ]);
      const fbData = await fbRes.json();
      const prodData = await prodRes.json();
      setData(fbData);
      setProducts(prodData.products || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFeedback(); }, [token]);

  const deleteProduct = async (id) => {
    if (!window.confirm('Delete this product? This cannot be undone.')) return;
    setDeleteLoading(id);
    try {
      await fetch(`http://localhost:5000/api/seller/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      alert('Failed to delete product');
    } finally {
      setDeleteLoading(null);
    }
  };

  if (loading) return <div className="text-slate-500 dark:text-slate-400 text-center py-12">Loading feedback...</div>;

  const warnings = data?.warnings || [];
  const reviews = data?.reviews || [];
  const stats = data?.stats || {};
  const complaints = reviews.filter(r => r.isComplaint);
  const isBlocked = warnings.some(w => w.type === 'BLOCK');

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="text-pink-500" /> Feedback & Alerts
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Customer reviews, complaints, and admin messages for your account.</p>
      </header>

      {/* Block Banner */}
      {isBlocked && (
        <div className="bg-red-950/50 border border-red-900 rounded-2xl p-5 flex items-start gap-4">
          <Ban className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-red-300 text-lg">Account Blocked</h3>
            <p className="text-red-400/80 text-sm mt-1">Your seller account has been blocked by admin. Please contact support to resolve this.</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center">
          <div className="text-2xl font-black text-slate-900 dark:text-white">{stats.totalReviews || 0}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Total Reviews</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-red-900/30 rounded-2xl p-4 text-center">
          <div className="text-2xl font-black text-red-400">{stats.complaints || 0}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Complaints</div>
        </div>
        <div className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 text-center ${(stats.complaintRatio || 0) > 40 ? 'border-red-900/50' : (stats.complaintRatio || 0) > 20 ? 'border-amber-900/50' : 'border-emerald-900/30'
          }`}>
          <div className={`text-2xl font-black ${(stats.complaintRatio || 0) > 40 ? 'text-red-400' : (stats.complaintRatio || 0) > 20 ? 'text-amber-400' : 'text-emerald-400'
            }`}>{stats.complaintRatio || 0}%</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Complaint Rate</div>
        </div>
      </div>

      {/* Admin Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400" /> Admin Messages
          </h3>
          {warnings.map(w => (
            <div key={w.id} className={`border rounded-xl p-4 flex items-start gap-3 ${w.type === 'BLOCK'
                ? 'bg-red-950/30 border-red-900/50'
                : 'bg-amber-950/30 border-amber-900/50'
              }`}>
              {w.type === 'BLOCK'
                ? <Ban className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                : <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />}
              <div className="flex-1">
                <div className={`font-bold text-sm ${w.type === 'BLOCK' ? 'text-red-300' : 'text-amber-300'}`}>
                  {w.type === 'BLOCK' ? '🚫 Account Block Notice' : '⚠️ Warning from Admin'}
                </div>
                <p className={`text-sm mt-1 ${w.type === 'BLOCK' ? 'text-red-400/80' : 'text-amber-400/80'}`}>{w.message}</p>
                <p className="text-xs text-slate-600 mt-1">{new Date(w.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Products with Delete Option */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Package className="w-5 h-5 text-purple-400" /> Your Products
          <span className="text-xs font-normal text-slate-500 ml-1">(manage & delete)</span>
        </h3>
        {products.length === 0 ? (
          <p className="text-slate-500 text-sm">No products uploaded yet.</p>
        ) : products.map(p => (
          <div key={p.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-4 hover:border-pink-500/20 transition">
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
              <img src={p.img?.split(';')[0]} alt={p.name}
                className="w-full h-full object-cover"
                onError={e => { e.target.src = 'https://placehold.co/50x50/1e293b/ec4899?text=?' }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm line-clamp-1">{p.name}</h4>
              <div className="flex gap-3 items-center mt-1">
                <span className="text-xs text-emerald-400 font-bold">₹{p.price}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${p.status === 'Active' ? 'bg-emerald-950/50 border-emerald-900/50 text-emerald-400'
                    : p.status === 'Pending' ? 'bg-amber-950/50 border-amber-900/50 text-amber-400'
                      : 'bg-red-950/50 border-red-900/50 text-red-400'
                  }`}>
                  {p.status === 'Pending' && <Clock className="w-2.5 h-2.5 inline mr-1" />}
                  {p.status}
                </span>
              </div>
            </div>
            <button
              onClick={() => deleteProduct(p.id)}
              disabled={deleteLoading === p.id}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-400 bg-red-950/30 border border-red-900/40 rounded-xl hover:bg-red-900/30 transition disabled:opacity-50 shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {deleteLoading === p.id ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        ))}
      </div>

      {/* Customer Reviews */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-400" /> Customer Reviews
          {complaints.length > 0 && (
            <span className="text-xs bg-red-950/50 border border-red-900/50 text-red-400 px-2 py-0.5 rounded-full">
              {complaints.length} complaint{complaints.length > 1 ? 's' : ''}
            </span>
          )}
        </h3>
        {reviews.length === 0 ? (
          <p className="text-slate-500 text-sm">No reviews received yet.</p>
        ) : reviews.map(review => (
          <div key={review.id} className={`bg-white dark:bg-slate-900 border rounded-xl p-4 ${review.isComplaint ? 'border-red-900/40' : 'border-slate-200 dark:border-slate-800'
            }`}>
            <div className="flex justify-between items-start gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{review.User?.name}</span>
                  <span className="text-xs text-slate-500">{review.User?.city}</span>
                  {review.isComplaint && (
                    <span className="text-[10px] bg-red-950/50 border border-red-900/50 text-red-400 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5" /> Complaint
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{review.Product?.name}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(s => (
                    <span key={s} className={`text-sm ${s <= review.rating ? 'text-amber-400' : 'text-slate-700'}`}>★</span>
                  ))}
                </div>
                <span className="text-xs text-slate-600">{new Date(review.createdAt).toLocaleDateString('en-IN')}</span>
              </div>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 mt-2">{review.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
