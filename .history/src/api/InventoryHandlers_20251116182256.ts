// src/api/InventoryHandlers.ts

import type { GetInventoryResponse, InventoryItem } from "../types/CoreTypes";
import api from "../services/api"; // Ensure your Axios file is named api.ts/js inside the src/api folder.
import type { InventoryPayload } from "../types/CoreTypes"; // NEW IMPORT

/**
 * Fetches the list of all private inventory items for the logged-in supplier.
 * API Endpoint: GET /v1/supplier/inventory
 * @returns Promise<InventoryItem[]>
 */
export async function getMyInventory(): Promise<InventoryItem[]> {
    try {
        const response = await api.get<GetInventoryResponse>("/v1/supplier/inventory");
        // The API returns { "items": [...] }
        return response.data.items;
    } catch (error) {
        console.error("Error fetching supplier inventory:", error);
        // Throw the error to be handled by the component using this handler
        throw error;
    }
}

/**
 * Creates a new private inventory item for the logged-in supplier.
 * API Endpoint: POST /v1/supplier/inventory
 * @param data - The InventoryPayload containing item details.
 * @returns Promise<InventoryItem> - The newly created item, including its new ID.
 */
export async function createInventoryItem(data: InventoryPayload): Promise<InventoryItem> {
    try {
        const response = await api.post<{ message: string, item: InventoryItem }>("/v1/supplier/inventory", data);
        // The API returns { "message": "...", "item": { ... } }
        return response.data.item;
    } catch (error) {
        console.error("Error creating inventory item:", error);
        throw error;
    }
}

/**
 * Updates an existing private inventory item.
 * API Endpoint: PUT /v1/supplier/inventory/:id
 * @param itemId - The ID of the item to update.
 * @param data - The InventoryPayload containing updated details.
 * @returns Promise<void>
 */
export async function updateInventoryItem(itemId: number, data: InventoryPayload): Promise<void> {
    try {
        // The endpoint returns a simple message on success.
        await api.put(`/v1/supplier/inventory/${itemId}`, data);
    } catch (error) {
        console.error(`Error updating inventory item ID ${itemId}:`, error);
        throw error;
    }
}

/**
 * Deletes a private inventory item.
 * API Endpoint: DELETE /v1/supplier/inventory/:id
 * @param itemId - The ID of the item to delete.
 * @returns Promise<void>
 */
export async function deleteInventoryItem(itemId: number): Promise<void> {
    try {
        // The endpoint returns a simple message on success.
        await api.delete(`/v1/supplier/inventory/${itemId}`);
    } catch (error) {
        console.error(`Error deleting inventory item ID ${itemId}:`, error);
        throw error;
    }
}

// src/api/InventoryHandlers.ts

// ... (existing functions: getMyInventory, createInventoryItem, updateInventoryItem, deleteInventoryItem)

/**
 * Promotes a private inventory item to the public marketplace for manager approval.
 * API Endpoint: POST /v1/supplier/inventory/:id/promote
 * @param itemId - The ID of the item to promote.
 * @returns Promise<void>
 */
export async function promoteInventoryItem(itemId: number): Promise<void> {
    try {
        // The endpoint returns a simple message and the IDs of the newly promoted product.
        await api.post(`/v1/supplier/inventory/${itemId}/promote`);
    } catch (error) {
        console.error(`Error promoting inventory item ID ${itemId}:`, error);
        throw error;
    }
}