// src/services/supplierProductService.ts
import apiClient from './api';

// ==========================================
// 1. MARKETPLACE PRODUCTS (Public Listing)
// ==========================================

// Base Core
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

// Base Product
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

// Submission Payload Types (Marketplace)
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

// Edit Mode Response (Marketplace)
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
    priceToTTS: number;
    srp: number;
    stockQuantity: number;
    commissionRate?: number;
    weight?: number;
    packageDimensions?: {
        length: number;
        width: number;
        height: number;
    };
    images: string[];
    videoUrl: string;
    sizeChart: { type: 'template' | 'image'; url?: string; templateId?: string } | null;
    variationImages: Record<string, string>;
    brandId: number;
    brandName: string;
    category_ids: number[];
    variants: BackendVariant[];
}


// ==========================================
// 2. PRIVATE INVENTORY (Internal Stock)
// ==========================================

// Private Inventory Item (Reading from DB)
export interface InventoryItem {
    id: number;
    name: string;
    sku: string;
    stock: number;         // DB often calls this 'stock'
    stockQuantity?: number; // Form often expects 'stockQuantity' (mapped)
    price: number;
    description?: string;
    created_at?: string;
    
    // Optional fields for the Form
    weight?: number;
    pkgLength?: number;
    pkgWidth?: number;
    pkgHeight?: number;
    categoryName?: string;
    brandName?: string;
    status?: string;
}

// Private Inventory Payload (Writing to DB)
export interface InventoryPayload {
    name: string;
    description: string;
    price: number;
    sku: string;
    stockQuantity: number;
    weight: number;
    pkgLength: number;
    pkgWidth: number;
    pkgHeight: number;
    categoryName: string;
    brandName: string;
    status: string;
}


// ==========================================
// API FUNCTIONS
// ==========================================

// --- MARKETPLACE HANDLERS ---

export const fetchMyProducts = async (statusFilter?: string): Promise<SupplierProduct[]> => {
    const params = statusFilter ? { status: statusFilter } : {};
    const response = await apiClient.get<{ products: SupplierProduct[] }>('/products/supplier/me', { params });
    return response.data.products || []; 
};

export const fetchProductById = async (id: string | number): Promise<ProductDetailResponse> => {
    const response = await apiClient.get<{ product: ProductDetailResponse }>(`/products/${id}`);
    return response.data.product;
};

export const createProduct = async (payload: ProductSubmissionPayload): Promise<{product_id: number}> => {
    const response = await apiClient.post<{product_id: number}>('/products', payload);
    return response.data;
};

export const updateProduct = async (productId: string | number, payload: ProductSubmissionPayload): Promise<void> => {
    await apiClient.put(`/products/${productId}`, payload);
};

export const deleteProduct = async (productId: number): Promise<void> => {
    await apiClient.delete(`/products/${productId}`);
};

// --- PRIVATE INVENTORY HANDLERS ---

export const fetchPrivateInventory = async (): Promise<InventoryItem[]> => {
    const response = await apiClient.get<{ items: InventoryItem[] }>('/supplier/inventory');
    
    return (response.data.items || []).map(item => {
        let cleanSku = item.sku;

        // [FIX] Define the specific shape of the Go object we received
        interface GoNullString {
            String: string;
            Valid: boolean;
        }

        // Check if 'sku' is actually an object at runtime (despite TS thinking it's a string)
        if (item.sku && typeof item.sku === 'object' && 'String' in item.sku) {
            // Safe Cast: Cast to unknown first, then to our specific interface
            const skuObj = item.sku as unknown as GoNullString;
            cleanSku = skuObj.String;
        }

        return {
            ...item,
            sku: cleanSku,       // Use the clean string
            stockQuantity: item.stock 
        };
    });
};

// [NEW] Create Private Item
export const createInventoryItem = async (payload: InventoryPayload): Promise<InventoryItem> => {
    const response = await apiClient.post<{ item: InventoryItem }>('/supplier/inventory', payload);
    return response.data.item;
};

// [NEW] Update Private Item
export const updateInventoryItem = async (id: number, payload: InventoryPayload): Promise<void> => {
    await apiClient.put(`/supplier/inventory/${id}`, payload);
};

export const deleteInventoryItem = async (id: number): Promise<void> => {
    await apiClient.delete(`/supplier/inventory/${id}`);
};

// [NEW] Promote to Marketplace
export const promoteInventoryItem = async (id: number): Promise<void> => {
    await apiClient.post(`/supplier/inventory/${id}/promote`);
};