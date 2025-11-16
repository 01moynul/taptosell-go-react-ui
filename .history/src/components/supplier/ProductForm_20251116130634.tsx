// src/components/supplier/ProductForm.tsx
import { useState } from 'react';
import { type SupplierProduct, type ProductPayload, createProduct, updateProduct } from '../../services/supplierProductService';
import { type TaxonomyItem } from '../../services/taxonomyService';
import ProductPreviewCard from './ProductPreviewCard'; // Import the Preview Card

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
    
    // Helper for input changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { id, value, type } = e.target;
        // Handle number types specifically
        let parsedValue: string | number = value;
        if (type === 'number' || id === 'category_id' || id.startsWith('pkg_') || id === 'weight') {
            parsedValue = parseFloat(value) || 0;
        }
        
        setFormData(prev => ({ 
            ...prev, 
            [id]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : parsedValue 
        }));
    };


    // --- 2. Form Submission Handler ---
    const handleSubmit = async (e: React.FormEvent, action: 'save_draft' | 'submit_for_review') => {
        e.preventDefault();
        setMessage('');
        setIsSaving(true);
        
        try {
            // Explicitly define all required fields from ProductPayload first
            const payload: ProductPayload = {
                // BaseProduct required fields (coerced from potentially undefined Partial<Payload>)
                name: formData.name || 'Untitled Product',
                description: formData.description || '',
                price: formData.price ?? 0,
                stock: formData.stock ?? 0,
                weight: formData.weight ?? 0,
                pkg_length: formData.pkg_length ?? 0,
                pkg_width: formData.pkg_width ?? 0,
                pkg_height: formData.pkg_height ?? 0,
                
                // ProductPayload required fields
                action: action, // Passed in function argument
                category_id: formData.category_id || 0,
                brand_name: formData.brand_name || '',
                is_variable: formData.is_variable || false,

                // Optional/complex fields (video_url, variations)
                video_url: formData.video_url,
                variations: formData.variations, 
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
        <form onSubmit={(e) => handleSubmit(e, 'submit_for_review')} className="flex flex-col lg:flex-row gap-8">
            {/* Left Column: Form Fields */}
            <div className="lg:w-2/3 space-y-6">
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
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Product Name</label>
                        <input type="text" id="name" value={formData.name || ''} 
                            onChange={handleChange}
                            required className="mt-1 block w-full border border-gray-300 p-2 rounded-md"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Product Description</label>
                        <textarea id="description" value={formData.description || ''} 
                            onChange={handleChange}
                            rows={4} className="mt-1 block w-full border border-gray-300 p-2 rounded-md"
                        />
                    </div>
                    
                    {/* Video URL */}
                    <div>
                        <label htmlFor="video_url" className="block text-sm font-medium text-gray-700">Product Video URL (Optional)</label>
                        <input type="text" id="video_url" value={formData.video_url || ''} 
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 p-2 rounded-md"
                        />
                    </div>
                </div>

                {/* Category & Brand Section */}
                <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
                    <h3 className="text-xl font-semibold border-b pb-2">Category & Brand</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {/* Category Dropdown */}
                        <div>
                            <label htmlFor="category_id" className="block text-sm font-medium text-gray-700">Category</label>
                            <select id="category_id" value={formData.category_id || 0} 
                                onChange={handleChange}
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
                            <label htmlFor="brand_name" className="block text-sm font-medium text-gray-700">Brand Name (New or Existing)</label>
                            <input type="text" id="brand_name" value={formData.brand_name || ''} 
                                onChange={handleChange}
                                required className="mt-1 block w-full border border-gray-300 p-2 rounded-md"
                                placeholder="e.g., Apple, Generic"
                            />
                        </div>
                    </div>
                </div>

                {/* Variations / Simple Product Toggle Section */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold border-b pb-2">Pricing & Variations</h3>
                    
                    {/* Simple Product Fields (Conditionally Visible) */}
                    {!formData.is_variable && (
                        <div className="grid grid-cols-3 gap-4 mt-4">
                            <div>
                                <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price (RM)</label>
                                <input type="number" id="price" value={formData.price || 0} 
                                    onChange={handleChange}
                                    min="0" step="0.01" required
                                    className="mt-1 block w-full border border-gray-300 p-2 rounded-md"
                                />
                            </div>
                            <div>
                                <label htmlFor="stock" className="block text-sm font-medium text-gray-700">Stock</label>
                                <input type="number" id="stock" value={formData.stock || 0} 
                                    onChange={handleChange}
                                    min="0" required
                                    className="mt-1 block w-full border border-gray-300 p-2 rounded-md"
                                />
                            </div>
                        </div>
                    )}
                    
                    {/* Toggle for Variable Product */}
                    <div className={`flex items-center ${!formData.is_variable ? 'mt-4' : ''}`}>
                        <input id="is_variable" type="checkbox" checked={formData.is_variable || false}
                            onChange={handleChange}
                            className="h-4 w-4 text-green-600 border-gray-300 rounded"
                        />
                        <label htmlFor="is_variable" className="ml-2 block text-sm text-gray-900">
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
                            <label htmlFor="weight" className="block text-sm font-medium text-gray-700">Weight (kg)</label>
                            <input type="number" id="weight" value={formData.weight || 0} min="0" step="0.01" 
                                onChange={handleChange}
                                required className="mt-1 block w-full border border-gray-300 p-2 rounded-md"
                            />
                        </div>
                        <div>
                            <label htmlFor="pkg_length" className="block text-sm font-medium text-gray-700">Length (cm)</label>
                            <input type="number" id="pkg_length" value={formData.pkg_length || 0} min="0" step="0.01"
                                onChange={handleChange}
                                required className="mt-1 block w-full border border-gray-300 p-2 rounded-md"
                            />
                        </div>
                        <div>
                            <label htmlFor="pkg_width" className="block text-sm font-medium text-gray-700">Width (cm)</label>
                            <input type="number" id="pkg_width" value={formData.pkg_width || 0} min="0" step="0.01" 
                                onChange={handleChange}
                                required className="mt-1 block w-full border border-gray-300 p-2 rounded-md"
                            />
                        </div>
                        <div>
                            <label htmlFor="pkg_height" className="block text-sm font-medium text-gray-700">Height (cm)</label>
                            <input type="number" id="pkg_height" value={formData.pkg_height || 0} min="0" step="0.01" 
                                onChange={handleChange}
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
            </div>

            {/* Right Column: Preview Card */}
            <div className="lg:w-1/3">
                <ProductPreviewCard formData={formData} />
            </div>
        </form>
    );
};

export default ProductForm;