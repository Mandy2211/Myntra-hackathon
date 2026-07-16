import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { TrendingUp, AlertTriangle, CheckCircle, Search, Activity, Package, Plus, LayoutDashboard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UploadForm from './UploadForm';
import ProductsTable from './ProductsTable';

export default function SellerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  
  // Navigation State
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard | products | upload
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (user && user.role !== 'SELLER') {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('token');
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
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-sans">
        <Activity className="w-12 h-12 text-pink-500 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-slate-200">Loading Intelligence Engine...</h2>
      </div>
    );
  }

  const handleUploadSuccess = () => {
    setActiveTab('products');
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
        
        {/* Left Sidebar Navigation */}
        <aside className="w-full md:w-64 shrink-0 space-y-6">
          <div>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-400 mb-1">
              Growth Hub
            </h1>
            <p className="text-xs text-slate-400">{user?.name} / {user?.city}</p>
          </div>

          <nav className="space-y-2">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === 'dashboard' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}
            >
              <LayoutDashboard className="w-4 h-4" /> Market Intelligence
            </button>
            <button 
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === 'products' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}
            >
              <Package className="w-4 h-4" /> My Products
            </button>
            <button 
              onClick={() => setActiveTab('upload')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === 'upload' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}
            >
              <Plus className="w-4 h-4" /> Upload Catalog
            </button>
          </nav>
          
          <button onClick={() => navigate('/')} className="block w-full text-center text-xs font-medium text-pink-400 hover:text-pink-300 mt-12 py-4 border-t border-slate-800">
            ← Back to Consumer Store
          </button>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <header className="mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <TrendingUp className="text-emerald-400" /> Real-Time Search Gap Analysis
                </h2>
                <p className="text-sm text-slate-400 mt-1">Live competitive intelligence for {data?.sellerRegion?.city || user?.city}. Upload products that are trending to capture unmatched local demand.</p>
              </header>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {data?.marketInsights?.length > 0 ? (
                  data.marketInsights.map((insight, idx) => (
                    <GapCard key={idx} insight={insight} />
                  ))
                ) : (
                  <div className="col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center">
                    <Search className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-300 mb-2">Waiting for local consumer signals</h3>
                    <p className="text-slate-500 max-w-md mx-auto">No recent searches captured in your region yet. Check back later.</p>
                  </div>
                )}
              </div>
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

        </main>
      </div>
    </div>
  );
}

function GapCard({ insight }) {
  const isHighOpportunity = insight.gapScore > 75;
  const isSaturated = insight.gapScore < 30;

  return (
    <div className={`bg-slate-900 border ${isHighOpportunity ? 'border-emerald-500/50 shadow-lg shadow-emerald-900/20' : 'border-slate-800'} rounded-2xl p-6 relative overflow-hidden flex flex-col`}>
      {isHighOpportunity && (
        <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl origin-top-right">
          HIGH DEMAND
        </div>
      )}
      
      <h3 className="text-2xl font-black text-white mb-1 uppercase tracking-wider">{insight.keyword}</h3>
      <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mb-6">Trending Category</p>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <div className="text-3xl font-black text-rose-400">{insight.searchVolume}</div>
          <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">Live Searches</div>
        </div>
        <div>
          <div className="text-3xl font-black text-slate-300">{insight.availableProducts}</div>
          <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">Local Supply</div>
        </div>
      </div>

      <div className="mt-auto">
        <div className="flex justify-between items-end mb-2">
          <span className="text-xs font-bold text-slate-400 uppercase">Opportunity Score</span>
          <span className={`text-xl font-black ${isHighOpportunity ? 'text-emerald-400' : isSaturated ? 'text-amber-400' : 'text-blue-400'}`}>
            {insight.gapScore}/100
          </span>
        </div>
        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
          <div 
            className={`h-full ${isHighOpportunity ? 'bg-emerald-500' : isSaturated ? 'bg-amber-500' : 'bg-blue-500'}`} 
            style={{ width: `${insight.gapScore}%` }}
          />
        </div>
        
        <div className={`mt-4 p-3 rounded-lg text-xs font-medium flex items-start gap-2 ${isHighOpportunity ? 'bg-emerald-950/30 text-emerald-300' : 'bg-slate-800/50 text-slate-300'}`}>
          {isHighOpportunity ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />}
          {insight.recommendation}
        </div>
      </div>
    </div>
  );
}
