// src/pages/SupplierProductFormPage.tsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { fetchCategories, fetchBrands, type TaxonomyItem } from '../services/taxonomyService';
import { type SupplierProduct } from '../services/supplierProductService'; // Keep type SupplierProduct
import axios from 'axios';
import ProductForm from '../components/supplier/ProductForm'; // FIXED path

function SupplierProductFormPage() {
    const { productId } = useParams<{ productId: string }>();
    const isEditMode = !!productId;
    const [product, setProduct] = useState<SupplierProduct | null>(null);
    const [categories, setCategories] = useState<TaxonomyItem[]>([]);
    const [brands, setBrands] = useState<TaxonomyItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');

    const auth = useAuth();
    const isSupplier = auth.user?.role === 'supplier';

    // 1. Fetch Categories, Brands, and Product Data (if in Edit Mode)
    useEffect(() => {
        if (!isSupplier) {
            setError("Unauthorized. Must be a Supplier.");
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                // Fetch required static data for the form
                const [cats, brs] = await Promise.all([
                    fetchCategories(),
                    fetchBrands(),
                ]);
                setCategories(cats);
                setBrands(brs);

                // Fetch existing product data if editing
                if (isEditMode) {
                    // Note: We need a new service function to fetch a SINGLE product by ID.
                    // Since the backend doesn't have a public GET /v1/products/:id endpoint, 
                    // we'll temporarily reuse fetchMyProducts with a specific filter logic 
                    // or assume the backend team provides GET /v1/products/supplier/:id
                    
                    // For now, let's assume a simplified GET route is available
                    const response = await axios.get<SupplierProduct>(
                        `${axios.defaults.baseURL}/products/supplier/${productId}`
                    );
                    setProduct(response.data);
                }
            } catch (err) {
                const msg = axios.isAxiosError(err) && err.response?.data?.message
                    ? err.response.data.message
                    : isEditMode 
                        ? 'Failed to load product details for editing.'
                        : 'Failed to load form dependencies (categories/brands).';
                setError(`Error: ${msg}`);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isEditMode, isSupplier, productId]);


    // --- Rendering Logic ---

    if (loading) return <h1 className="text-xl font-bold">Loading {isEditMode ? 'Product' : 'Form'}...</h1>;
    if (error) return <h1 className="text-xl text-red-600">{error}</h1>;
    if (!isSupplier) return null; // Error handled above

    // If editing but product data hasn't loaded (and not loading), show error
    if (isEditMode && !product) return <h1 className="text-xl text-red-600">Product not found.</h1>;
    
    // Pass everything to the dedicated form component
    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">
                {isEditMode ? `Edit Product: ${product?.name}` : 'Add New Marketplace Product'}
            </h1>
            
            <ProductForm 
                isEditMode={isEditMode}
                initialProduct={isEditMode ? product : undefined}
                categories={categories}
                brands={brands}
            />
        </div>
    );
}

export default SupplierProductFormPage;