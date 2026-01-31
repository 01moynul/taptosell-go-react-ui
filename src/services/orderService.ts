// src/services/orderService.ts
import apiClient from './api';

// --- 1. Strong Types for Frontend Logic ---
export interface OrderItemDetail {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  unit_price: number;
  productName: string;
  productSku: string;
}

export interface DropshipperOrder {
  id: number;
  user_id: number;
  status: 'on-hold' | 'processing' | 'shipped' | 'completed' | 'cancelled';
  total_amount: number;
  order_date: string;
  shipping_address: string;
  tracking_number?: string | null;
  items: OrderItemDetail[];
}

interface PayOrderResponse {
    message: string;
    new_status: string;
}

// --- 2. Strong Types for Raw Backend Response (Fixes 'any' error) ---
interface RawOrder {
  id: number;
  userId: number;
  status: string;
  total: number;
  createdAt: string;
  tracking?: { String: string; Valid: boolean } | string | null; // Handle Go's NullString or raw string
}

interface RawOrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  productName: string;
  productSku: string;
}

interface OrderListResponse {
  orders: RawOrder[];
}

interface OrderDetailsResponse {
  order: RawOrder;
  items: RawOrderItem[];
}

// --- API Calls ---

/**
 * Fetches the current user's order history.
 * GET /v1/dropshipper/orders
 */
export const fetchMyOrders = async (statusFilter?: string): Promise<DropshipperOrder[]> => {
  const url = statusFilter ? `/dropshipper/orders?status=${statusFilter}` : '/dropshipper/orders';
  
  // FIX: Use OrderListResponse instead of 'any'
  const response = await apiClient.get<OrderListResponse>(url);
  
  return (response.data.orders || []).map((o) => ({
    id: o.id,
    user_id: o.userId,
    status: o.status as DropshipperOrder['status'],
    total_amount: o.total,
    order_date: o.createdAt,
    shipping_address: "Shipping Address Placeholder",
    // Handle SQL NullString safely
    tracking_number: typeof o.tracking === 'object' && o.tracking !== null && 'String' in o.tracking 
    ? o.tracking.String 
    : (typeof o.tracking === 'string' ? o.tracking : null),
    items: [] 
  }));
};

/**
 * Fetches details for a single order.
 * GET /v1/dropshipper/orders/:id
 */
export const fetchOrderDetails = async (orderId: string): Promise<DropshipperOrder> => {
  // FIX: Use OrderDetailsResponse instead of { order: any, items: any[] }
  const response = await apiClient.get<OrderDetailsResponse>(`/dropshipper/orders/${orderId}`);
  
  const o = response.data.order;
  const rawItems = response.data.items || [];

  // Map Backend Raw Types to Frontend Interfaces
  const mappedItems: OrderItemDetail[] = rawItems.map(item => ({
    id: item.id,
    orderId: item.orderId,
    productId: item.productId,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    productName: item.productName,
    productSku: item.productSku
  }));

  return {
    id: o.id,
    user_id: o.userId,
    status: o.status as DropshipperOrder['status'],
    total_amount: o.total,
    order_date: o.createdAt,
    shipping_address: "Shipping Address Placeholder",
    tracking_number: typeof o.tracking === 'object' && o.tracking?.Valid ? o.tracking.String : (typeof o.tracking === 'string' ? o.tracking : null),
    items: mappedItems
  };
};

/**
 * Pays for an "On-Hold" order using the wallet.
 * POST /v1/dropshipper/orders/:id/pay
 */
export const payOnHoldOrder = async (orderId: string | number): Promise<PayOrderResponse> => {
  const response = await apiClient.post<PayOrderResponse>(`/dropshipper/orders/${orderId}/pay`, {});
  return response.data;
};

export const fetchSupplierSales = async (): Promise<DropshipperOrder[]> => {
  const response = await apiClient.get<OrderListResponse>('/supplier/orders');
  
  return (response.data.orders || []).map((o) => ({
    id: o.id,
    user_id: o.userId,
    status: o.status as DropshipperOrder['status'],
    total_amount: o.total, // Keep total_amount for DropshipperOrder compatibility
    order_date: o.createdAt,
    shipping_address: "Fulfillment Required",
    tracking_number: typeof o.tracking === 'object' && o.tracking !== null && 'String' in o.tracking 
    ? o.tracking.String 
    : (typeof o.tracking === 'string' ? o.tracking : null),
    items: [] 
  }));
};

/**
 * Updates an order with a tracking number and marks as shipped.
 * PATCH /v1/supplier/orders/:id/ship
 */
export const updateOrderTracking = async (orderId: number, tracking: string): Promise<{ message: string; status: string }> => {
  // [FIX] Define a local interface for the response to avoid 'any' (Error 3)
  interface ShipResponse {
    message: string;
    status: string;
  }
  
  // [FIX] Use established 'apiClient'
  const response = await apiClient.patch<ShipResponse>(`/supplier/orders/${orderId}/ship`, { tracking });
  return response.data;
};