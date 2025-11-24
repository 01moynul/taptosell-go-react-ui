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

// Supplier-specific details (For Fetching)
export interface SupplierProduct extends BaseProduct {
    status: 'draft' | 'pending' | 'published' | 'rejected';
    reason?: string;
    is_variable: boolean;
    created_at: string;
    category_id: number;
    brand_id: number;
    variations?: unknown;
}

// Private Inventory Item
export interface InventoryItem {
    id: number;
    name: string;
    sku: string;
    stock: number;
    price: number;
    description?: string;
    created_at?: string;
}

// --- NEW: Submission Payload Types (Fixes 'Unexpected any') ---

export interface VariantSubmissionItem {
    sku: string;
    price: number;
    stock: number;
    srp: number;
    options: { name: string; value: string }[];
}

export interface ProductSubmissionPayload {
    name: string;
    description: string;
    status: string;
    brandName: string;
    category_ids: number[];
    images: string[];
    videoUrl: string;
    // Use 'unknown' or specific object structure instead of 'any' to satisfy linter
    sizeChart: { type: 'template' | 'image'; url?: string; templateId?: string } | null;
    variationImages: Record<string, string>;
    simpleProduct: {
        price: number;
        stock: number;
        sku: string;
        srp: number;
    } | null;
    isVariable: boolean;
    variants: VariantSubmissionItem[];
    weight: number;
    packageDimensions: {
        length: number;
        width: number;
        height: number;
    };
}

// --- Detailed Response for Edit Mode (Fetching) ---
export interface BackendVariantOption {
    name: string;
    value: string;
}

export interface BackendVariant {
    sku: string;
    price: number;
    stock: number;
    srp: number;
    options: BackendVariantOption[];
    commissionRate?: number;
}

export interface ProductDetailResponse {
    id: number;
    supplierId: number;
    name: string;
    description: string;
    status: string;
    isVariable: boolean;
    sku?: string;

    // Prices & Stock
    priceToTTS: number;
    srp: number;
    stockQuantity: number;
    commissionRate?: number;

    // Dimensions
    weight?: number;
    packageDimensions?: {
        length: number;
        width: number;
        height: number;
    };

    // Media
    images: string[];
    videoUrl: string;
    sizeChart: { type: 'template' | 'image'; url?: string; templateId?: string } | null;
    variationImages: Record<string, string>;

    // Relations
    brandId: number;
    brandName: string;
    category_ids: number[];

    // Variants
    variants: BackendVariant[];
}


// --- API Functions ---

/**
 * @description Calls GET /v1/products/supplier/me
 */
export const fetchMyProducts = async (statusFilter?: string): Promise<SupplierProduct[]> => {
    const params = statusFilter ? { status: statusFilter } : {};
    const response = await apiClient.get<{ products: SupplierProduct[] }>('/products/supplier/me', { params });
    return response.data.products || []; 
};

/**
 * @description Calls GET /v1/products/:id
 */
export const fetchProductById = async (id: string | number): Promise<ProductDetailResponse> => {
    const response = await apiClient.get<{ product: ProductDetailResponse }>(`/products/${id}`);
    return response.data.product;
};

/**
 * @description Calls POST /v1/products
 */
export const createProduct = async (payload: ProductSubmissionPayload): Promise<{product_id: number}> => {
    const response = await apiClient.post<{product_id: number}>('/products', payload);
    return response.data;
};

/**
 * @description Calls PUT /v1/products/:id
 * Fixed: Replaced 'any' with 'ProductSubmissionPayload'
 */
export const updateProduct = async (productId: string | number, payload: ProductSubmissionPayload): Promise<void> => {
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
    const response = await apiClient.get<{ items: InventoryItem[] }>('/supplier/inventory');
    return response.data.items || [];
};

// [NEW] Delete Private Inventory Item
export const deleteInventoryItem = async (id: number): Promise<void> => {
    await apiClient.delete(`/supplier/inventory/${id}`);
};