// src/services/managerService.ts

import api from './api';
import type { PendingProduct, RejectProductPayload , WithdrawalRequest ,
                ProcessWithdrawalPayload, PriceAppeal, ProcessPriceAppealPayload } from '../types/CoreTypes';


// API endpoints used by the Manager dashboard
const ManagerEndpoints = {
    PendingProducts: '/v1/manager/products/pending',
    ApproveProduct: (id: number) => `/v1/manager/products/${id}/approve`,
    RejectProduct: (id: number) => `/v1/manager/products/${id}/reject`,
};

/**
 * Fetches all products currently awaiting manager approval (status: pending).
 * @returns A promise that resolves to an array of PendingProduct objects.
 */
export const getPendingProducts = async (): Promise<PendingProduct[]> => {
    try {
        const response = await api.get<{ products: PendingProduct[] }>(
            ManagerEndpoints.PendingProducts
        );
        return response.data.products;
    } catch (error) {
        console.error('Error fetching pending products:', error);
        throw error; // Re-throw the error for component handling
    }
};

/**
 * Approves a pending product, setting its status to 'published'.
 * @param id The ID of the product to approve.
 * @returns A promise that resolves to a success message.
 */
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

/**
 * Rejects a pending product, setting its status to 'rejected'.
 * @param id The ID of the product to reject.
 * @param payload The reason for rejection.
 * @returns A promise that resolves to a success message.
 */
export const rejectProduct = async (
    id: number,
    payload: RejectProductPayload
): Promise<string> => {
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
 * Fetches all pending supplier withdrawal requests for manager review.
 * Corresponds to GET /v1/manager/withdrawal-requests
 * @returns A promise that resolves to an array of WithdrawalRequest objects.
 */
export const getWithdrawalRequests = async (): Promise<WithdrawalRequest[]> => {
    try {
        const response = await api.get<{ requests: WithdrawalRequest[] }>(
            '/v1/manager/withdrawal-requests'
        );
        return response.data.requests;
    } catch (err) {
        console.error('Error fetching withdrawal requests:', err);
        throw err;
    }
};

/**
 * Approves or rejects a supplier's withdrawal request.
 * Corresponds to PATCH /v1/manager/withdrawal-requests/:id
 * If rejected, refunds the money to the supplier's wallet.
 * @param id The ID of the withdrawal request to process.
 * @param payload The action ('approve' or 'reject') and optional reason.
 * @returns A promise that resolves to a success message.
 */
export const processWithdrawalRequest = async (
    id: number,
    payload: ProcessWithdrawalPayload
): Promise<string> => {
    try {
        const response = await api.patch<{ message: string }>(
            `/v1/manager/withdrawal-requests/${id}`,
            payload
        );
        return response.data.message;
    } catch (err) {
        // Log the full error to help debug failed wallet operations
        console.error(`Error processing withdrawal request ID ${id}:`, err);
        throw err;
    }
};

// src/services/managerService.ts (New Functions)

// ... existing functions (getPendingProducts, approveProduct, rejectProduct, getWithdrawalRequests, processWithdrawalRequest)

/**
 * Fetches all pending supplier price appeals for manager review.
 * Corresponds to GET /v1/manager/price-requests
 * @returns A promise that resolves to an array of PriceAppeal objects.
 */
export const getPriceAppeals = async (): Promise<PriceAppeal[]> => {
    try {
        const response = await api.get<{ appeals: PriceAppeal[] }>(
            '/v1/manager/price-requests'
        );
        return response.data.appeals;
    } catch (err) {
        console.error('Error fetching price appeals:', err);
        throw err;
    }
};

/**
 * Approves or rejects a supplier's price appeal.
 * Corresponds to PATCH /v1/manager/price-requests/:id
 * If approved, it updates the price on the products table.
 * @param id The ID of the price appeal to process.
 * @param payload The action ('approve' or 'reject') and optional reason.
 * @returns A promise that resolves to a success message.
 */
export const processPriceAppeal = async (
    id: number,
    payload: ProcessPriceAppealPayload
): Promise<string> => {
    try {
        const response = await api.patch<{ message: string }>(
            `/v1/manager/price-requests/${id}`,
            payload
        );
        return response.data.message;
    } catch (err) {
        // Log the full error to help debug failed price updates
        console.error(`Error processing price appeal ID ${id}:`, err);
        throw err;
    }
};