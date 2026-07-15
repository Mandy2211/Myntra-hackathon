import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, Sparkles, DollarSign, TrendingUp, Shield, Lock, User as UserIcon, Mail } from 'lucide-react';

const LOCATION_DATA = {
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Trichy", "Salem"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad"],
  "Karnataka": ["Bengaluru", "Mysuru", "Hubballi", "Mangaluru", "Belagavi"],
  "Delhi": ["New Delhi"],
  "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur"],
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot"],
  "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Asansol"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Varanasi", "Agra", "Noida"]
};

export default function Signup() {
  const { register, error, setError } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('CUSTOMER'); // CUSTOMER vs SELLER
  const [gender, setGender] = useState('');
  const [state, setStateName] = useState('');
  const [city, setCityName] = useState('');
  const [loading, setLoading] = useState(false);

  // If state changes and the selected city is no longer valid, reset city
  useEffect(() => {
    if (state && LOCATION_DATA[state]) {
      if (!LOCATION_DATA[state].includes(city)) {
        setCityName('');
      }
    }
  }, [state]);

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
    if (!gender) {
      setError('Please select a gender preference');
      return;
    }
    if (!state || !city) {
      setError('Please select both state and city');
      return;
    }

    setLoading(true);
    try {
      await register(email, password, role, name, city, state, gender);
      navigate('/login');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex justify-center items-center p-4 sm:p-6 md:p-8 font-sans relative overflow-hidden">
      
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-pink-700/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-750/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row z-10">
        
        {/* Left Pane */}
        <div className="md:w-1/2 bg-gradient-to-br from-pink-950/70 via-purple-950/60 to-slate-900 p-8 sm:p-12 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-850 relative">
          
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
          
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
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <Smartphone className="w-4 h-4" />
                  </span>
                  <input 
                    type="email" 
                    placeholder="yourname@domain.com"
                    className="w-full bg-slate-950 text-slate-100 border border-slate-700/60 focus:border-pink-500 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:outline-none transition-all duration-200 focus:ring-1 focus:ring-pink-500"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input 
                    type="password" 
                    placeholder="Enter secure password"
                    className="w-full bg-slate-950 text-slate-100 border border-slate-700/60 focus:border-pink-500 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:outline-none transition-all duration-200 focus:ring-1 focus:ring-pink-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-405 font-bold uppercase tracking-widest">Platform Role</label>
                    <select 
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full bg-slate-950 text-slate-100 border border-slate-700/60 focus:border-pink-500 rounded-xl py-2.5 px-3 text-xs focus:outline-none transition-all duration-200 focus:ring-1 focus:ring-pink-500"
                    >
                      <option value="CUSTOMER" className="bg-slate-900 text-slate-100">Customer</option>
                      <option value="SELLER" className="bg-slate-900 text-slate-100">Seller</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-405 font-bold uppercase tracking-widest">Gender</label>
                    <select 
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full bg-slate-950 text-slate-100 border border-slate-700/60 focus:border-pink-500 rounded-xl py-2.5 px-3 text-xs focus:outline-none transition-all duration-200 focus:ring-1 focus:ring-pink-500"
                      required
                    >
                      <option value="" disabled className="bg-slate-900 text-slate-400">Select Gender</option>
                      <option value="Men" className="bg-slate-900 text-slate-100">Men</option>
                      <option value="Women" className="bg-slate-900 text-slate-100">Women</option>
                      <option value="Unisex" className="bg-slate-900 text-slate-100">Unisex</option>
                      <option value="Boys" className="bg-slate-900 text-slate-100">Boys</option>
                      <option value="Girls" className="bg-slate-900 text-slate-100">Girls</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-405 font-bold uppercase tracking-widest">Active State</label>
                    <select 
                      value={state}
                      onChange={(e) => setStateName(e.target.value)}
                      className="w-full bg-slate-950 text-slate-100 border border-slate-700/60 focus:border-pink-500 rounded-xl py-2.5 px-3 text-xs focus:outline-none transition-all duration-200 focus:ring-1 focus:ring-pink-555"
                      required
                    >
                      <option value="" disabled className="bg-slate-900 text-slate-400">Select state</option>
                      {Object.keys(LOCATION_DATA).map(st => (
                        <option key={st} value={st} className="bg-slate-900 text-slate-100">{st}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-405 font-bold uppercase tracking-widest">Active City</label>
                    <select 
                      value={city}
                      onChange={(e) => setCityName(e.target.value)}
                      className="w-full bg-slate-950 text-slate-100 border border-slate-700/60 focus:border-pink-500 rounded-xl py-2.5 px-3 text-xs focus:outline-none transition-all duration-200 focus:ring-1 focus:ring-pink-555 disabled:opacity-50"
                      disabled={!state}
                      required
                    >
                      <option value="" disabled className="bg-slate-900 text-slate-400">Select city</option>
                      {state && LOCATION_DATA[state]?.map(c => (
                        <option key={c} value={c} className="bg-slate-900 text-slate-100">{c}</option>
                      ))}
                    </select>
                  </div>
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
