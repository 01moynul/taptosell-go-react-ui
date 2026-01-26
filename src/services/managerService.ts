// src/services/managerService.ts

import api from './api';
import type { 
    PendingProduct, RejectProductPayload, 
    WithdrawalRequest, ProcessWithdrawalPayload, 
    PriceAppeal, ProcessPriceAppealPayload, 
    GetSettingsResponse, UpdateSettingsPayload, 
    User, GetUsersResponse, UpdatePenaltyPayload 
} from '../types/CoreTypes';

// [FIX 1] Centralized Endpoints object with NO '/v1' prefix
// Your api.ts likely has baseURL set to 'http://localhost:8080/v1', so we don't repeat it here.
const ManagerEndpoints = {
    // Products
    PendingProducts: '/manager/products/pending',
    ApproveProduct: (id: number) => `/manager/products/${id}/approve`,
    RejectProduct: (id: number) => `/manager/products/${id}/reject`,
    
    // Withdrawals
    WithdrawalRequests: '/manager/withdrawal-requests',
    ProcessWithdrawal: (id: number) => `/manager/withdrawal-requests/${id}`,

    // Price Appeals
    PriceAppeals: '/manager/price-requests',
    ProcessPriceAppeal: (id: number) => `/manager/price-requests/${id}`,

    // Users
    Users: '/manager/users',
    UpdatePenalty: (id: number) => `/manager/users/${id}/penalty`,

    // Settings
    Settings: '/manager/settings',
};

/**
 * --- PRODUCTS ---
 */
export const getPendingProducts = async (): Promise<PendingProduct[]> => {
    try {
        const response = await api.get<{ products: PendingProduct[] }>(
            ManagerEndpoints.PendingProducts
        );
        // [FIX 2] Safety check: Return empty array if null to prevent "length of null" crash
        return response.data.products || []; 
    } catch (error) {
        console.error('Error fetching pending products:', error);
        throw error;
    }
};

export const approveProduct = async (id: number): Promise<string> => {
    try {
        const response = await api.patch<{ message: string }>(
            ManagerEndpoints.ApproveProduct(id)
        );
        return response.data.message;
    } catch (error) {
        console.error(`Error approving product ID ${id}:`, error);
        throw error;
    }
};

export const rejectProduct = async (id: number, payload: RejectProductPayload): Promise<string> => {
    try {
        const response = await api.patch<{ message: string }>(
            ManagerEndpoints.RejectProduct(id),
            payload
        );
        return response.data.message;
    } catch (error) {
        console.error(`Error rejecting product ID ${id}:`, error);
        throw error;
    }
};

/**
 * --- WITHDRAWALS ---
 */
export const getWithdrawalRequests = async (): Promise<WithdrawalRequest[]> => {
    try {
        const response = await api.get<{ requests: WithdrawalRequest[] }>(
            ManagerEndpoints.WithdrawalRequests
        );
        return response.data.requests || []; 
    } catch (err) {
        console.error('Error fetching withdrawal requests:', err);
        throw err;
    }
};

export const processWithdrawalRequest = async (id: number, payload: ProcessWithdrawalPayload): Promise<string> => {
    try {
        const response = await api.patch<{ message: string }>(
            ManagerEndpoints.ProcessWithdrawal(id),
            payload
        );
        return response.data.message;
    } catch (err) {
        console.error(`Error processing withdrawal request ID ${id}:`, err);
        throw err;
    }
};

/**
 * --- PRICE APPEALS ---
 */
export const getPriceAppeals = async (): Promise<PriceAppeal[]> => {
    try {
        const response = await api.get<{ appeals: PriceAppeal[] }>(
            ManagerEndpoints.PriceAppeals
        );
        return response.data.appeals || [];
    } catch (err) {
        console.error('Error fetching price appeals:', err);
        throw err;
    }
};

export const processPriceAppeal = async (id: number, payload: ProcessPriceAppealPayload): Promise<string> => {
    try {
        const response = await api.patch<{ message: string }>(
            ManagerEndpoints.ProcessPriceAppeal(id),
            payload
        );
        return response.data.message;
    } catch (err) {
        console.error(`Error processing price appeal ID ${id}:`, err);
        throw err;
    }
};

/**
 * --- SETTINGS ---
 */
export const getGlobalSettings = async (): Promise<GetSettingsResponse> => {
    try {
        const response = await api.get<GetSettingsResponse>(
            ManagerEndpoints.Settings
        );
        return response.data;
    } catch (err) {
        console.error('Error fetching global settings:', err);
        throw err;
    }
};

export const updateGlobalSettings = async (payload: UpdateSettingsPayload): Promise<string> => {
    try {
        const response = await api.patch<{ message: string }>(
            ManagerEndpoints.Settings,
            payload
        );
        return response.data.message;
    } catch (err) {
        console.error('Error updating global settings:', err);
        throw err;
    }
};

/**
 * --- USERS ---
 */
export const getUsers = async (): Promise<User[]> => {
    try {
        const response = await api.get<GetUsersResponse>(
            ManagerEndpoints.Users
        );
        return response.data.users || []; 
    } catch (err) {
        console.error('Error fetching users:', err);
        throw err;
    }
};

export const updateUserPenalty = async (id: number, payload: UpdatePenaltyPayload): Promise<string> => {
    try {
        const response = await api.patch<{ message: string }>(
            ManagerEndpoints.UpdatePenalty(id),
            payload
        );
        return response.data.message;
    } catch (err) {
        console.error(`Error updating penalty for user ID ${id}:`, err);
        throw err;
    }
};