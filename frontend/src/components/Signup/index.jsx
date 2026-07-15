import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, Sparkles, DollarSign, TrendingUp, Shield, Lock, User as UserIcon, Mail } from 'lucide-react';

export default function Signup() {
  const { register, error, setError } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [language, setLanguage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password || !name || !gender || !city || !state || !language) {
      setError('Please fill in all the details');
      return;
    }
    if (password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }

    setLoading(true);
    try {
      await register({ name, email, password, gender, city, state, language });
      navigate('/'); // Go directly to dashboard as login is implicit on return
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex justify-center items-center p-4 sm:p-6 md:p-8 font-sans relative overflow-hidden">
      
      {/* Background glowing gradients */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-pink-700/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-750/10 rounded-full blur-3xl pointer-events-none" />
      
      {/* Split screen outer container */}
      <div className="max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row z-10">
        
        {/* Left Pane: Marketing */}
        <div className="md:w-1/2 bg-gradient-to-br from-pink-950/70 via-purple-950/60 to-slate-900 p-8 sm:p-12 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800 relative z-10">
          <div className="relative space-y-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl text-white shadow-lg">
                <ShoppingBag className="w-5 h-5 animate-pulse" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white">Bharat AI</span>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-350 to-purple-400 leading-tight">
                India's Next 100 Million Smart Fashion Shoppers
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Hyperlocal. Quality-focused. Budget-conscious. The digital shelf that aligns personalized style directly with regional climates and festivals.
              </p>
            </div>
          </div>
        </div>

        {/* Right Pane: Sign up Form Card */}
        <div className="md:w-1/2 p-8 sm:p-12 flex flex-col justify-center bg-slate-900/50">
          
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 mb-6">
            <Link 
              to="/login"
              className="flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-all duration-200 text-slate-400 hover:text-slate-200"
            >
              Sign In
            </Link>
            <Link 
              to="/register"
              className="flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-all duration-200 bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow"
            >
              Register
            </Link>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-100">Create your account</h3>
            </div>

            {error && (
              <div className="p-3 bg-rose-950/40 border border-rose-900/50 text-rose-400 rounded-lg text-xs leading-relaxed">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 focus-within:text-pink-400">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Full Name</label>
                  <input 
                    type="text" placeholder="Full name"
                    className="w-full bg-slate-950 text-white border border-slate-700/60 focus:border-pink-500 rounded-xl py-2.5 px-4 text-xs focus:outline-none transition-all duration-200"
                    value={name} onChange={(e) => setName(e.target.value)} required
                  />
                </div>
                <div className="space-y-1.5 focus-within:text-pink-400">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Email</label>
                  <input 
                    type="email" placeholder="Email address"
                    className="w-full bg-slate-950 text-white border border-slate-700/60 focus:border-pink-500 rounded-xl py-2.5 px-4 text-xs focus:outline-none transition-all duration-200"
                    value={email} onChange={(e) => setEmail(e.target.value)} required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1.5 focus-within:text-pink-400">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Password</label>
                  <input 
                    type="password" placeholder="Password"
                    className="w-full bg-slate-950 text-white border border-slate-700/60 focus:border-pink-500 rounded-xl py-2.5 px-4 text-xs focus:outline-none transition-all duration-200"
                    value={password} onChange={(e) => setPassword(e.target.value)} required
                  />
                </div>
                <div className="space-y-1.5 focus-within:text-pink-400">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Gender</label>
                  <select 
                    value={gender} onChange={(e) => setGender(e.target.value)} required
                    className="w-full bg-slate-950 text-white border border-slate-700/60 focus:border-pink-500 rounded-xl py-2.5 px-3 text-xs focus:outline-none transition-all"
                  >
                    <option value="" disabled>Select Gender</option>
                    <option value="Men">Male</option>
                    <option value="Women">Female</option>
                    <option value="Unisex">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5 focus-within:text-pink-400">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">State</label>
                  <select 
                    value={state} onChange={(e) => { setState(e.target.value); setCity(''); }} required
                    className="w-full bg-slate-950 text-white border border-slate-700/60 focus:border-pink-500 rounded-xl py-2.5 px-3 text-xs focus:outline-none transition-all"
                  >
                    <option value="" disabled>Select State</option>
                    <option value="Andhra Pradesh">Andhra Pradesh</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Kerala">Kerala</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Gujarat">Gujarat</option>
                    <option value="West Bengal">West Bengal</option>
                    <option value="Telangana">Telangana</option>
                  </select>
                </div>
                <div className="space-y-1.5 focus-within:text-pink-400">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">City</label>
                  <select 
                    value={city} onChange={(e) => setCity(e.target.value)} required
                    className="w-full bg-slate-950 text-white border border-slate-700/60 focus:border-pink-500 rounded-xl py-2.5 px-3 text-xs focus:outline-none transition-all"
                  >
                    <option value="" disabled>Select City</option>
                    <option value="Visakhapatnam">Visakhapatnam (AP)</option>
                    <option value="Mumbai">Mumbai (MH)</option>
                    <option value="Chennai">Chennai (TN)</option>
                    <option value="Bangalore">Bangalore (KA)</option>
                    <option value="Kochi">Kochi (KL)</option>
                    <option value="Delhi">Delhi (DL)</option>
                    <option value="Ahmedabad">Ahmedabad (GJ)</option>
                    <option value="Kolkata">Kolkata (WB)</option>
                    <option value="Hyderabad">Hyderabad (TG)</option>
                    <option value="Coimbatore">Coimbatore (TN)</option>
                  </select>
                </div>
                <div className="space-y-1.5 focus-within:text-pink-400">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Language</label>
                  <select 
                    value={language} onChange={(e) => setLanguage(e.target.value)} required
                    className="w-full bg-slate-950 text-white border border-slate-700/60 focus:border-pink-500 rounded-xl py-2.5 px-2 text-xs focus:outline-none transition-all"
                  >
                    <option value="" disabled>Select</option>
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Tamil">Tamil</option>
                    <option value="Telugu">Telugu</option>
                    <option value="Kannada">Kannada</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold py-2.5 rounded-xl text-xs hover:shadow-lg transition-all duration-300 disabled:opacity-50 mt-4 active:scale-[0.98]"
              >
                {loading ? 'Processing...' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
