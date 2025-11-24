// src/components/supplier/ProductForm.tsx
import React, { useEffect, useState } from 'react'; // Added useEffect/useState
import ImageUploader from './ImageUploader';
import VideoUploader from './VideoUploader';
import apiClient from '../../services/api'; // [NEW] Import API to fetch categories

// FIXED: Split the Component import from the Type imports
import VariationManager from './VariationManager';
import type { VariationGroup, VariationOption } from './VariationManager';

// --- Data Types ---
export interface ProductFormData {
  name: string;
  description: string;
  images: string[]; 
  videoUrl: string;
  price: number;
  sku: string; 
  stock: number;
  category: string;
  brand: string;
  weight: number;
  pkg_length: number;
  pkg_width: number;
  pkg_height: number;
  is_variable: boolean;
  variations: VariationGroup[];
  variation_options: VariationOption[];
  variationImages: Record<string, string>; 
  sizeChart?: { type: 'template' | 'image'; url?: string; templateId?: string } | null;
}

interface ProductFormProps {
  data: ProductFormData;
  onChange: (data: ProductFormData) => void;
  activeTab: 'basic' | 'sales' | 'variations' | 'shipping';
  onTabChange: (tab: 'basic' | 'sales' | 'variations' | 'shipping') => void;
}

interface CategoryOption {
    id: number;
    name: string;
}

const ProductForm: React.FC<ProductFormProps> = ({ data, onChange, activeTab, onTabChange }) => {
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  // [NEW] Fetch Real Categories on Mount
  useEffect(() => {
    const loadCategories = async () => {
        try {
            const res = await apiClient.get<{categories: CategoryOption[]}>('/categories');
            if (res.data.categories) {
                setCategories(res.data.categories);
            }
        } catch (err) {
            console.error("Failed to load categories", err);
        }
    };
    loadCategories();
  }, []);

  // Helper to update specific fields
  const updateField = (field: keyof ProductFormData, value: ProductFormData[keyof ProductFormData]) => {
    onChange({ ...data, [field]: value });
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
          
          <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Product Media</h3>
            <ImageUploader 
              images={data.images || []} 
              onChange={(newImages) => updateField('images', newImages)} 
            />
            <hr className="border-gray-100" />
            <VideoUploader 
              videoUrl={data.videoUrl || ''}
              onChange={(newUrl) => updateField('videoUrl', newUrl)}
            />
          </div>

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
              {/* [FIXED] Dynamic Select Options */}
              <select 
                 className="w-full p-2 border rounded"
                 value={data.category} // This ID (e.g. "4") must match the API ID
                 onChange={(e) => updateField('category', e.target.value)}
              >
                <option value="">Select...</option>
                {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
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
             <VariationManager 
               groups={data.variations}
               options={data.variation_options}
               variationImages={data.variationImages || {}}
               sizeChart={data.sizeChart || null} // Pass it down
               onSizeChartChange={(sc) => updateField('sizeChart', sc)}
               
               onChange={(groups, options, images) => {
                 onChange({ 
                   ...data, 
                   variations: groups, 
                   variation_options: options,
                   variationImages: images 
                 });
               }}
             />
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