// src/services/managerService.ts

import api from './api';
import type { PendingProduct, RejectProductPayload } from '../types/CoreTypes';

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