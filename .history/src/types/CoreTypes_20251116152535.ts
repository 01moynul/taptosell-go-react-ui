// src/types/CoreTypes.ts

import { ProductVariantOption } from './ProductTypes'; // Assuming this already exists, or define it here if needed

/**
 * Interface for the core marketplace product.
 * This is a minimal representation based on the data passed to the Price Change Modal.
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