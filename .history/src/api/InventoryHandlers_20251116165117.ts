// src/api/InventoryHandlers.ts

import type { GetInventoryResponse, InventoryItem } from "../types/CoreTypes";
import api from "./api"; // Ensure your Axios file is named api.ts/js inside the src/api folder.
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