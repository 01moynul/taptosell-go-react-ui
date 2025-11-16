// src/components/supplier/ProductForm.tsx
import { useState } from 'react';
import { type SupplierProduct, type ProductPayload, createProduct, updateProduct } from '../../services/supplierProductService';
import { type TaxonomyItem } from '../../services/taxonomyService';

// Define the Props for the form component
interface ProductFormProps {
    isEditMode: boolean;
    initialProduct?: SupplierProduct;
    categories: TaxonomyItem[];
    brands: TaxonomyItem[];
}

const ProductForm: React.FC<ProductFormProps> = ({ isEditMode, initialProduct, categories, brands }) => {
    // --- 1. Form State Initialization ---
    // Use initialProduct for edit mode, or empty defaults for add mode
    const [formData, setFormData] = useState<Partial<ProductPayload>>(
        initialProduct || { 
            name: '', description: '', price: 0, stock: 0, is_variable: false,
            // Initialize with first category/brand ID if available, otherwise 0/''
            category_id: categories[0]?.id || 0,
            brand_name: brands[0]?.name || '',
            weight: 0, pkg_length: 0, pkg_width: 0, pkg_height: 0,
        }
    );

    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

    // --- 2. Form Submission Handler ---
    const handleSubmit = async (e: React.FormEvent, action: 'save_draft' | 'submit_for_review') => {
        e.preventDefault();
        setMessage('');
        setIsSaving(true);
        
        try {
            const payload: ProductPayload = {
                ...formData,
                action: action, // Pass the desired action
                // Ensure required non-optional fields are present (using default values for now)
                price: formData.price ?? 0,
                stock: formData.stock ?? 0,
                weight: formData.weight ?? 0,
                pkg_length: formData.pkg_length ?? 0,
                pkg_width: formData.pkg_width ?? 0,
                pkg_height: formData.pkg_height ?? 0,
                brand_name: formData.brand_name || '',
                category_id: formData.category_id || 0,
                is_variable: formData.is_variable || false,
                name: formData.name || 'Untitled Product',
                description: formData.description || '',
            };

            if (isEditMode && initialProduct?.id) {
                await updateProduct(initialProduct.id, payload);
                setMessage(`Product updated successfully! Status: ${action.split('_').join(' ').toUpperCase()}`);
            } else {
                const response = await createProduct(payload);
                setMessage(`Product created successfully! ID: ${response.product_id}. Status: ${action.split('_').join(' ').toUpperCase()}`);
                // In a real app, you would redirect to the edit page for the new product
            }
            setMessageType('success');
        } catch (error) {
            setMessage(`Operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            setMessageType('error');
        } finally {
            setIsSaving(false);
        }
    };

    // --- 3. Render Form Structure ---
    return (
        <form onSubmit={(e) => handleSubmit(e, 'submit_for_review')} className="space-y-6">
            {message && (
                <div className={`p-4 rounded ${messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message}
                </div>
            )}

            {/* General Information Section */}
            <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
                <h3 className="text-xl font-semibold border-b pb-2">General Information</h3>
                
                {/* Product Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Product Name</label>
                    <input type="text" value={formData.name || ''} 
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required className="mt-1 block w-full border border-gray-300 p-2 rounded-md"
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Product Description</label>
                    <textarea value={formData.description || ''} 
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={4} className="mt-1 block w-full border border-gray-300 p-2 rounded-md"
                    />
                </div>
                
                {/* Category Dropdown */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <select value={formData.category_id || 0} 
                        onChange={(e) => setFormData({ ...formData, category_id: parseInt(e.target.value) })}
                        required className="mt-1 block w-full border border-gray-300 p-2 rounded-md"
                    >
                        <option value={0} disabled>Select a Category</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>

                {/* Brand Input (Send Name to Backend) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Brand Name (New or Existing)</label>
                    <input type="text" value={formData.brand_name || ''} 
                        onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                        required className="mt-1 block w-full border border-gray-300 p-2 rounded-md"
                        placeholder="e.g., Apple, Generic"
                    />
                </div>
            </div>

            {/* Variations / Simple Product Toggle Section */}
            {/* NOTE: This section (Step 4) is complex and will be built in the next file: VariationManager.tsx */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold border-b pb-2">Pricing & Variations (Placeholder)</h3>
                
                {/* Simple Product Fields (Visible by default) */}
                <div className="grid grid-cols-3 gap-4 mt-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Price (RM)</label>
                        <input type="number" value={formData.price || 0} 
                            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                            min="0" step="0.01" required={!formData.is_variable}
                            className="mt-1 block w-full border border-gray-300 p-2 rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Stock</label>
                        <input type="number" value={formData.stock || 0} 
                            onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                            min="0" required={!formData.is_variable}
                            className="mt-1 block w-full border border-gray-300 p-2 rounded-md"
                        />
                    </div>
                </div>

                {/* Toggle for Variable Product */}
                <div className="flex items-center mt-4">
                    <input id="isVariable" type="checkbox" checked={formData.is_variable || false}
                        onChange={(e) => setFormData({ ...formData, is_variable: e.target.checked })}
                        className="h-4 w-4 text-green-600 border-gray-300 rounded"
                    />
                    <label htmlFor="isVariable" className="ml-2 block text-sm text-gray-900">
                        Enable Product Variations (Size, Color, etc.)
                    </label>
                </div>
                
                {/* Variation Management UI will be conditionally rendered here */}
                {formData.is_variable && (
                    <div className="mt-4 p-4 border border-dashed border-gray-400 bg-gray-50">
                        Variation Manager Component goes here (Step 4)
                    </div>
                )}
            </div>

            {/* Packaging and Submission Section */}
            <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
                <h3 className="text-xl font-semibold border-b pb-2">Packaging & Logistics</h3>
                
                <div className="grid grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
                        <input type="number" value={formData.weight || 0} min="0" step="0.01" 
                            onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
                            required className="mt-1 block w-full border border-gray-300 p-2 rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Length (cm)</label>
                        <input type="number" value={formData.pkg_length || 0} min="0" step="0.01"
                            onChange={(e) => setFormData({ ...formData, pkg_length: parseFloat(e.target.value) })}
                            required className="mt-1 block w-full border border-gray-300 p-2 rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Width (cm)</label>
                        <input type="number" value={formData.pkg_width || 0} min="0" step="0.01" 
                            onChange={(e) => setFormData({ ...formData, pkg_width: parseFloat(e.target.value) })}
                            required className="mt-1 block w-full border border-gray-300 p-2 rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Height (cm)</label>
                        <input type="number" value={formData.pkg_height || 0} min="0" step="0.01" 
                            onChange={(e) => setFormData({ ...formData, pkg_height: parseFloat(e.target.value) })}
                            required className="mt-1 block w-full border border-gray-300 p-2 rounded-md"
                        />
                    </div>
                </div>
            </div>

            {/* Submission Buttons */}
            <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={(e) => handleSubmit(e, 'save_draft')}
                    disabled={isSaving}
                    className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 disabled:opacity-50"
                >
                    {isSaving ? 'Saving...' : 'Save as Draft'}
                </button>
                
                <button type="submit" // Default action is 'submit_for_review'
                    disabled={isSaving}
                    className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                    {isSaving ? 'Submitting...' : 'Submit for Manager Review'}
                </button>
            </div>
        </form>
    );
};

export default ProductForm;