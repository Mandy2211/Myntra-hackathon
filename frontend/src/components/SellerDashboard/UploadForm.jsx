import React, { useState } from 'react';
import { Upload, Plus, X, Box, Tag, Layers, Droplets, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function UploadForm({ onSuccess }) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    mrp: '',
    stock: '',
    gender: 'Women',
    category: 'Saree',
    material: 'Unknown',
    occasion: 'Casual'
  });

  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 5) {
      setError('Maximum 5 images allowed');
      return;
    }
    setImages(prev => [...prev, ...files]);
    
    // Create preview URLs
    const newUrls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newUrls]);
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => {
      const newUrls = [...prev];
      URL.revokeObjectURL(newUrls[index]);
      newUrls.splice(index, 1);
      return newUrls;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (images.length === 0) {
      setError('Please upload at least one image');
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      images.forEach(img => data.append('images', img));

      const res = await fetch('http://localhost:5000/api/seller/products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Don't set Content-Type, browser will set it to multipart/form-data with boundary
        },
        body: data
      });

      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.error || 'Upload failed');

      // Reset form
      setFormData({
        name: '', description: '', price: '', mrp: '', stock: '',
        gender: 'Women', category: 'Saree', material: 'Unknown', occasion: 'Casual'
      });
      setImages([]);
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      setPreviewUrls([]);
      
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-800">
        <div className="p-2 bg-pink-500/10 text-pink-400 rounded-lg"><Plus className="w-5 h-5" /></div>
        <div>
          <h2 className="text-xl font-bold text-slate-100">Upload New Product</h2>
          <p className="text-xs text-slate-400 mt-1">Provide basic details. Our AI engine will map climates, regions, and styles automatically.</p>
        </div>
      </div>

      {error && <div className="mb-6 p-4 bg-rose-950/40 border border-rose-900 text-rose-400 text-xs rounded-lg">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Core Info */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-2"><Box className="w-3.5 h-3.5 text-pink-400"/> Product Name *</label>
            <input name="name" value={formData.name} onChange={handleChange} required placeholder="e.g. Women's Pink Cotton Printed Kurta" className="w-full bg-slate-950 border border-slate-800 focus:border-pink-500 rounded-xl px-4 py-2.5 text-sm outline-none text-slate-100 transition-colors" />
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Selling Price *</label>
              <input name="price" type="number" min="0" value={formData.price} onChange={handleChange} required placeholder="₹" className="w-full bg-slate-950 border border-slate-800 focus:border-pink-500 rounded-xl px-4 py-2.5 text-sm outline-none text-slate-100 transition-colors" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">MRP *</label>
              <input name="mrp" type="number" min="0" value={formData.mrp} onChange={handleChange} required placeholder="₹" className="w-full bg-slate-950 border border-slate-800 focus:border-pink-500 rounded-xl px-4 py-2.5 text-sm outline-none text-slate-100 transition-colors" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Stock *</label>
              <input name="stock" type="number" min="0" value={formData.stock} onChange={handleChange} required placeholder="Qty" className="w-full bg-slate-950 border border-slate-800 focus:border-pink-500 rounded-xl px-4 py-2.5 text-sm outline-none text-slate-100 transition-colors" />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">Description</label>
          <textarea name="description" value={formData.description} onChange={handleChange} rows="3" placeholder="Describe the quality, fit, and origin of the product..." className="w-full bg-slate-950 border border-slate-800 focus:border-pink-500 rounded-xl px-4 py-3 text-sm outline-none text-slate-100 transition-colors resize-none" />
        </div>

        <div className="h-px bg-slate-800 my-6" />

        {/* Categories */}
        <div className="grid md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-2"><Tag className="w-3.5 h-3.5 text-purple-400"/> Gender</label>
            <select name="gender" value={formData.gender} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 focus:border-pink-500 rounded-xl px-3 py-2.5 text-sm outline-none text-slate-100">
              <option value="Men">Men</option><option value="Women">Women</option><option value="Boys">Boys</option>
              <option value="Girls">Girls</option><option value="Kids">Kids</option><option value="Unisex">Unisex</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-2"><Layers className="w-3.5 h-3.5 text-blue-400"/> Category</label>
            <select name="category" value={formData.category} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 focus:border-pink-500 rounded-xl px-3 py-2.5 text-sm outline-none text-slate-100">
              <option value="Shirt">Shirt</option><option value="Dress">Dress</option><option value="Kurta">Kurta</option>
              <option value="Top">Top</option><option value="Jeans">Jeans</option><option value="Trouser">Trouser</option>
              <option value="Saree">Saree</option><option value="Shorts">Shorts</option><option value="T-Shirt">T-Shirt</option>
              <option value="Lehenga">Lehenga</option><option value="Skincare">Skincare</option><option value="Shoes">Shoes</option>
              <option value="Raincoats">Raincoats</option>
              <option value="Kurti Sets">Kurti Sets</option>
              <option value="Umbrella">Umbrella</option>
              <option value="Accessories">Accessories</option>
              {/* Added common ones from instructions */}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-2"><Droplets className="w-3.5 h-3.5 text-emerald-400"/> Material</label>
            <select name="material" value={formData.material} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 focus:border-pink-500 rounded-xl px-3 py-2.5 text-sm outline-none text-slate-100">
              <option value="Unknown">Unknown</option><option value="Cotton">Cotton</option><option value="Silk">Silk</option>
              <option value="Denim">Denim</option><option value="Georgette">Georgette</option><option value="Leather">Leather</option>
              <option value="Crepe">Crepe</option><option value="Kanjeevaram Silk">Kanjeevaram Silk</option><option value="Banarasi Silk">Banarasi Silk</option>
              <option value="Linen">Linen</option><option value="Chiffon">Chiffon</option><option value="Velvet">Velvet</option>
              <option value="Wool">Wool</option><option value="Rayon">Rayon</option><option value="Polyester">Polyester</option><option value="Satin">Satin</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-yellow-400"/> Occasion</label>
            <select name="occasion" value={formData.occasion} onChange={handleChange} className="w-full bg-slate-950 border border-slate-800 focus:border-pink-500 rounded-xl px-3 py-2.5 text-sm outline-none text-slate-100">
              <option value="Casual">Casual</option>
              <option value="Festival">Festival</option>
              <option value="Sports">Sports</option>
              <option value="Formal">Formal</option>
              <option value="Party Wear">Party Wear</option>
              <option value="Seasonal">Seasonal</option>
            </select>
          </div>
        </div>

        <div className="h-px bg-slate-800 my-6" />

        {/* Image Upload */}
        <div className="space-y-4">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">Product Images *</label>
          <div className="flex flex-wrap gap-4">
            {previewUrls.map((url, i) => (
              <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-700 group">
                <img src={url} alt="Preview" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-black/60 p-1 rounded hover:bg-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
            
            {images.length < 5 && (
              <label className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-700 flex flex-col items-center justify-center cursor-pointer hover:border-pink-500 hover:bg-pink-900/10 transition-colors">
                <Upload className="w-6 h-6 text-slate-400" />
                <span className="text-[10px] text-slate-500 mt-1">Add Image</span>
                <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            )}
          </div>
        </div>

        <div className="pt-6">
          <button type="submit" disabled={loading} className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg hover:shadow-pink-500/25 disabled:opacity-50">
            {loading ? 'Processing Enrichment...' : 'Save Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
