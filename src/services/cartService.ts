// src/services/cartService.ts
import apiClient from './api';

// [UPDATE] Add variant_id to the payload interface
interface AddToCartPayload {
  product_id: number;
  variant_id?: number; // Optional: Only for variable products
  quantity: number;
}

export interface CartItem {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number; 
  subtotal: number;
}

export interface CartResponse {
  items: CartItem[];
  total_items: number;
  subtotal: number;
  grand_total: number;
}

/**
 * [UPDATE] Updated function signature to accept variantId
 */
export const addToCart = async (
    productId: number, 
    quantity: number = 1, 
    variantId?: number
): Promise<void> => {
  
  const payload: AddToCartPayload = {
    product_id: productId,
    quantity: quantity,
  };

  // Only add if it exists
  if (variantId) {
      payload.variant_id = variantId;
  }

  // POST /v1/dropshipper/cart/items
  await apiClient.post('/dropshipper/cart/items', payload);
};

// ... (Keep fetchCart, updateCartItem, removeFromCart, processCheckout as they are)
export const fetchCart = async (): Promise<CartResponse> => {
  const response = await apiClient.get<CartResponse>('/dropshipper/cart');
  return response.data;
};

export const updateCartItem = async (productId: number, quantity: number): Promise<void> => {
  await apiClient.put(`/dropshipper/cart/items/${productId}`, { quantity });
};

export const removeFromCart = async (productId: number): Promise<void> => {
  await apiClient.delete(`/dropshipper/cart/items/${productId}`);
};

interface CheckoutPayload {
  shipping_address: string;
}

interface CheckoutResponse {
  order_id: string; 
  status: 'processing' | 'on-hold'; 
}

export const processCheckout = async (shippingAddress: string): Promise<CheckoutResponse> => {
  const payload: CheckoutPayload = {
    shipping_address: shippingAddress,
  };
  const response = await apiClient.post<CheckoutResponse>('/dropshipper/checkout', payload);
  return response.data;
};