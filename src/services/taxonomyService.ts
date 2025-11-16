// src/services/taxonomyService.ts
import apiClient from './api';

// --- Types based on Go API Blueprint ---

export interface TaxonomyItem {
    id: number;
    name: string;
    // Add other fields needed, e.g., slug, description
}

/**
 * @description Calls the GET /v1/categories endpoint to retrieve the list of all public product categories.
 * @returns {Promise<TaxonomyItem[]>} - A list of categories.
 */
export const fetchCategories = async (): Promise<TaxonomyItem[]> => {
    // GET /v1/categories
    const response = await apiClient.get<TaxonomyItem[]>('/categories');
    return response.data;
};

/**
 * @description Calls the GET /v1/brands endpoint to retrieve the list of all public product brands.
 * @returns {Promise<TaxonomyItem[]>} - A list of brands.
 */
export const fetchBrands = async (): Promise<TaxonomyItem[]> => {
    // GET /v1/brands
    const response = await apiClient.get<TaxonomyItem[]>('/brands');
    return response.data;
};

// Note: POST functions for Managers (to create categories/brands) will be added later in Phase 6.6.