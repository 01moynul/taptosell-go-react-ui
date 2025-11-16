// src/services/orderService.ts
import apiClient from './api';

// --- Types based on Go API Blueprint ---

export interface OrderItem {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_cost: number; // Cost paid by the dropshipper
}

export interface DropshipperOrder {
  id: string; // Order ID (usually a UUID or high-entropy string)
  status: 'on-hold' | 'processing' | 'shipped' | 'completed' | 'cancelled';
  order_date: string;
  total_amount: number;
  shipping_address: string;
  items: OrderItem[];
  // Status check for UI button visibility
  is_paid: boolean; // True if status is 'processing' or later
}

/**
 * @description Calls the GET /v1/dropshipper/orders endpoint to retrieve the order history.
 * @param {string} [statusFilter] - Optional filter by status (e.g., 'on-hold').
 * @returns {Promise<DropshipperOrder[]>} - A list of orders.
 */
export const fetchMyOrders = async (statusFilter?: string): Promise<DropshipperOrder[]> => {
  // GET /v1/dropshipper/orders
  const params = statusFilter ? { status: statusFilter } : {};
  const response = await apiClient.get<DropshipperOrder[]>('/dropshipper/orders', { params });
  return response.data;
};


/**
 * @description Calls the POST /v1/dropshipper/orders/:id/pay endpoint to pay for an 'on-hold' order.
 * This will debit the Dropshipper's wallet.
 * @param {string} orderId - The ID of the order to pay.
 * @returns {Promise<{ new_status: string }>} - The new order status.
 */
export const payOnHoldOrder = async (orderId: string): Promise<{ new_status: string }> => {
  // POST /v1/dropshipper/orders/:id/pay
  const response = await apiClient.post(`/dropshipper/orders/${orderId}/pay`, {});
  return response.data;
};