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

/**
 * @description Calls the GET /v1/categories endpoint to retrieve the list of all public product categories.
 * @returns {Promise<Category[]>} - A list of categories.
 */
export const fetchCategories = async (): Promise<Category[]> => {
    // API returns { categories: [...] }
    const response = await apiClient.get<GetCategoriesResponse>('/categories');
    return response.data.categories;
};

/**
 * @description Calls the POST /v1/categories endpoint to create a new category.
 * @param {CreateCategoryPayload} payload - The name and optional parentId.
 * @returns {Promise<Category>} - The created category object.
 */
export const createCategory = async (payload: CreateCategoryPayload): Promise<Category> => {
    // API returns { message: "...", category: { ... } }
    const response = await apiClient.post<{ category: Category }>('/categories', payload);
    return response.data.category;
};

/**
 * @description Calls the GET /v1/brands endpoint to retrieve the list of all public product brands.
 * @returns {Promise<Brand[]>} - A list of brands.
 */
export const fetchBrands = async (): Promise<Brand[]> => {
    // API returns { brands: [...] }
    const response = await apiClient.get<GetBrandsResponse>('/brands');
    return response.data.brands;
};

/**
 * @description Calls the POST /v1/brands endpoint to create a new brand.
 * @param {CreateBrandPayload} payload - The name of the brand.
 * @returns {Promise<Brand>} - The created brand object.
 */
export const createBrand = async (payload: CreateBrandPayload): Promise<Brand> => {
    // API returns { message: "...", brand: { ... } }
    const response = await apiClient.post<{ brand: Brand }>('/brands', payload);
    return response.data.brand;
};