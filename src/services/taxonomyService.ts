// src/services/taxonomyService.ts
import apiClient from './api';
import type { 
    Category, 
    Brand, 
    GetCategoriesResponse, 
    GetBrandsResponse,
    CreateCategoryPayload,
    CreateBrandPayload
} from '../types/CoreTypes';

// --- CATEGORIES ---

/**
 * @description Calls the GET /v1/categories endpoint (Public).
 */
export const fetchCategories = async (): Promise<Category[]> => {
    const response = await apiClient.get<GetCategoriesResponse>('/categories');
    return response.data.categories || [];
};

/**
 * @description Calls the POST /v1/manager/categories endpoint (Manager Only).
 */
export const createCategory = async (payload: CreateCategoryPayload): Promise<Category> => {
    const response = await apiClient.post<{ category: Category }>('/manager/categories', payload);
    return response.data.category;
};

/**
 * @description Calls the DELETE /v1/manager/categories/:id endpoint (Manager Only).
 */
export const deleteCategory = async (id: number): Promise<void> => {
    await apiClient.delete(`/manager/categories/${id}`);
};

// --- BRANDS ---

/**
 * @description Calls the GET /v1/brands endpoint (Public).
 */
export const fetchBrands = async (): Promise<Brand[]> => {
    const response = await apiClient.get<GetBrandsResponse>('/brands');
    return response.data.brands || [];
};

/**
 * @description Calls the POST /v1/manager/brands endpoint (Manager Only).
 */
export const createBrand = async (payload: CreateBrandPayload): Promise<Brand> => {
    const response = await apiClient.post<{ brand: Brand }>('/manager/brands', payload);
    return response.data.brand;
};

/**
 * @description Calls the DELETE /v1/manager/brands/:id endpoint (Manager Only).
 */
export const deleteBrand = async (id: number): Promise<void> => {
    await apiClient.delete(`/manager/brands/${id}`);
};