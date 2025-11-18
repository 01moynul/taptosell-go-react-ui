// src/types/CoreTypes.ts

/**
 * Interface for the key/value pair of a product variant option (e.g., "Size: Small").
 * Corresponds to Go model ProductVariantOption.
 */
export interface ProductVariantOption {
    name: string;
    value: string;
}

/**
 * Interface for the core marketplace product.
 * This is a minimal representation based on the data needed across the UI.
 * You should expand this to match the full Go product model (models.Product).
 */
export interface Product {
    id: number;
    name: string;
    description: string;
    price: number; // Corresponds to Go's price_to_tts
    isVariable: boolean;
    status: 'draft' | 'pending' | 'published' | 'rejected' | 'private_inventory';
    // Add other fields (SKU, Stock, Categories, etc.) as needed
}

/**
 * Defines the required payload for the POST /v1/products/:id/request-price-change endpoint.
 * Corresponds to Go struct RequestPriceChangeInput.
 */
export interface RequestPriceChangePayload {
    newPrice: number;
    reason?: string;
}

// You can add other global types here (e.g., User, Category, Brand)
/**
 * Defines the required payload for POST /v1/supplier/inventory (Create) 
 * and PUT /v1/supplier/inventory/:id (Update) endpoints.
 * All fields are required for a valid submission.
 */
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
    categoryName?: string; // Optional if no category is assigned
    brandName?: string;   // Optional if no brand is assigned
    // Status is typically managed on the backend, but we include it for clarity
    status?: 'draft' | 'ready'; 
}
/**
 * Interface for a single item in the Supplier's private inventory.
 * Corresponds to Go model InventoryItem.
 * This item is NOT visible on the public marketplace until promoted.
 */
export interface InventoryItem {
    id: number;
    userId: number; // The supplier who owns it
    name: string;
    description: string;
    price: number; // The supplier's cost/price
    sku: string;
    stockQuantity: number;
    // Dimensions (as added in Phase 4.7)
    weight: number;
    pkgLength: number;
    pkgWidth: number;
    pkgHeight: number;
    // Association to private categories/brands
    categoryName?: string; 
    brandName?: string;
    // Status can be 'draft', 'ready', or 'promoted'
    status: 'draft' | 'ready' | 'promoted';
    createdAt: string; // ISO Date String
    updatedAt: string; // ISO Date String
}

/**
 * Interface for the response from GET /v1/supplier/inventory
 */
export interface GetInventoryResponse {
    items: InventoryItem[];
}

/**
 * Interface for a product awaiting Manager approval.
 * This extends the core Product interface with Manager-specific details.
 * Corresponds to the response from GET /v1/manager/products/pending.
 */
export interface PendingProduct extends Product {
    supplierId: number;
    supplierName: string; // Name of the user who submitted the product
    commissionRate: number; // The commission rate applied to this specific product (from the products table)
    // You may add other fields like a list of images or variations here later
}

/**
 * Interface for the rejection payload required by PATCH /v1/manager/products/:id/reject
 */
export interface RejectProductPayload {
    reason: string;
}