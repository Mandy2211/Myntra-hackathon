import React, { useState, useEffect } from 'react';
import { Package, Search, Trash2, Edit, Star, CloudRain, Sun, Leaf } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ProductsTable({ refreshTrigger }) {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, [refreshTrigger]); // re-fetch when new product is added

  const fetchProducts = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/seller/products', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/seller/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setProducts(products.filter(p => p.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 dark:text-slate-400">Loading products...</div>;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg"><Package className="w-5 h-5" /></div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">My Products</h2>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input type="text" placeholder="Search inventory..." className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-pink-500 w-64" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <th className="px-6 py-4 font-semibold">Product</th>
              <th className="px-6 py-4 font-semibold">Price</th>
              <th className="px-6 py-4 font-semibold">Stock</th>
              <th className="px-6 py-4 font-semibold">Enriched Intelligence</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50 text-sm">
            {products.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-slate-500 text-xs">
                  No products found. Start by uploading your local inventory!
                </td>
              </tr>
            ) : products.map(product => (
              <tr key={product.id} className="hover:bg-slate-100 dark:hover:bg-slate-800/20 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex-shrink-0 overflow-hidden">
                      {product.images ? (
                        <img 
                          src={product.images.split(';')[0].startsWith('http') ? product.images.split(';')[0] : `http://localhost:5000${product.images.split(';')[0]}`} 
                          alt={product.name} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <Package className="w-5 h-5 text-slate-500 m-2.5" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">{product.name}</h4>
                      <p className="text-[10px] text-slate-500 mt-1">{product.category} • {product.gender} • {product.material}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-300">₹{product.price}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${product.stock > 10 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                    {product.stock} left
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-2 text-[10px] font-semibold tracking-wide">
                    <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 px-2 py-1 rounded">
                      {product.season === 'Summer' ? <Sun className="w-3 h-3 text-yellow-400"/> : product.season === 'Rainy' || product.season === 'Monsoon' ? <CloudRain className="w-3 h-3 text-blue-400"/> : <Leaf className="w-3 h-3 text-emerald-400"/>}
                      {product.season}
                    </span>
                    <span className="bg-slate-100 dark:bg-slate-800 text-purple-400 px-2 py-1 rounded border border-purple-500/20">
                      {product.occasion}
                    </span>
                    <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-pink-400 px-2 py-1 rounded border border-pink-500/20">
                      <Star className="w-3 h-3"/> Rating: {product.rating}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-semibold border ${
                    product.status === 'Active'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : product.status === 'Pending'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : product.status === 'Rejected'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      : 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20'
                  }`}>
                    {product.status === 'Active' ? '✓ Approved' : product.status || 'Unknown'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-400 transition-colors rounded">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteProduct(product.id)} className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-rose-400 transition-colors rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
