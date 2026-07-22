import React, { useState, useEffect } from 'react';
import { UploadCloud, CheckCircle2, AlertTriangle, Lightbulb, Clock } from 'lucide-react';

export default function CategoryRequestForm() {
  const [formData, setFormData] = useState({
    categoryName: '',
    gender: 'Unisex',
    isSeasonal: false,
    origin: 'Normal',
    description: ''
  });
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [errorMessage, setErrorMessage] = useState('');
  const [pastRequests, setPastRequests] = useState([]);

  const fetchPastRequests = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/seller/category-requests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.requests) setPastRequests(data.requests);
    } catch(err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPastRequests();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.categoryName || !formData.description) {
      setErrorMessage('Category Name and Description are required.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, val]) => {
        data.append(key, val);
      });
      if (file) {
        data.append('sampleImage', file);
      }

      const token = sessionStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/seller/category-request', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: data
      });

      const json = await res.json();
      if (res.ok) {
        setStatus('success');
        setFormData({
          categoryName: '',
          gender: 'Unisex',
          isSeasonal: false,
          origin: 'Normal',
          description: ''
        });
        setFile(null);
        fetchPastRequests(); // Refresh list automatically
      } else {
        throw new Error(json.error || 'Failed to submit category request');
      }
    } catch (error) {
      setErrorMessage(error.message);
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-4">Request Received!</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8">
          Thank you for helping expand Bharat AI! Our curation team will review your suggested category and sample imagery shortly.
        </p>
        <button 
          onClick={() => setStatus('idle')}
          className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 px-8 rounded-xl transition-all"
        >
          Submit Another Request
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 lg:p-12 overflow-hidden relative">
      {/* Decorative Blob */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

      <div className="flex items-start gap-4 mb-8 relative">
        <div className="p-3 bg-purple-500/20 rounded-2xl flex-shrink-0">
          <Lightbulb className="w-6 h-6 text-purple-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Request New Category</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Got a unique local product or a hyper-specific category that our AI hasn't cataloged yet? Suggest it below to register it globally.</p>
        </div>
      </div>

      {status === 'error' && (
        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-400 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p>{errorMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category Name */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-800 dark:text-slate-300">Category Name <span className="text-pink-500">*</span></label>
            <input 
              type="text"
              name="categoryName"
              value={formData.categoryName}
              onChange={handleChange}
              placeholder="e.g. Kalamkari Fabric"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors placeholder:text-slate-600"
              required
            />
          </div>

          {/* Gender Focus */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-800 dark:text-slate-300">Primary Gender Focus <span className="text-pink-500">*</span></label>
            <select 
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-300 focus:outline-none focus:border-purple-500 transition-colors"
            >
              <option value="Men">Men</option>
              <option value="Women">Women</option>
              <option value="Unisex">Unisex</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Origin */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-800 dark:text-slate-300">Category Origin</label>
            <div className="flex bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-1">
              <label className="flex-1 cursor-pointer">
                <input type="radio" name="origin" value="Local" checked={formData.origin === 'Local'} onChange={handleChange} className="sr-only" />
                <div className={`text-center py-2 rounded-lg text-sm font-medium transition-all ${formData.origin === 'Local' ? 'bg-purple-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-300'}`}>
                  Local Speciality
                </div>
              </label>
              <label className="flex-1 cursor-pointer">
                <input type="radio" name="origin" value="Normal" checked={formData.origin === 'Normal'} onChange={handleChange} className="sr-only" />
                <div className={`text-center py-2 rounded-lg text-sm font-medium transition-all ${formData.origin === 'Normal' ? 'bg-purple-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-300'}`}>
                  General Category
                </div>
              </label>
            </div>
          </div>

          {/* Seasonal */}
          <div className="space-y-2">
             <label className="text-sm font-semibold text-slate-800 dark:text-slate-300 flex justify-between">
               Is this highly seasonal? 
               <span className="text-xs font-normal text-slate-500">e.g. Winterwear</span>
             </label>
             <div className="h-11 flex items-center px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
               <label className="relative inline-flex items-center cursor-pointer">
                 <input type="checkbox" name="isSeasonal" checked={formData.isSeasonal} onChange={handleChange} className="sr-only peer" />
                 <div className="w-11 h-6 bg-slate-100 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                 <span className="ml-3 text-sm font-medium text-slate-800 dark:text-slate-300">{formData.isSeasonal ? 'Yes, strictly seasonal' : 'No, year-round'}</span>
               </label>
             </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-800 dark:text-slate-300">Detailed Description <span className="text-pink-500">*</span></label>
          <textarea 
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe what these items are, what materials are usually used, and why customers search for it..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors placeholder:text-slate-600 h-32 resize-none"
            required
          ></textarea>
        </div>

        {/* Sample Photo */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-800 dark:text-slate-300">Sample Reference Photo <span className="text-slate-500 font-normal">(Optional)</span></label>
          <div className="mt-2 flex justify-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 px-6 py-8 bg-slate-50/50 dark:bg-slate-950/50 hover:bg-white dark:bg-slate-900 transition-colors relative overflow-hidden group">
            <div className="text-center">
              <UploadCloud className="mx-auto h-8 w-8 text-slate-500 group-hover:text-purple-400 transition-colors" aria-hidden="true" />
              <div className="mt-4 flex text-sm leading-6 text-slate-500 dark:text-slate-400 justify-center">
                <label className="relative cursor-pointer rounded-md font-semibold text-purple-400 focus-within:outline-none hover:text-purple-300">
                  <span>{file ? file.name : "Upload a file"}</span>
                  <input type="file" name="sampleImage" accept="image/*" onChange={handleFileChange} className="sr-only" />
                </label>
                {!file && <p className="pl-1">or drag and drop</p>}
              </div>
              <p className="text-xs leading-5 text-slate-500">PNG, JPG up to 5MB</p>
            </div>
            {/* Soft tint if file selected */}
            {file && <div className="absolute flex inset-0 bg-purple-500/10 pointer-events-none" />}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
          <button 
            type="submit" 
            disabled={status === 'loading'}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-purple-900/20 hover:shadow-purple-900/40 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {status === 'loading' ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin relative top-0.5"></span>
            ) : (
              'Submit Category Request'
            )}
          </button>
        </div>
      </form>

      {/* Previously Requested Categories */}
      {pastRequests.length > 0 && (
        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 relative z-10">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-purple-400" /> Previously Requested
          </h3>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {pastRequests.map(req => (
              <div key={req.id} className="bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 dark:border-slate-700 transition-colors">
                <div>
                  <h4 className="text-md font-bold text-slate-800 dark:text-slate-200">{req.categoryName}</h4>
                  <div className="flex gap-3 text-xs text-slate-500 mt-1">
                    <span>{req.gender}</span>
                    <span>•</span>
                    <span>{req.origin} Origin</span>
                    {req.isSeasonal && <span>• Seasonal</span>}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">{req.description}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    req.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-400' :
                    req.status === 'Rejected' ? 'bg-rose-500/20 text-rose-400' :
                    'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300'
                  }`}>
                    {req.status}
                  </span>
                  {req.sampleImageUrl && (
                    <a href={req.sampleImageUrl} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 hover:border-purple-500 transition-colors block">
                      <img src={req.sampleImageUrl} alt="Sample" className="w-full h-full object-cover" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
