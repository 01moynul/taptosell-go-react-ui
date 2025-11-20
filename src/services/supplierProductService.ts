// src/services/supplierProductService.ts
import apiClient from './api';

// --- Types ---

// 1. Base Product CORE
interface BaseProductCore {
    name: string;
    description: string;
    price: number;
    stock: number;
    images?: string[];
    video_url?: string;
    weight: number;
    pkg_length: number;
    pkg_width: number;
    pkg_height: number;
}

// 2. Base Product
interface BaseProduct extends BaseProductCore {
    id: number;
}

// Supplier-specific details
export interface SupplierProduct extends BaseProduct {
    status: 'draft' | 'pending' | 'published' | 'rejected';
    reason?: string;
    is_variable: boolean;
    created_at: string;
    category_id: number;
    brand_id: number;
    variations?: unknown;
}

// [NEW] Interface for Private Inventory Items
export interface InventoryItem {
    id: number;
    name: string;
    sku: string;
    stock: number;
    price: number;
    description?: string;
    created_at?: string;
}

// 3. Product Payload
export interface ProductPayload extends BaseProductCore {
    category_id: number;
    brand_name: string;
    is_variable: boolean;
    variations?: unknown;
    action: 'save_draft' | 'submit_for_review';
}

// --- API Functions ---

/**
 * @description Calls GET /v1/products/supplier/me
 * [FIX] Extracts the 'products' array from the JSON response.
 */
export const fetchMyProducts = async (statusFilter?: string): Promise<SupplierProduct[]> => {
    const params = statusFilter ? { status: statusFilter } : {};
    // We define the response shape here: { products: SupplierProduct[] }
    const response = await apiClient.get<{ products: SupplierProduct[] }>('/products/supplier/me', { params });
    // [CRITICAL FIX] Return the array inside the object
    return response.data.products || []; 
};

/**
 * @description Calls POST /v1/products
 */
export const createProduct = async (payload: ProductPayload): Promise<{product_id: number}> => {
    const response = await apiClient.post<{product_id: number}>('/products', payload);
    return response.data;
};

/**
 * @description Calls PUT /v1/products/:id
 */
export const updateProduct = async (productId: number, payload: ProductPayload): Promise<void> => {
    await apiClient.put(`/products/${productId}`, payload);
};

/**
 * @description Calls DELETE /v1/products/:id
 */
export const deleteProduct = async (productId: number): Promise<void> => {
    await apiClient.delete(`/products/${productId}`);
};

// [NEW] Fetch Private Inventory
export const fetchPrivateInventory = async (): Promise<InventoryItem[]> => {
    // GET /v1/supplier/inventory
    const response = await apiClient.get<{ items: InventoryItem[] }>('/supplier/inventory');
    // [CRITICAL FIX] Return the array inside the object
    return response.data.items || [];
};

// [NEW] Delete Private Inventory Item
export const deleteInventoryItem = async (id: number): Promise<void> => {
    await apiClient.delete(`/supplier/inventory/${id}`);
};