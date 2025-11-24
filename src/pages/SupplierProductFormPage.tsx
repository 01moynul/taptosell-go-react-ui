// src/pages/SupplierProductFormPage.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
// [FIX] Removed unused 'apiClient' import

import ProductForm, { type ProductFormData } from '../components/supplier/ProductForm';
import ProductPreviewCard from '../components/supplier/ProductPreviewCard';
import FilingSuggestions from '../components/supplier/FilingSuggestions';
import { 
  fetchProductById, 
  updateProduct, 
  createProduct,
  // [FIX] Import these types to strict-type the payload
  type ProductSubmissionPayload, 
  type VariantSubmissionItem 
} from '../services/supplierProductService';

// We need these types to reconstruct the state
import type { VariationGroup, VariationOption } from '../components/supplier/VariationManager';

// [FIX] Helper interface to handle API errors safely without 'any'
interface ApiError {
  response?: {
    data?: {
      error?: string;
    };
  };
}

const SupplierProductFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>(); 
  const isEditMode = Boolean(id);

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'basic' | 'sales' | 'variations' | 'shipping'>('basic');

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

// --- LOAD DATA (Edit Mode) ---
  useEffect(() => {
    if (!isEditMode || !id) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const product = await fetchProductById(id);
        console.log("DEBUG: Edit Product Data:", product);

        // --- 1. Reconstruct Variations (Improved Logic) ---
        let reconstructedGroups: VariationGroup[] = [];
        let reconstructedOptions: VariationOption[] = [];

        if (product.isVariable && product.variants && product.variants.length > 0) {
            // A. Identify Group Names from the first variant (e.g. ["Color", "Size"])
            // We assume all variants follow the same structure as the first one
            const firstVar = product.variants[0];
            if (firstVar.options && firstVar.options.length > 0) {
                 const groupNames = firstVar.options.map(o => o.name);

                 // B. Initialize Groups
                 reconstructedGroups = groupNames.map(name => ({
                     id: Math.random().toString(36).substr(2, 9),
                     name: name,
                     options: [] // We will fill this next
                 }));

                 // C. Populate Group Options (Collect all unique values like "Red", "Blue", "S", "M")
                 product.variants.forEach(v => {
                     v.options.forEach(opt => {
                         const targetGroup = reconstructedGroups.find(g => g.name === opt.name);
                         if (targetGroup && !targetGroup.options.includes(opt.value)) {
                             targetGroup.options.push(opt.value);
                         }
                     });
                 });

                 // D. Build the Matrix Rows (Map API Variant -> UI Row)
                 reconstructedOptions = product.variants.map((v, idx) => {
                     // Helper: Find the value for a specific group name (e.g. "Color")
                     const getValue = (groupName?: string) => {
                         if (!groupName) return '';
                         const found = v.options.find(o => o.name === groupName);
                         return found ? found.value : '';
                     };

                     return {
                         id: `var_${idx}_${Date.now()}`,
                         // We map specifically to the order of groups we created
                         option1: getValue(reconstructedGroups[0]?.name),
                         option2: getValue(reconstructedGroups[1]?.name),
                         price: v.price,
                         stock: v.stock,
                         sku: v.sku || ''
                     };
                 });
            }
        }

        // --- 2. Handle Category (String Fix) ---
        const loadedCategory = product.category_ids?.[0]?.toString() || '';

        // --- 3. Update Form State ---
        setFormData({
            name: product.name,
            description: product.description,
            images: product.images || [],
            videoUrl: product.videoUrl || '',
            sizeChart: product.sizeChart || null, 
            variationImages: product.variationImages || {},
            
            price: product.priceToTTS,
            stock: product.stockQuantity,
            sku: product.sku || '',
            
            category: loadedCategory,
            brand: product.brandName || '', 
            
            weight: product.weight || 0,
            pkg_length: product.packageDimensions?.length || 0,
            pkg_width: product.packageDimensions?.width || 0,
            pkg_height: product.packageDimensions?.height || 0,

            is_variable: product.isVariable,
            variations: reconstructedGroups,
            variation_options: reconstructedOptions
        });

      } catch (error) {
        console.error("Failed to fetch product:", error);
        alert("Failed to load product details.");
        navigate('/dashboard?view=products');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id, isEditMode, navigate]);

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
    const isDraft = status === 'draft';

    if (!isDraft) {
        if (!formData.name) { alert("Product Name is required!"); return; }
        if (!formData.description) { alert("Description is required!"); return; }
        if (!formData.category) { alert("Category is required!"); return; }
        if (formData.images.length === 0) { alert("At least 1 image is required!"); return; }
    }

    setIsSaving(true);

    try {
      // [FIX] Error 1: Explicitly type this array instead of 'any[]'
      let variantsPayload: VariantSubmissionItem[] = [];
      
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

      // [FIX] Error 3 & 4: Explicitly type the Payload to match the Service
      const payload: ProductSubmissionPayload = {
        name: formData.name || (isDraft ? "Untitled Product" : ""),
        description: formData.description,
        status: status,
        brandName: formData.brand, 
        category_ids: formData.category ? [Number(formData.category)] : [],
        images: formData.images,
        videoUrl: formData.videoUrl,
        
        // [FIX] Ensure this is null, not undefined
        sizeChart: formData.sizeChart || null, 
        
        variationImages: formData.variationImages,
        
        simpleProduct: !formData.is_variable ? {
            price: Number(formData.price),
            stock: Number(formData.stock),
            sku: formData.sku,
            srp: Number(formData.price) * 1.2
        } : null,
        
        isVariable: formData.is_variable,
        variants: variantsPayload,
        weight: Number(formData.weight),
        packageDimensions: {
            length: Number(formData.pkg_length),
            width: Number(formData.pkg_width),
            height: Number(formData.pkg_height)
        }
      };

      if (isEditMode && id) {
          await updateProduct(id, payload);
          alert("Product updated successfully!");
      } else {
          await createProduct(payload);
          alert(isDraft ? "Saved as Draft!" : "Product created successfully!");
      }
      
      navigate('/dashboard?view=products'); 
      
    } catch (err: unknown) {
      // [FIX] Error 2: Use unknown and cast to ApiError
      const apiError = err as ApiError;
      console.error("Save failed:", apiError.response?.data);
      const serverError = apiError.response?.data?.error || "Please check the form.";
      alert(`Server Error: ${serverError}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
      return <div className="min-h-screen flex items-center justify-center">Loading product data...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 pb-20">
      <div className="mb-6 flex items-center justify-between max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800">
            {isEditMode ? 'Edit Product' : 'Add New Product'}
        </h1>
        <Link to="/dashboard?view=products" className="text-sm text-gray-500 hover:text-gray-700">
          &larr; Back to Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start max-w-7xl mx-auto">
        <div className="hidden lg:block lg:col-span-3 space-y-6 sticky top-6">
          <FilingSuggestions data={formData} />
        </div>

        <div className="lg:col-span-6 bg-white p-6 rounded shadow relative min-h-[500px] flex flex-col">
           <ProductForm 
             data={formData} 
             onChange={setFormData} 
             activeTab={activeTab}
             onTabChange={setActiveTab}
           />
           
           <div className="mt-auto pt-6 border-t flex justify-between items-center">
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
                  {isEditMode ? 'Update Draft' : 'Save Draft'}
                </button>

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
                    {isSaving ? 'Submitting...' : (isEditMode ? 'Update & Submit' : 'Submit for Review')}
                  </button>
                )}
              </div>
           </div>
        </div>

        <div className="hidden lg:block lg:col-span-3 sticky top-6">
           <ProductPreviewCard data={formData} />
        </div>
      </div>
    </div>
  );
};

export default SupplierProductFormPage;