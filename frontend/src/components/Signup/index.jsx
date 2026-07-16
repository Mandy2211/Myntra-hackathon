import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, Sparkles, DollarSign, TrendingUp, Shield, Lock, User as UserIcon, Smartphone } from 'lucide-react';
import { State, City } from 'country-state-city';
import levenshtein from 'fast-levenshtein';
import SearchableSelect from './SearchableSelect';

export default function Signup() {
  const { register, error, setError } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('CUSTOMER');
  const [gender, setGender] = useState('');
  const [state, setStateName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [yearsInBusiness, setYearsInBusiness] = useState('');
  const [primaryProduct, setPrimaryProduct] = useState('');
  const [pincode, setPincode] = useState('');
  const [city, setCityName] = useState('');
  const [customTown, setCustomTown] = useState('');
  const [suggestedTown, setSuggestedTown] = useState('');
  const [loading, setLoading] = useState(false);

  const states = State.getStatesOfCountry('IN').map(s => ({ value: s.isoCode, label: s.name }));
  const cities = state ? City.getCitiesOfState('IN', state).map(c => ({ value: c.name, label: c.name })) : [];

  useEffect(() => {
    // Reset city if state changes
    setCityName('');
    setCustomTown('');
    setSuggestedTown('');
  }, [state]);

  useEffect(() => {
    if (city === 'OTHERS' && customTown.length > 2) {
      // Find closest city
      let closest = '';
      let minDistance = Infinity;
      cities.forEach(c => {
        const distance = levenshtein.get(customTown.toLowerCase(), c.label.toLowerCase());
        if (distance < minDistance) {
          minDistance = distance;
          closest = c.label;
        }
      });
      // Suggest if it's somewhat close and not exactly the same
      if (closest && minDistance > 0 && minDistance < 5) {
        setSuggestedTown(closest);
      } else {
        setSuggestedTown('');
      }
    } else {
      setSuggestedTown('');
    }
  }, [customTown, city, cities]);

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
      // Get the full state name for the backend
      const fullStateName = states.find(s => s.value === state)?.label || state;
      const finalCity = city === 'OTHERS' ? customTown : city;
      const userData = { email, password, role, name, city: finalCity, state: fullStateName, gender };
      if (role === 'SELLER') {
        Object.assign(userData, {
          mobileNumber, businessType, businessName, gstNumber, 
          yearsInBusiness: yearsInBusiness ? parseInt(yearsInBusiness, 10) : null, 
          primaryProduct, pincode
        });
      }
      await register(userData);
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
              <div className="p-2 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl text-white shadow-lg shadow-pink-650/20">
                <ShoppingBag className="w-5 h-5 animate-pulse" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white">Bharat AI</span>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-350 to-purple-400 leading-tight">
                India's Next 100 Million Smart Fashion Shoppers
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Hyperlocal. Quality-focused. Budget-conscious. We build the digital shelf that aligns personalized style preferences directly with regional climates and community trends.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3">
                <span className="p-1 bg-pink-500/10 text-pink-400 rounded-lg mt-0.5"><Sparkles className="w-3.5 h-3.5" /></span>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Hyperlocal relevance matching</h4>
                  <p className="text-[10px] text-slate-450 mt-0.5">Adapt recommendations to localized climates and active festivals instantly.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="p-1 bg-purple-500/10 text-purple-400 rounded-lg mt-0.5"><DollarSign className="w-3.5 h-3.5" /></span>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Bayesian personal budget shelf</h4>
                  <p className="text-[10px] text-slate-450 mt-0.5">Smart ratings weighting mechanism that matches high-quality item discoveries under price ceilings.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="p-1 bg-emerald-500/10 text-emerald-430 rounded-lg mt-0.5"><TrendingUp className="w-3.5 h-3.5" /></span>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Social-proof trending aggregates</h4>
                  <p className="text-[10px] text-slate-455 mt-0.5">See what is selling hot in Coimbatore, Vizag, Patna and Belgaum in real-time.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 text-[10px] text-slate-500 flex items-center gap-1.5 border-t border-slate-800/60 pt-4 relative">
            <Shield className="w-3.5 h-3.5 text-pink-500" />
            Hyperlocal Fashion Storefront Core Sandbox v2.0
          </div>
        </div>

        {/* Right Pane: Login Form Card */}
        <div className="md:w-1/2 p-8 sm:p-12 flex flex-col justify-center bg-slate-900/50">
          
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850 mb-6">
            <Link 
              to="/login"
              className="flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-all duration-200 text-slate-400 hover:text-slate-200"
            >
              Sign In
            </Link>
            <Link 
              to="/register"
              className="flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-all duration-200 bg-gradient-to-r from-pink-600 to-purple-650 text-white shadow"
            >
              Register
            </Link>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-100">Create your account</h3>
              <p className="text-xs text-slate-400 mt-1">Enter credentials and start discovery</p>
            </div>

            {error && (
              <div className="p-3 bg-rose-950/40 border border-rose-900/50 text-rose-455 rounded-lg text-xs leading-relaxed">
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
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-405 font-bold uppercase tracking-widest">Full Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                      <UserIcon className="w-4 h-4" />
                    </span>
                    <input 
                      type="text" 
                      placeholder="Your full name"
                      className="w-full bg-slate-950 text-slate-100 border border-slate-700/60 focus:border-pink-500 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:outline-none transition-all duration-200 focus:ring-1 focus:ring-pink-500"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
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
                    <SearchableSelect 
                      options={states}
                      value={state}
                      onChange={setStateName}
                      placeholder="Select state"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-405 font-bold uppercase tracking-widest">Active City</label>
                    <SearchableSelect 
                      options={cities}
                      value={city}
                      onChange={setCityName}
                      placeholder="Select city"
                      disabled={!state}
                      allowOthers={true}
                    />
                  </div>
                </div>

                {city === 'OTHERS' && (
                  <div className="space-y-1.5 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <label className="text-[10px] text-pink-400 font-bold uppercase tracking-widest">Enter your town</label>
                    <input 
                      type="text" 
                      placeholder="Type your town name"
                      className="w-full bg-slate-950 text-slate-100 border border-slate-700/60 focus:border-pink-500 rounded-lg py-2 px-3 text-xs focus:outline-none transition-all duration-200"
                      value={customTown}
                      onChange={(e) => setCustomTown(e.target.value)}
                      required
                    />
                    {suggestedTown && (
                      <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
                        <span>Did you mean <strong className="text-pink-400">{suggestedTown}</strong>?</span>
                        <button 
                          type="button"
                          onClick={() => {
                            setCityName(suggestedTown);
                            setCustomTown('');
                            setSuggestedTown('');
                          }}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-1 rounded text-[10px] transition-colors"
                        >
                          Yes, select this
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {role === 'SELLER' && (
                  <div className="space-y-4 pt-4 mt-4 border-t border-slate-800/80">
                    <h4 className="text-xs font-bold text-pink-400 uppercase tracking-wider mb-2">Business Details (Onboarding)</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-405 font-bold uppercase tracking-widest">Mobile Number *</label>
                        <input type="tel" placeholder="Enter mobile number" className="w-full bg-slate-950 text-slate-100 border border-slate-700/60 focus:border-pink-500 rounded-xl py-2 px-3 text-xs focus:outline-none" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} required />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-405 font-bold uppercase tracking-widest">Business Type *</label>
                        <select className="w-full bg-slate-950 text-slate-100 border border-slate-700/60 focus:border-pink-500 rounded-xl py-2 px-3 text-xs focus:outline-none" value={businessType} onChange={(e) => setBusinessType(e.target.value)} required>
                          <option value="">Select Type</option>
                          <option value="Registered Brand">Registered Brand</option>
                          <option value="Local Shop">Local Shop</option>
                          <option value="Home Business">Home Business</option>
                          <option value="Artisan">Artisan</option>
                          <option value="Individual Seller">Individual Seller</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-405 font-bold uppercase tracking-widest">Business / Shop Name *</label>
                        <input type="text" placeholder="Business Name" className="w-full bg-slate-950 text-slate-100 border border-slate-700/60 focus:border-pink-500 rounded-xl py-2 px-3 text-xs focus:outline-none" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-405 font-bold uppercase tracking-widest">Primary Product *</label>
                        <input type="text" placeholder="e.g. Ethnic, Footwear" className="w-full bg-slate-950 text-slate-100 border border-slate-700/60 focus:border-pink-500 rounded-xl py-2 px-3 text-xs focus:outline-none" value={primaryProduct} onChange={(e) => setPrimaryProduct(e.target.value)} required />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-405 font-bold uppercase tracking-widest">Years Active *</label>
                        <input type="number" min="0" placeholder="Yrs" className="w-full bg-slate-950 text-slate-100 border border-slate-700/60 focus:border-pink-500 rounded-xl py-2 px-3 text-xs focus:outline-none" value={yearsInBusiness} onChange={(e) => setYearsInBusiness(e.target.value)} required />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-405 font-bold uppercase tracking-widest">Pincode *</label>
                        <input type="text" placeholder="Zip code" className="w-full bg-slate-950 text-slate-100 border border-slate-700/60 focus:border-pink-500 rounded-xl py-2 px-3 text-xs focus:outline-none" value={pincode} onChange={(e) => setPincode(e.target.value)} required />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-405 font-bold uppercase tracking-widest">GST (Optional)</label>
                        <input type="text" placeholder="GSTIN" className="w-full bg-slate-950 text-slate-100 border border-slate-700/60 focus:border-pink-500 rounded-xl py-2 px-3 text-xs focus:outline-none" value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-to-r from-pink-650 to-purple-650 text-white font-semibold py-2.5 rounded-xl text-xs hover:shadow-lg transition-all duration-300 disabled:opacity-50 mt-4 active:scale-[0.98]"
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
