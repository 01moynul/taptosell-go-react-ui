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
  // [NEW] To display "Color: Red" in the Dropshipper UI
  options: { name: string; value: string }[]; 
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

// --- 2. Strong Types for Raw Backend Response ---

// [NEW] Exported because DropshipperOrdersPage uses it for Modal State
export interface OrderDetailsResponse {
  order: RawOrder;
  items: OrderItemDetail[]; // We map RawItems to this clean type immediately
}

interface RawOrder {
  id: number;
  userId: number;
  status: string;
  total: number;
  createdAt: string;
  tracking?: { String: string; Valid: boolean } | string | null;
}

interface RawOrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  productName: string;
  productSku: string;
  // [NEW] Backend sends parsed JSON here
  options?: { name: string; value: string }[]; 
}

interface OrderListResponse {
  orders: RawOrder[];
}

// Internal type for the raw GET /orders/:id response
interface RawOrderDetailsAPIResponse {
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
  
  const response = await apiClient.get<OrderListResponse>(url);
  
  return (response.data.orders || []).map((o) => ({
    id: o.id,
    user_id: o.userId,
    status: o.status as DropshipperOrder['status'],
    total_amount: o.total,
    order_date: o.createdAt,
    shipping_address: "Shipping Address Placeholder",
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
export const fetchOrderDetails = async (orderId: number | string): Promise<OrderDetailsResponse> => {
  const response = await apiClient.get<RawOrderDetailsAPIResponse>(`/dropshipper/orders/${orderId}`);
  
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
    productSku: item.productSku,
    options: item.options || [] // Ensure it's never undefined
  }));

  // Return the composite object expected by the Modal
  return {
    order: o,
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
    total_amount: o.total, 
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
  interface ShipResponse {
    message: string;
    status: string;
  }
  const response = await apiClient.patch<ShipResponse>(`/supplier/orders/${orderId}/ship`, { tracking });
  return response.data;
};

/**
 * Marks an order as completed (received by dropshipper).
 * POST /v1/dropshipper/orders/:id/complete
 */
export const completeOrder = async (orderId: string | number): Promise<{ message: string; status: string }> => {
  const response = await apiClient.post<{ message: string; status: string }>(
    `/dropshipper/orders/${orderId}/complete`, 
    {}
  );
  return response.data;
};

// --- Supplier Order Details (For Packing List) ---

export interface SupplierOrderItem {
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  options: { name: string; value: string }[];
}

export interface SupplierOrderDetailsResponse {
  items: SupplierOrderItem[];
}

export const fetchSupplierOrderDetails = async (orderId: number): Promise<SupplierOrderItem[]> => {
  const response = await apiClient.get<SupplierOrderDetailsResponse>(`/supplier/orders/${orderId}`);
  return response.data.items;
};