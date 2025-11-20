// src/components/supplier/ProductForm.tsx
import React, { useEffect } from 'react';
import ImageUploader from './ImageUploader'; // <--- NEW IMPORT
import VideoUploader from './VideoUploader'; // <--- NEW IMPORT

// --- Data Types ---
export interface VariationGroup {
  id: number;
  name: string;
  options: string[];
}

export interface VariationOption {
  id: string;
  option1: string; 
  option2?: string;
  price: number;
  stock: number;
  sku: string;
}

export interface ProductFormData {
  name: string;
  description: string;
  // --- NEW MEDIA FIELDS ---
  images: string[]; 
  videoUrl: string;
  // ------------------------
  price: number;
  sku: string; 
  category: string;
  brand: string;
  stock: number;
  weight: number;
  is_variable: boolean;
  variations: VariationGroup[];
  variation_options: VariationOption[];
  pkg_length: number;
  pkg_width: number;
  pkg_height: number;
}

interface ProductFormProps {
  data: ProductFormData;
  onChange: (data: ProductFormData) => void;
  activeTab: 'basic' | 'sales' | 'variations' | 'shipping';
  onTabChange: (tab: 'basic' | 'sales' | 'variations' | 'shipping') => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ data, onChange, activeTab, onTabChange }) => {

  // Helper to update specific fields
  const updateField = (field: keyof ProductFormData, value: ProductFormData[keyof ProductFormData]) => {
    onChange({ ...data, [field]: value });
  };

  // Variation Logic
  useEffect(() => {
    if (!data.is_variable) return;
    if (data.variations.length === 0) return;

    const group1 = data.variations[0];
    const group2 = data.variations[1];
    let newOptions: VariationOption[] = [];

    if (data.variations.length === 1 && group1.options.length > 0) {
      newOptions = group1.options.map(opt => ({
        id: opt,
        option1: opt,
        price: data.price,
        stock: 0,
        sku: data.sku ? `${data.sku}-${opt}` : '' // Auto-generate SKU suffix
      }));
    } else if (data.variations.length === 2 && group1.options.length > 0 && group2?.options.length > 0) {
      group1.options.forEach(opt1 => {
        group2.options.forEach(opt2 => {
          newOptions.push({
            id: `${opt1}-${opt2}`,
            option1: opt1,
            option2: opt2,
            price: data.price,
            stock: 0,
            sku: data.sku ? `${data.sku}-${opt1}-${opt2}` : ''
          });
        });
      });
    }
    
    if (newOptions.length !== data.variation_options.length) {
       updateField('variation_options', newOptions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.variations, data.is_variable, data.sku]);

  // Handlers
  const addVariationGroup = () => {
    if (data.variations.length < 2) {
      const newGroups = [...data.variations, { id: Date.now(), name: 'Color', options: [] }];
      updateField('variations', newGroups);
    }
  };

  const addOptionToGroup = (groupIndex: number, option: string) => {
    if (!option) return;
    const newGroups = [...data.variations];
    if (!newGroups[groupIndex].options.includes(option)) {
      newGroups[groupIndex].options.push(option);
      updateField('variations', newGroups);
    }
  };

  return (
    <div>
      {/* Tabs Header */}
      <div className="flex border-b mb-6 overflow-x-auto">
        {['basic', 'sales', 'variations', 'shipping'].map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab as 'basic' | 'sales' | 'variations' | 'shipping')}
            className={`px-4 py-3 text-sm font-medium capitalize whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'sales' ? 'Sales & Pricing' : tab}
          </button>
        ))}
      </div>

      {/* TAB 1: BASIC INFO */}
      {activeTab === 'basic' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* --- NEW: MEDIA UPLOAD SECTION --- */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Product Media</h3>
            
            {/* Images */}
            <ImageUploader 
              images={data.images || []} 
              onChange={(newImages) => updateField('images', newImages)} 
            />

            <hr className="border-gray-100" />

            {/* Video */}
            <VideoUploader 
              videoUrl={data.videoUrl || ''}
              onChange={(newUrl) => updateField('videoUrl', newUrl)}
            />
          </div>
          {/* --------------------------------- */}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
            <input
              type="text"
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
              value={data.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="e.g., Nike Air Max 90"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none h-32"
              value={data.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Describe your product..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select 
                 className="w-full p-2 border rounded"
                 value={data.category}
                 onChange={(e) => updateField('category', e.target.value)}
              >
                <option value="">Select...</option>
                <option value="1">Electronics</option>
                <option value="2">Fashion</option>
                <option value="3">Home & Living</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
              <input type="text" className="w-full p-2 border rounded" value={data.brand} onChange={(e) => updateField('brand', e.target.value)} placeholder="e.g., Generic" />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SALES & PRICING */}
      {activeTab === 'sales' && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Price (RM)</label>
              <input type="number" className="w-full p-2 border rounded" value={data.price} onChange={(e) => updateField('price', parseFloat(e.target.value))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
              <input type="number" className="w-full p-2 border rounded" value={data.stock} disabled={data.is_variable} onChange={(e) => updateField('stock', parseInt(e.target.value))} />
              {data.is_variable && <p className="text-xs text-red-500 mt-1">Managed by Variations</p>}
            </div>
          </div>
          {/* ADDED SKU FIELD HERE */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SKU (Stock Keeping Unit)</label>
            <input 
              type="text" 
              className="w-full p-2 border rounded uppercase" 
              value={data.sku} 
              onChange={(e) => updateField('sku', e.target.value)} 
              placeholder="e.g., NK-AIRMAX-90"
            />
          </div>
        </div>
      )}

      {/* TAB 3: VARIATIONS */}
      {activeTab === 'variations' && (
        <div className="space-y-6 animate-fade-in">
           <div className="flex items-center justify-between bg-gray-50 p-3 rounded border">
              <span className="font-medium text-gray-700">Enable Variations?</span>
              <button onClick={() => updateField('is_variable', !data.is_variable)} className={`px-3 py-1 rounded text-sm font-bold ${data.is_variable ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>{data.is_variable ? 'YES' : 'NO'}</button>
           </div>
           {data.is_variable && (
             <div>
                {data.variations.map((group, idx) => (
                  <div key={group.id} className="mb-4 p-4 border rounded bg-white shadow-sm">
                     <div className="flex justify-between mb-2">
                        <label className="font-medium text-sm">Variation {idx + 1} Name</label>
                        <select className="text-sm border rounded p-1" value={group.name} onChange={(e) => { const newGroups = [...data.variations]; newGroups[idx].name = e.target.value; updateField('variations', newGroups); }}>
                          <option>Color</option><option>Size</option><option>Material</option>
                        </select>
                     </div>
                     <div className="flex gap-2 flex-wrap mb-2">
                        {group.options.map(opt => (
                          <span key={opt} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">{opt}<button onClick={() => { const newGroups = [...data.variations]; newGroups[idx].options = newGroups[idx].options.filter(o => o !== opt); updateField('variations', newGroups); }} className="hover:text-red-600">×</button></span>
                        ))}
                     </div>
                     <div className="flex gap-2">
                        <input type="text" placeholder="Add option (e.g. Red)..." className="border rounded p-1 text-sm flex-1" onKeyDown={(e) => { if(e.key === 'Enter') { addOptionToGroup(idx, (e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = ''; }}} />
                     </div>
                  </div>
                ))}
                {data.variations.length < 2 && <button onClick={addVariationGroup} className="text-sm text-blue-600 hover:underline">+ Add Another Variation Layer</button>}
                {/* TABLE */}
                {data.variation_options.length > 0 && (
                  <div className="mt-6 overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead className="bg-gray-100 text-gray-600">
                        <tr><th className="p-2 border">Variation</th><th className="p-2 border">Price</th><th className="p-2 border">Stock</th><th className="p-2 border">SKU</th></tr>
                      </thead>
                      <tbody>
                        {data.variation_options.map((row, idx) => (
                          <tr key={row.id} className="border-b hover:bg-gray-50">
                            <td className="p-2 font-medium">{row.option1} {row.option2 ? ` / ${row.option2}` : ''}</td>
                            <td className="p-2"><input type="number" className="w-20 border rounded p-1" value={row.price} onChange={(e) => { const newRows = [...data.variation_options]; newRows[idx].price = parseFloat(e.target.value); updateField('variation_options', newRows); }} /></td>
                            <td className="p-2"><input type="number" className="w-20 border rounded p-1" value={row.stock} onChange={(e) => { const newRows = [...data.variation_options]; newRows[idx].stock = parseInt(e.target.value); updateField('variation_options', newRows); }} /></td>
                            <td className="p-2"><input type="text" className="w-24 border rounded p-1" value={row.sku} onChange={(e) => { const newRows = [...data.variation_options]; newRows[idx].sku = e.target.value; updateField('variation_options', newRows); }} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
             </div>
           )}
        </div>
      )}

      {/* TAB 4: SHIPPING */}
      {activeTab === 'shipping' && (
        <div className="space-y-4 animate-fade-in">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Weight (grams)</label><input type="number" className="w-full p-2 border rounded" value={data.weight} onChange={(e) => updateField('weight', parseFloat(e.target.value))} /></div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-xs text-gray-500 mb-1">Length (cm)</label><input type="number" className="w-full p-2 border rounded" value={data.pkg_length} onChange={(e) => updateField('pkg_length', parseFloat(e.target.value))} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Width (cm)</label><input type="number" className="w-full p-2 border rounded" value={data.pkg_width} onChange={(e) => updateField('pkg_width', parseFloat(e.target.value))} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Height (cm)</label><input type="number" className="w-full p-2 border rounded" value={data.pkg_height} onChange={(e) => updateField('pkg_height', parseFloat(e.target.value))} /></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductForm;