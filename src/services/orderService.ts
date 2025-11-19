// src/services/orderService.ts
import apiClient from './api';

// --- Types ---

export interface OrderItem {
  product_id: number;
  product_name: string;
  product_sku: string; // Added for display
  quantity: number;
  unit_cost: number;
  total_cost: number;
}

export interface DropshipperOrder {
  id: number;
  status: 'on-hold' | 'processing' | 'shipped' | 'completed' | 'cancelled';
  created_at: string; // Go typically sends this as created_at
  total_amount: number;
  shipping_address: string;
  items?: OrderItem[]; // Items might not be in the summary list view
}

// API Response Wrappers
interface OrdersResponse {
  orders: DropshipperOrder[];
}

interface SingleOrderResponse {
  order: DropshipperOrder;
  items: OrderItem[];
}

// --- API Calls ---

/**
 * Retrieves the order history list.
 * Endpoint: GET /v1/dropshipper/orders
 */
export const fetchMyOrders = async (): Promise<DropshipperOrder[]> => {
  const response = await apiClient.get<OrdersResponse>('/dropshipper/orders');
  // The backend returns { "orders": [...] }
  return response.data.orders;
};

/**
 * Retrieves full details for a specific order.
 * Endpoint: GET /v1/dropshipper/orders/:id
 */
export const fetchOrderDetails = async (orderId: string | number): Promise<SingleOrderResponse> => {
  const response = await apiClient.get<SingleOrderResponse>(`/dropshipper/orders/${orderId}`);
  return response.data;
};

/**
 * Pays for an 'on-hold' order using the wallet.
 * Endpoint: POST /v1/dropshipper/orders/:id/pay
 */
export const payOnHoldOrder = async (orderId: string | number): Promise<{ new_status: string }> => {
  const response = await apiClient.post<{ new_status: string }>(`/dropshipper/orders/${orderId}/pay`, {});
  return response.data;
};