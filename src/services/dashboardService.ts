// src/services/dashboardService.ts
import apiClient from './api';

// --- Interfaces for Dashboard Data ---

export interface DropshipperStats {
  walletBalance: number;
  processingOrders: number;
  actionRequired: number; // On-Hold orders
}

export interface SupplierStats {
  totalValuation: number; // Cost * Stock
  lowStockCount: number;
  availableBalance: number;
  pendingBalance: number;
  liveProducts: number;
  underReview: number;
}

export interface ManagerStats {
  pendingProducts: number;
  withdrawalRequests: number;
  priceAppeals: number;
}

// --- API Calls ---

/**
 * Fetches stats for the Dropshipper Dashboard (Buyer's Cockpit).
 * Endpoint: GET /v1/dropshipper/dashboard-stats
 */
export const fetchDropshipperStats = async (): Promise<DropshipperStats> => {
  const response = await apiClient.get<DropshipperStats>('/dropshipper/dashboard-stats');
  return response.data;
};

/**
 * Fetches stats for the Supplier Dashboard (Inventory & Wallet).
 * Endpoint: GET /v1/supplier/dashboard-stats
 */
export const fetchSupplierStats = async (): Promise<SupplierStats> => {
  const response = await apiClient.get<SupplierStats>('/supplier/dashboard-stats');
  return response.data;
};

/**
 * Fetches stats for the Manager Dashboard (Approval Queues).
 * Endpoint: GET /v1/manager/dashboard-stats
 */
export const fetchManagerStats = async (): Promise<ManagerStats> => {
  const response = await apiClient.get<ManagerStats>('/manager/dashboard-stats');
  return response.data;
};