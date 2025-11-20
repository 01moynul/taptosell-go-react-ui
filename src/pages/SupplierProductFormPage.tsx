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
  
  // --- 1. Wizard Tab State ---
  const [activeTab, setActiveTab] = useState<'basic' | 'sales' | 'variations' | 'shipping'>('basic');

  // --- 2. Central State (The Source of Truth) ---
  const [formData, setFormData] = useState<ProductFormData>({
    images: [],
    videoUrl: '',
    name: '',
    description: '',
    price: 0,
    sku: '',
    category: '',
    brand: '',
    stock: 0,
    weight: 0,
    is_variable: false,
    pkg_length: 0,
    pkg_width: 0,
    pkg_height: 0,
    variations: [],
    variation_options: [],
    variationImages: {},
    sizeChart: null,
  });

  // --- 3. Navigation Helpers ---
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

  // --- 4. API Submission Logic (The Brain) ---
  const handleSubmit = async (status: 'draft' | 'pending') => {
    const isDraft = status === 'draft';

    // A. Safety Check (Strict validation ONLY if NOT Draft)
    if (!isDraft) {
        if (!formData.name || formData.name.trim() === "") {
            alert("Error: Product Name is required!");
            return;
        }
        if (!formData.description || formData.description.trim() === "") {
            alert("Error: Product Description is required!");
            return;
        }
        if (!formData.category || formData.category === "") {
            alert("Error: You must select a Category!");
            return;
        }
        if (formData.images.length === 0) {
            alert("Error: At least 1 image is required!");
            return;
        }
        // Add more strict checks here if needed
    }

    setIsSaving(true);

    try {
      // 1. Define the payload shape to satisfy the linter (Fix for Error 3)
      interface VariantPayloadItem {
        sku: string;
        price: number;
        stock: number;
        srp: number;
        options: { name: string; value: string }[];
      }

      // 2. Prepare Variants Payload using the specific type
      let variantsPayload: VariantPayloadItem[] = [];
      
      if (formData.is_variable && formData.variations.length > 0) {
          const group1Name = formData.variations[0].name;
          const group2Name = formData.variations[1]?.name;

          variantsPayload = formData.variation_options.map(opt => {
              const optionsList = [{ name: group1Name, value: opt.option1 }];
              if (opt.option2 && group2Name) {
                  optionsList.push({ name: group2Name, value: opt.option2 });
              }
              return {
                  sku: opt.sku,
                  price: Number(opt.price),
                  stock: Number(opt.stock),
                  srp: Number(opt.price) * 1.2, 
                  options: optionsList
              };
          });
      }

      // C. Construct the Final Payload
      const payload = {
        // Basic Info
        name: formData.name || (isDraft ? "Untitled Product" : ""),
        description: formData.description,
        status: status,
        
        // Categorization (Mapped correctly)
        brandName: formData.brand, 
        category_ids: formData.category ? [Number(formData.category)] : [],

        // Media (New Fields)
        images: formData.images,
        videoUrl: formData.videoUrl,
        sizeChart: formData.sizeChart,
        variationImages: formData.variationImages,

        // Simple Product Fallback (If not variable)
        simpleProduct: !formData.is_variable ? {
            price: Number(formData.price),
            stock: Number(formData.stock),
            sku: formData.sku,
            srp: Number(formData.price) * 1.2
        } : null,

        // Variable Logic
        isVariable: formData.is_variable,
        variants: variantsPayload,

        // Shipping (Nested Object)
        weight: Number(formData.weight),
        packageDimensions: {
            length: Number(formData.pkg_length),
            width: Number(formData.pkg_width),
            height: Number(formData.pkg_height)
        }
      };

      console.log("Sending Full Payload:", payload); 

      await apiClient.post('/products', payload);
      
      alert(isDraft ? "Saved as Draft!" : "Product created successfully!");
      
      // Redirect to Dashboard after successful save
      navigate('/dashboard?view=products'); 
      
    } catch (err) {
      interface ApiError {
        response?: { data?: { error?: string; }; };
      }
      const apiError = err as ApiError;
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
           
           {/* The Main Form Component */}
           <ProductForm 
             data={formData} 
             onChange={setFormData} 
             activeTab={activeTab}
             onTabChange={setActiveTab}
           />
           
           {/* --- Wizard Buttons (Sticky Bottom) --- */}
           <div className="mt-auto pt-6 border-t flex justify-between items-center">
              {/* Back Button */}
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

                {/* 'Continue' vs 'Submit' Logic */}
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