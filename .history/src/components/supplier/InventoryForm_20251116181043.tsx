// src/components/supplier/InventoryForm.tsx

import React, { useState, useEffect } from 'react';
import type { InventoryItem, InventoryPayload } from '../../types/CoreTypes';
import { createInventoryItem, updateInventoryItem } from '../../api/InventoryHandlers';

// Define the Props for the form component
interface InventoryFormProps {
    // If an 'item' is passed, the form is in EDIT mode (PUT)
    // If 'item' is null/undefined, the form is in CREATE mode (POST)
    item?: InventoryItem | null;
    onSuccess: () => void; // Callback function after successful creation/update
    onCancel: () => void; // Callback to close the form/modal
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
    categoryName: '', // Assuming category selection returns a name
    brandName: '',    // Assuming brand selection returns a name
    status: 'draft',
};

const InventoryForm: React.FC<InventoryFormProps> = ({ item, onSuccess, onCancel }) => {
    // Determine the initial state based on whether we are editing an existing item
    const [formData, setFormData] = useState<InventoryPayload>(initialFormState);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isEditMode = !!item;
    const formTitle = isEditMode ? `Edit Private Item: ${item?.name}` : 'Add New Private Inventory Item';

    // Effect to populate form when an item object changes (in edit mode)
    useEffect(() => {
        if (isEditMode && item) {
            // Map the InventoryItem (including ID) to the InventoryPayload
            // We only take the fields that are part of the payload
            const payload: InventoryPayload = {
                name: item.name,
                description: item.description,
                price: item.price,
                sku: item.sku,
                stockQuantity: item.stockQuantity,
                weight: item.weight,
                pkgLength: item.pkgLength,
                pkgWidth: item.pkgWidth,
                pkgHeight: item.pkgHeight,
                categoryName: item.categoryName || '',
                brandName: item.brandName || '',
                status: item.status !== 'promoted' ? item.status : 'ready', // Prevent saving back as 'promoted'
            };
            setFormData(payload);
        } else if (!isEditMode) {
            setFormData(initialFormState);
        }
    }, [item, isEditMode]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        // Handle numeric conversion for number inputs
        const newValue = (type === 'number' || name === 'price' || name.startsWith('pkg')) 
            ? parseFloat(value) || 0 
            : value;
        
        setFormData({
            ...formData,
            [name]: newValue,
        });
    };
    
    // Simple client-side validation
    const validate = (): boolean => {
        if (!formData.name.trim() || !formData.description.trim()) {
            setError("Name and Description are required.");
            return false;
        }
        if (formData.price <= 0 || formData.stockQuantity < 0) {
            setError("Price must be greater than zero and Stock Quantity cannot be negative.");
            return false;
        }
        setError(null);
        return true;
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsSubmitting(true);
        setError(null);

        try {
            if (isEditMode && item) {
                // UPDATE: PUT /v1/supplier/inventory/:id
                await updateInventoryItem(item.id, formData);
            } else {
                // CREATE: POST /v1/supplier/inventory
                await createInventoryItem(formData);
            }
            
            // Success: clear form, notify parent, and close
            onSuccess();

        } catch (err) {
            setError(`Operation failed. Please check your data. Error: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="inventory-form-wrapper">
            <h2>{formTitle}</h2>
            
            {error && <p className="error-message">{error}</p>}
            
            <form onSubmit={handleSubmit} className="taptosell-form-section">
                
                {/* --- 1. CORE DETAILS --- */}
                <h3>Core Item Details</h3>
                <div className="form-group">
                    <label htmlFor="name">Name*</label>
                    <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="description">Description*</label>
                    <textarea id="description" name="description" value={formData.description} onChange={handleChange} required />
                </div>
                <div className="form-group form-grid-3">
                    <label htmlFor="price">Price (Your Cost)*</label>
                    <input type="number" id="price" name="price" min="0.01" step="0.01" value={formData.price} onChange={handleChange} required />
                
                    <label htmlFor="sku">SKU</label>
                    <input type="text" id="sku" name="sku" value={formData.sku} onChange={handleChange} />

                    <label htmlFor="stockQuantity">Stock Quantity*</label>
                    <input type="number" id="stockQuantity" name="stockQuantity" min="0" value={formData.stockQuantity} onChange={handleChange} required />
                </div>


                {/* --- 2. DIMENSIONS (Mandatory for Dropshipping) --- */}
                <h3>Shipping Dimensions</h3>
                <div className="form-group form-grid-3">
                    <label htmlFor="weight">Weight (kg)</label>
                    <input type="number" id="weight" name="weight" min="0" step="0.01" value={formData.weight} onChange={handleChange} />
                
                    <label htmlFor="pkgLength">Length (cm)</label>
                    <input type="number" id="pkgLength" name="pkgLength" min="0" value={formData.pkgLength} onChange={handleChange} />
                    
                    <label htmlFor="pkgWidth">Width (cm)</label>
                    <input type="number" id="pkgWidth" name="pkgWidth" min="0" value={formData.pkgWidth} onChange={handleChange} />
                    
                    <label htmlFor="pkgHeight">Height (cm)</label>
                    <input type="number" id="pkgHeight" name="pkgHeight" min="0" value={formData.pkgHeight} onChange={handleChange} />
                </div>
                
                {/* --- 3. CLASSIFICATION --- */}
                <h3>Classification (Private)</h3>
                <div className="form-group form-grid-2">
                    <label htmlFor="categoryName">Private Category</label>
                    <input type="text" id="categoryName" name="categoryName" value={formData.categoryName} onChange={handleChange} placeholder="e.g., Seasonal" />
                    {/* Note: In a later phase, this will be a dropdown fetching GET /v1/supplier/inventory/categories */}

                    <label htmlFor="brandName">Private Brand</label>
                    <input type="text" id="brandName" name="brandName" value={formData.brandName} onChange={handleChange} placeholder="e.g., My Company Co." />
                    {/* Note: In a later phase, this will be a dropdown fetching GET /v1/supplier/inventory/brands */}
                </div>

                {/* --- 4. FORM ACTIONS --- */}
                <div className="form-actions">
                    <button type="button" className="button-secondary" onClick={onCancel} disabled={isSubmitting}>
                        Cancel
                    </button>
                    <button type="submit" className="button-primary" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Item')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default InventoryForm;