import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Languages, Activity, ChevronDown, Check } from 'lucide-react';

const LANGUAGES = [
  { code: 'English', label: 'English' },
  { code: 'Hindi', label: 'हिंदी (Hindi)' },
  { code: 'Tamil', label: 'தமிழ் (Tamil)' },
  { code: 'Telugu', label: 'తెలుగు (Telugu)' },
  { code: 'Kannada', label: 'కన్నడ (Kannada)' },
  { code: 'Bengali', label: 'বাংলা (Bengali)' },
];

export default function SellerSummary({ categoryData }) {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('English');
  const [error, setError] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSummary = async (lang) => {
    if (!categoryData || categoryData.length === 0) return;
    setLoading(true);
    setError(null);

    const models = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"];
    let lastError = null;

    for (const model of models) {
      try {
        const prompt = `You are an expert e-commerce business analyst for local fashion sellers. Analyze this live market data and provide a concise, encouraging, and actionable summary written entirely in ${lang} script/language. Focus on high demand gaps and what the seller should stock next. Keep it under 4 sentences. Data: ${JSON.stringify(categoryData)}`;

        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            max_tokens: 250,
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `Status ${res.status}`);
        }

        const data = await res.json();
        setSummary(data.choices[0]?.message?.content || '');
        setLoading(false);
        return; // Success!
      } catch (err) {
        console.error(`Groq API Error (${model}):`, err);
        lastError = err;
      }
    }

    // If all models fail
    setError(`Live AI mode unavailable (${lastError?.message || 'API Error'}). Operating in offline mode.`);
    setSummary(`(Offline Fallback) Focus on stocking high-demand items. Based on current trends, prioritize products with the highest Opportunity Score.`);
    setLoading(false);
  };

  useEffect(() => {
    fetchSummary(language);
  }, [categoryData, language]);

  const currentLangLabel = LANGUAGES.find(l => l.code === language)?.label || 'English';

  return (
    <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/20 border border-purple-500/30 rounded-2xl p-6 mb-8 relative">
      <div className="absolute top-0 right-0 bg-pink-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1">
        <Sparkles className="w-3 h-3" /> LIVE AI MODE
      </div>
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Sparkles className="text-pink-400 w-5 h-5" /> AI Market Summary
        </h3>

        {/* Collapsible Language Selection Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 text-xs bg-slate-900/90 hover:bg-slate-800 border border-purple-500/40 text-slate-200 px-3.5 py-2 rounded-xl transition-all shadow-lg focus:outline-none"
          >
            <Languages className="w-4 h-4 text-pink-400" />
            <span className="font-semibold">{currentLangLabel}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 py-1.5 backdrop-blur animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 mb-1">
                Select AI Summary Language
              </div>
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition-colors ${
                    language === lang.code
                      ? 'bg-pink-600/20 text-pink-400 font-bold'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>{lang.label}</span>
                  {language === lang.code && <Check className="w-3.5 h-3.5 text-pink-400" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-pink-400 py-3 animate-pulse">
          <Activity className="w-5 h-5 animate-spin" />
          <span className="text-sm font-medium">Generating AI summary in {currentLangLabel}...</span>
        </div>
      ) : (
        <div className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-sans">
          {error && <div className="text-amber-400 text-xs mb-2 font-medium">{error}</div>}
          {summary || "Waiting for enough market data to generate a summary."}
        </div>
      )}
    </div>
  );
}
