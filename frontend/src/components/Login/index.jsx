import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, Sparkles, DollarSign, TrendingUp, Shield, Smartphone, Lock } from 'lucide-react';

export default function Login() {
  const { login, error, setError } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (email.length < 5 || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      // AuthContext Navigate to / handles redirect upon user login implicitly, but we let state take over
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex justify-center items-center p-4 sm:p-6 md:p-8 font-sans relative overflow-hidden transition-colors">

      {/* Background glowing gradients */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-pink-700/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-750/10 rounded-full blur-3xl pointer-events-none" />

      {/* Split screen outer container */}
      <div className="max-w-4xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row z-10 transition-colors">

        {/* Left Pane: Marketing value propositions */}
        <div className="md:w-1/2 bg-gradient-to-br from-pink-50/70 via-purple-50/60 to-slate-100 dark:from-pink-950/70 dark:via-purple-950/60 dark:to-slate-900 p-8 sm:p-12 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-850 relative transition-colors">

          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

          <div className="relative space-y-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl text-white shadow-lg shadow-pink-650/20">
                <ShoppingBag className="w-5 h-5 animate-pulse" />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white transition-colors">Bharat AI</span>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 dark:from-pink-400 dark:via-rose-350 dark:to-purple-400 leading-tight">
                India's Next 100 Million Smart Fashion Shoppers
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed transition-colors">
                Hyperlocal. Quality-focused. Budget-conscious. We build the digital shelf that aligns personalized style preferences directly with regional climates and community trends.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3">
                <span className="p-1 bg-pink-500/10 text-pink-600 dark:text-pink-400 rounded-lg mt-0.5"><Sparkles className="w-3.5 h-3.5" /></span>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Hyperlocal relevance matching</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-450 mt-0.5">Adapt recommendations to localized climates and active festivals instantly.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="p-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg mt-0.5"><DollarSign className="w-3.5 h-3.5" /></span>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Bayesian personal budget shelf</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-450 mt-0.5">Smart ratings weighting mechanism that matches high-quality item discoveries under price ceilings.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="p-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-430 rounded-lg mt-0.5"><TrendingUp className="w-3.5 h-3.5" /></span>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Social-proof trending aggregates</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-455 mt-0.5">See what is selling hot in Coimbatore, Vizag, Patna and Belgaum in real-time.</p>
                </div>
              </div>
            </div>
          </div>


        </div>

        {/* Right Pane: Login Form Card */}
        <div className="md:w-1/2 p-8 sm:p-12 flex flex-col justify-center bg-slate-50/50 dark:bg-slate-900/50 transition-colors">

          <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 mb-6 transition-colors">
            <Link
              to="/login"
              className="flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-all duration-200 bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-all duration-200 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            >
              Register
            </Link>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 transition-colors">Welcome back</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Log in using your registered email address</p>
            </div>

            {error && (
              <div className="p-3 bg-rose-950/40 border border-rose-900/50 text-rose-455 rounded-lg text-xs leading-relaxed">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 dark:text-slate-500">
                    <Smartphone className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    placeholder="yourname@domain.com"
                    className="w-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700/60 focus:border-pink-500 dark:focus:border-pink-500 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:outline-none transition-all duration-200 focus:ring-1 focus:ring-pink-500"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Password PIN</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 dark:text-slate-500">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    placeholder="Enter security PIN"
                    className="w-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700/60 focus:border-pink-500 dark:focus:border-pink-500 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:outline-none transition-all duration-200 focus:ring-1 focus:ring-pink-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold py-3 rounded-xl text-xs hover:shadow-lg transition-all duration-300 disabled:opacity-50 mt-4 active:scale-[0.98]"
              >
                {loading ? 'Processing...' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
