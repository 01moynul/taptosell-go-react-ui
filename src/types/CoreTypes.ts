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