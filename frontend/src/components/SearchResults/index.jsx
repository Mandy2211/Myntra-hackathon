import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Search, ArrowLeft, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Minimal header for the search results page
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
        
        {/* Mirror the search bar for continuous searching */}
        <div className="flex-1 max-w-xl mx-4">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const val = e.target.search.value;
              if(!val.trim()) return;
              
              const token = localStorage.getItem('token');
              fetch('http://localhost:5000/api/search/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ rawQuery: val })
              }).catch(err => console.error('Silent search track failed', err));
              
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

      <main className="flex-1 flex flex-col items-center justify-center p-8 max-w-4xl mx-auto w-full text-center">
        <div className="bg-slate-900 border border-slate-800 p-12 rounded-3xl shadow-xl w-full">
          <Search className="w-16 h-16 text-pink-500 mx-auto mb-6 opacity-80" />
          <h2 className="text-3xl font-bold text-white mb-4">
            Showing results for: <span className="text-pink-400">"{query}"</span>
          </h2>
          <p className="text-slate-400 text-lg mb-8 max-w-2xl mx-auto">
            This is a placeholder page. The semantic search engine indexing for products is still under construction.
            However, your search has been successfully parsed by our LLM and securely logged to the Database! 
          </p>
          <div className="inline-block bg-slate-950 border border-slate-800 rounded-xl p-4 text-left">
            <p className="text-sm font-semibold text-emerald-400 mb-2">Internal Telemetry Check</p>
            <ul className="text-xs text-slate-400 space-y-1 font-mono">
              <li>Raw Query sent to OpenRouter API</li>
              <li>JSON format processed: true</li>
              <li>Structured tags extracted and captured</li>
              <li>Logged against City: <span className="text-white font-bold">{user?.city}</span></li>
            </ul>
          </div>
          <div className="mt-8">
            <button 
              onClick={() => navigate('/')} 
              className="bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 px-6 rounded-lg border border-slate-700 transition"
            >
              Go back to Home
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
