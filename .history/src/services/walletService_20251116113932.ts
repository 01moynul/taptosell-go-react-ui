// src/services/walletService.ts
import apiClient from './api';

// --- Types based on Go API Blueprint ---
export interface Transaction {
  id: number;
  amount: number; // Positive or negative value
  type: string; // e.g., 'deposit', 'order_payment', 'restocking_fee'
  details: string;
  timestamp: string;
}

export interface WalletResponse {
  current_balance: number;
  total_credits_earned: number;
  transactions: Transaction[];
}

/**
 * @description Calls the GET /v1/dropshipper/wallet endpoint to retrieve balance and history.
 * This route is protected and requires a Dropshipper JWT.
 * @returns {Promise<WalletResponse>} - The wallet data.
 */
export const fetchDropshipperWallet = async (): Promise<WalletResponse> => {
  // GET /v1/dropshipper/wallet
  const response = await apiClient.get<WalletResponse>('/dropshipper/wallet');
  return response.data;
};