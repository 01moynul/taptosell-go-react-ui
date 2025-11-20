// src/pages/SupplierProductFormPage.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import ProductForm, { type ProductFormData } from '../components/supplier/ProductForm';
import ProductPreviewCard from '../components/supplier/ProductPreviewCard';
import FilingSuggestions from '../components/supplier/FilingSuggestions';

const SupplierProductFormPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  
  // --- 1. NEW: Tab State for "Wizard" Flow ---
  const [activeTab, setActiveTab] = useState<'basic' | 'sales' | 'variations' | 'shipping'>('basic');

  // --- Central State (The Source of Truth) ---
  const [formData, setFormData] = useState<ProductFormData>({
  images: [],
  videoUrl: '',
  name: '',
  description: '',
  price: 0,
  sku: '', // <--- ADD THIS
  category: '',
  brand: '',
  stock: 0,
  weight: 0,
  is_variable: false,
  pkg_length: 0,
  pkg_width: 0,
  pkg_height: 0,
  variations: [],
  variation_options: []
});

  // --- Navigation Helpers ---
  const tabs: ('basic' | 'sales' | 'variations' | 'shipping')[] = ['basic', 'sales', 'variations', 'shipping'];
  
  const handleNext = () => {
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1]);
    }
  };

  // --- API Submission Logic ---
  const handleSubmit = async (status: 'draft' | 'pending') => {
    // 1. SAFETY CHECK: Validation
    if (!formData.description || formData.description.trim() === "") {
      alert("Error: Product Description is required!");
      return;
    }
    if (!formData.category || formData.category === "") {
      alert("Error: You must select a Category!");
      return;
    }

    setIsSaving(true);

    // 2. DEBUG: Show exactly what we are about to send
    const categoryList = formData.category ? [Number(formData.category)] : [];
    console.log("DEBUG: Selected Category ID:", formData.category);
    console.log("DEBUG: Sending Category List:", categoryList);

    try {
      // 3. Construct Payload
      const payload = {
        name: formData.name || "Untitled Product", // Fallback for drafts
        description: formData.description,
        price_to_tts: Number(formData.price),
        srp: Number(formData.price) * 1.2,
        stock_quantity: Number(formData.stock),
        
        // The Critical Fix
        category_ids: categoryList, 
        
        sku: formData.sku || `DRAFT-${Date.now()}`, // Fallback SKU for drafts
        brand: formData.brand,
        weight_grams: Math.round(Number(formData.weight)) || 100, // Default 100g if missing
        pkg_length: Number(formData.pkg_length) || 10,
        pkg_width: Number(formData.pkg_width) || 10,
        pkg_height: Number(formData.pkg_height) || 10,
        status: status,
        // TODO: Add variation data here once backend supports it
      };

      console.log("Sending Full Payload:", payload); 

      await apiClient.post('/products', payload);
      
      alert(status === 'draft' ? 'Saved as Draft!' : 'Submitted for Review!');
      navigate('/dashboard?view=products'); 
    } catch (err) {
      // 1. Define the specific shape of the API error
      interface ApiError {
        response?: {
          data?: {
            error?: string;
          };
        };
      }

      // 2. Cast 'err' (which is unknown) to our interface
      const apiError = err as ApiError;

      // 3. Use the typed variable
      console.error("Failed to save product. Response:", apiError.response?.data);
      
      const serverError = apiError.response?.data?.error || "Please check the form.";
      alert(`Server Error: ${serverError}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 pb-20">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800">Add New Product</h1>
        <Link to="/dashboard?view=products" className="text-sm text-gray-500 hover:text-gray-700">
          &larr; Back to Dashboard
        </Link>
      </div>

      {/* 3-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start max-w-7xl mx-auto">
        
        {/* Left Column: Suggestions (25%) */}
        <div className="hidden lg:block lg:col-span-3 space-y-6 sticky top-6">
          <FilingSuggestions data={formData} />
        </div>

        {/* Middle Column: The Form (50%) */}
        <div className="lg:col-span-6 bg-white p-6 rounded shadow relative min-h-[500px] flex flex-col">
           
           {/* Pass activeTab and handlers to the Form */}
           <ProductForm 
             data={formData} 
             onChange={setFormData} 
             activeTab={activeTab}
             onTabChange={setActiveTab}
           />
           
           {/* --- Wizard Buttons (Sticky Bottom) --- */}
           <div className="mt-auto pt-6 border-t flex justify-between items-center">
              {/* Back Button (Hidden on first step) */}
              <button 
                onClick={handleBack}
                disabled={activeTab === 'basic'}
                className={`px-4 py-2 text-gray-600 hover:text-gray-900 font-medium ${activeTab === 'basic' ? 'invisible' : ''}`}
              >
                Back
              </button>

              <div className="flex gap-3">
                <button 
                  onClick={() => handleSubmit('draft')}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md font-medium"
                >
                  Save Draft
                </button>

                {/* Show 'Next' on steps 1-3, 'Submit' on step 4 */}
                {activeTab !== 'shipping' ? (
                  <button 
                    onClick={handleNext}
                    className="px-6 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md font-medium shadow-sm"
                  >
                    Continue &rarr;
                  </button>
                ) : (
                  <button 
                    onClick={() => handleSubmit('pending')}
                    disabled={isSaving}
                    className="px-6 py-2 text-white bg-green-600 hover:bg-green-700 rounded-md font-medium shadow-sm"
                  >
                    {isSaving ? 'Submitting...' : 'Submit for Review'}
                  </button>
                )}
              </div>
           </div>
        </div>

        {/* Right Column: Live Preview (25%) */}
        <div className="hidden lg:block lg:col-span-3 sticky top-6">
           <ProductPreviewCard data={formData} />
        </div>

      </div>
    </div>
  );
};

export default SupplierProductFormPage;