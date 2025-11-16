// src/services/supplierProductService.ts
import apiClient from './api';

// --- Types based on Go API Blueprint ---

// Base Product definition shared with Dropshipper catalog
interface BaseProduct {
    id: number;
    name: string;
    description: string;
    price: number; // Supplier's base price
    stock: number;
    // ... add more common fields like image, category, brand, etc.
}

export interface SupplierProduct extends BaseProduct {
    status: 'draft' | 'pending' | 'published' | 'rejected';
    reason?: string; // Rejection reason if status is 'rejected'
    is_variable: boolean;
    created_at: string;
}

/**
 * @description Calls the GET /v1/products/supplier/me endpoint to retrieve all products owned by the logged-in Supplier.
 * @param {string} [status] - Optional filter by status (e.g., 'pending', 'published').
 * @returns {Promise<SupplierProduct[]>} - A list of the Supplier's products.
 */
export const fetchMyProducts = async (statusFilter?: string): Promise<SupplierProduct[]> => {
    // GET /v1/products/supplier/me
    const params = statusFilter ? { status: statusFilter } : {};
    const response = await apiClient.get<SupplierProduct[]>('/products/supplier/me', { params });
    return response.data;
};