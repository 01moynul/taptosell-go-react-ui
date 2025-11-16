// src/services/supplierProductService.ts
import apiClient from './api';

// --- Types based on Go API Blueprint ---

// 1. Base Product CORE: Data fields required for creation/update (no 'id')
interface BaseProductCore {
    name: string;
    description: string;
    price: number; // Supplier's base price
    stock: number;
    // Standard fields identified in the blueprint audit:
    video_url?: string;
    weight: number;
    pkg_length: number;
    pkg_width: number;
    pkg_height: number;
}

// 2. Base Product: Data fields including the required 'id' (used for fetching/editing existing products)
interface BaseProduct extends BaseProductCore {
    id: number;
}

// Supplier-specific details
export interface SupplierProduct extends BaseProduct {
    status: 'draft' | 'pending' | 'published' | 'rejected';
    reason?: string; // Rejection reason if status is 'rejected'
    is_variable: boolean;
    created_at: string;
    // IDs required for forms:
    category_id: number;
    brand_id: number;
    // For variable products, the variations data will be in a specific format
    variations?: unknown;
}

// 3. Product Payload: Extends the CORE data structure, which correctly excludes 'id'
export interface ProductPayload extends BaseProductCore {
    category_id: number;
    brand_name: string; // We send the name, backend creates the ID if new
    is_variable: boolean;
    variations?: unknown;
    action: 'save_draft' | 'submit_for_review'; // Action determines initial status
}


/**
 * @description Calls the GET /v1/products/supplier/me endpoint to retrieve all products.
 * @param {string} [status] - Optional filter by status.
 * @returns {Promise<SupplierProduct[]>} - A list of the Supplier's products.
 */
export const fetchMyProducts = async (statusFilter?: string): Promise<SupplierProduct[]> => {
    // GET /v1/products/supplier/me
    const params = statusFilter ? { status: statusFilter } : {};
    const response = await apiClient.get<SupplierProduct[]>('/products/supplier/me', { params });
    return response.data;
};


/**
 * @description Calls the POST /v1/products endpoint to create a new product.
 * @param {ProductPayload} payload - The product data.
 * @returns {Promise<{product_id: number}>} - The ID of the newly created product.
 */
export const createProduct = async (payload: ProductPayload): Promise<{product_id: number}> => {
    // POST /v1/products
    const response = await apiClient.post<{product_id: number}>('/products', payload);
    return response.data;
};


/**
 * @description Calls the PUT /v1/products/:id endpoint to update an existing product.
 * @param {number} productId - The ID of the product to update.
 * @param {ProductPayload} payload - The product data.
 * @returns {Promise<void>}
 */
export const updateProduct = async (productId: number, payload: ProductPayload): Promise<void> => {
    // PUT /v1/products/:id
    await apiClient.put(`/products/${productId}`, payload);
};


/**
 * @description Calls the DELETE /v1/products/:id endpoint to delete a product.
 * @param {number} productId - The ID of the product to delete.
 * @returns {Promise<void>}
 */
export const deleteProduct = async (productId: number): Promise<void> => {
    // DELETE /v1/products/:id
    await apiClient.delete(`/products/${productId}`);
};