// src/components/supplier/InventoryForm.tsx

import React, { useState, useEffect } from 'react';
import { 
    createInventoryItem, 
    updateInventoryItem, 
    type InventoryItem, 
    type InventoryPayload 
} from '../../services/supplierProductService';

interface InventoryFormProps {
    item?: InventoryItem | null;
    onSuccess: () => void;
    onCancel: () => void;
}

const initialFormState: InventoryPayload = {
    name: '',
    description: '',
    price: 0,
    sku: '',
    stockQuantity: 0,
    weight: 0,
    pkgLength: 0,
    pkgWidth: 0,
    pkgHeight: 0,
    categoryName: '',
    brandName: '',
    status: 'draft',
};

const InventoryForm: React.FC<InventoryFormProps> = ({ item, onSuccess, onCancel }) => {
    const [formData, setFormData] = useState<InventoryPayload>(initialFormState);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isEditMode = !!item;
    const formTitle = isEditMode ? `Edit Item: ${item?.name}` : 'Add Private Inventory Item';

    useEffect(() => {
        if (isEditMode && item) {
            setFormData({
                name: item.name,
                description: item.description || '',
                price: item.price,
                sku: item.sku,
                stockQuantity: item.stockQuantity || item.stock || 0,
                weight: item.weight || 0,
                pkgLength: item.pkgLength || 0,
                pkgWidth: item.pkgWidth || 0,
                pkgHeight: item.pkgHeight || 0,
                categoryName: item.categoryName || '',
                brandName: item.brandName || '',
                status: (item.status && item.status !== 'promoted') ? item.status : 'draft',
            });
        } else if (!isEditMode) {
            setFormData(initialFormState);
        }
    }, [item, isEditMode]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const newValue = (type === 'number' || name === 'price' || name.startsWith('pkg')) 
            ? parseFloat(value) || 0 
            : value;
        
        setFormData({ ...formData, [name]: newValue });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            if (isEditMode && item) {
                await updateInventoryItem(item.id, formData);
            } else {
                await createInventoryItem(formData);
            }
            onSuccess();
        } catch (err) {
            // [FIX] Error 3: Avoid 'any'. Define the expected error shape.
            interface ApiError {
                message?: string;
            }
            const apiError = err as ApiError;

            console.error("Form error:", err);
            setError(apiError.message || "Operation failed.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Shared Styles
    const labelStyle = "block text-sm font-medium text-gray-700 mb-1";
    const inputStyle = "w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border";

    return (
        <div className="bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">{formTitle}</h2>
                <p className="text-xs text-gray-500 mt-1">Items created here are private until promoted.</p>
            </div>

            {error && (
                <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                    {error}
                </div>
            )}
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                
                {/* Section 1: Core Details */}
                <div>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3 border-b pb-1">Core Details</h3>
                    <div className="grid grid-cols-1 gap-y-4 gap-x-4">
                        <div>
                            <label htmlFor="name" className={labelStyle}>Product Name*</label>
                            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className={inputStyle} placeholder="e.g. Winter Jacket" />
                        </div>
                        <div>
                            <label htmlFor="description" className={labelStyle}>Description*</label>
                            <textarea id="description" name="description" rows={3} value={formData.description} onChange={handleChange} required className={inputStyle} placeholder="Product details..." />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div>
                            <label htmlFor="price" className={labelStyle}>Your Price (RM)*</label>
                            <input type="number" id="price" name="price" min="0.01" step="0.01" value={formData.price} onChange={handleChange} required className={inputStyle} />
                        </div>
                        <div>
                            <label htmlFor="stockQuantity" className={labelStyle}>Stock Qty*</label>
                            <input type="number" id="stockQuantity" name="stockQuantity" min="0" value={formData.stockQuantity} onChange={handleChange} required className={inputStyle} />
                        </div>
                        <div>
                            <label htmlFor="sku" className={labelStyle}>SKU (Optional)</label>
                            <input type="text" id="sku" name="sku" value={formData.sku} onChange={handleChange} className={inputStyle} />
                        </div>
                    </div>
                </div>

                {/* Section 2: Dimensions */}
                <div>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3 border-b pb-1 mt-2">Shipping Dimensions</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label htmlFor="weight" className={labelStyle}>Weight (kg)</label>
                            <input type="number" id="weight" name="weight" min="0" step="0.01" value={formData.weight} onChange={handleChange} className={inputStyle} />
                        </div>
                        <div>
                            <label htmlFor="pkgLength" className={labelStyle}>Length (cm)</label>
                            <input type="number" id="pkgLength" name="pkgLength" min="0" value={formData.pkgLength} onChange={handleChange} className={inputStyle} />
                        </div>
                        <div>
                            <label htmlFor="pkgWidth" className={labelStyle}>Width (cm)</label>
                            <input type="number" id="pkgWidth" name="pkgWidth" min="0" value={formData.pkgWidth} onChange={handleChange} className={inputStyle} />
                        </div>
                        <div>
                            <label htmlFor="pkgHeight" className={labelStyle}>Height (cm)</label>
                            <input type="number" id="pkgHeight" name="pkgHeight" min="0" value={formData.pkgHeight} onChange={handleChange} className={inputStyle} />
                        </div>
                    </div>
                </div>

                {/* Section 3: Classification */}
                <div>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3 border-b pb-1 mt-2">Private Classification</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="categoryName" className={labelStyle}>Private Category</label>
                            <input type="text" id="categoryName" name="categoryName" value={formData.categoryName} onChange={handleChange} className={inputStyle} placeholder="e.g. Seasonal" />
                        </div>
                        <div>
                            <label htmlFor="brandName" className={labelStyle}>Private Brand</label>
                            <input type="text" id="brandName" name="brandName" value={formData.brandName} onChange={handleChange} className={inputStyle} placeholder="e.g. My Brand" />
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                    <button type="button" onClick={onCancel} disabled={isSubmitting} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                        Cancel
                    </button>
                    <button type="submit" disabled={isSubmitting} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        {isSubmitting ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Item')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default InventoryForm;