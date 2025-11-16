// src/services/cartService.ts
import apiClient from './api';

// --- Types based on Go API Blueprint ---
// Dropshipper Cart API (API Endpoints )
// POST /v1/dropshipper/cart/items

interface AddToCartPayload {
  product_id: number;
  quantity: number;
}

// Interface for fetching the cart (GET /v1/dropshipper/cart)
export interface CartItem {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number; // Price dropshipper pays (TTS Price)
  subtotal: number;
}

export interface CartResponse {
  items: CartItem[];
  total_items: number;
  subtotal: number;
  grand_total: number;
}

/**
 * @description Calls the POST /v1/dropshipper/cart/items endpoint to add an item to the cart.
 * This route is protected and requires a Dropshipper JWT in the Authorization header.
 * @param {number} productId - The ID of the product to add.
 * @param {number} quantity - The quantity to add (default is 1).
 * @returns {Promise<void>} - Resolves on success, rejects on error.
 */
export const addToCart = async (productId: number, quantity: number = 1): Promise<void> => {
  const payload: AddToCartPayload = {
    product_id: productId,
    quantity: quantity,
  };
  
  // POST /v1/dropshipper/cart/items 
  await apiClient.post('/dropshipper/cart/items', payload);
};

/**
 * @description Calls the GET /v1/dropshipper/cart endpoint to retrieve the full cart details.
 * This route is protected and requires a Dropshipper JWT. 
 * @returns {Promise<CartResponse>} - The cart data.
 */
export const fetchCart = async (): Promise<CartResponse> => {
  // GET /v1/dropshipper/cart 
  const response = await apiClient.get<CartResponse>('/dropshipper/cart');
  return response.data;
};