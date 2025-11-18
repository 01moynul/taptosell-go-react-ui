// src/components/manager/GlobalTaxonomyManager.tsx

import React, { useState, useEffect, useCallback } from 'react';
import type { Category, Brand } from '../../types/CoreTypes';
import { 
    fetchCategories, 
    fetchBrands, 
    createCategory, 
    createBrand 
} from '../../services/taxonomyService';

const GlobalTaxonomyManager: React.FC = () => {
    // Data State
    const [categories, setCategories] = useState<Category[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    
    // UI State
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newBrandName, setNewBrandName] = useState('');

    /**
     * Fetches the latest lists of categories and brands.
     */
    const refreshData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Run fetches in parallel for efficiency
            const [cats, brds] = await Promise.all([
                fetchCategories(),
                fetchBrands()
            ]);
            setCategories(cats);
            setBrands(brds);
        } catch (err) {
            console.error('Error loading taxonomy data:', err);
            setError('Failed to load categories or brands. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial Load
    useEffect(() => {
        refreshData();
    }, [refreshData]);

    /**
     * Handles creating a new Category.
     */
    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;

        setSubmitting(true);
        try {
            await createCategory({ name: newCategoryName });
            setNewCategoryName(''); // Clear form
            await refreshData();    // Reload list
            alert('Category created successfully!');
        } catch (err) {
            console.error('Failed to create category:', err);
            alert('Failed to create category.');
        } finally {
            setSubmitting(false);
        }
    };

    /**
     * Handles creating a new Brand.
     */
    const handleCreateBrand = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newBrandName.trim()) return;

        setSubmitting(true);
        try {
            await createBrand({ name: newBrandName });
            setNewBrandName(''); // Clear form
            await refreshData(); // Reload list
            alert('Brand created successfully!');
        } catch (err) {
            console.error('Failed to create brand:', err);
            alert('Failed to create brand.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading && categories.length === 0 && brands.length === 0) {
        return <div className="p-8 text-center text-gray-500">Loading taxonomy data...</div>;
    }

    if (error) {
        return (
            <div className="p-4 m-4 bg-red-50 text-red-700 border border-red-200 rounded">
                {error}
                <button onClick={refreshData} className="ml-4 underline font-bold">Retry</button>
            </div>
        );
    }

    return (
        <div className="p-4 max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Global Taxonomy Manager</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* --- CATEGORIES SECTION --- */}
                <section className="bg-white p-6 rounded-lg shadow border border-gray-200">
                    <h3 className="text-xl font-semibold mb-4 text-blue-700 border-b pb-2">Product Categories</h3>
                    
                    {/* Create Form */}
                    <form onSubmit={handleCreateCategory} className="mb-6 flex gap-2">
                        <input 
                            type="text" 
                            placeholder="New Category Name" 
                            className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            disabled={submitting}
                        />
                        <button 
                            type="submit" 
                            disabled={submitting || !newCategoryName.trim()}
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 font-medium"
                        >
                            {submitting ? '...' : 'Add'}
                        </button>
                    </form>

                    {/* List */}
                    <div className="max-h-96 overflow-y-auto pr-2">
                        {categories.length === 0 ? (
                            <p className="text-gray-400 italic">No categories found.</p>
                        ) : (
                            <ul className="space-y-2">
                                {categories.map(cat => (
                                    <li key={cat.id} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded border border-gray-100">
                                        <span className="font-medium text-gray-700">{cat.name}</span>
                                        <span className="text-xs text-gray-400">ID: {cat.id}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </section>

                {/* --- BRANDS SECTION --- */}
                <section className="bg-white p-6 rounded-lg shadow border border-gray-200">
                    <h3 className="text-xl font-semibold mb-4 text-indigo-700 border-b pb-2">Product Brands</h3>
                    
                    {/* Create Form */}
                    <form onSubmit={handleCreateBrand} className="mb-6 flex gap-2">
                        <input 
                            type="text" 
                            placeholder="New Brand Name" 
                            className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={newBrandName}
                            onChange={(e) => setNewBrandName(e.target.value)}
                            disabled={submitting}
                        />
                        <button 
                            type="submit" 
                            disabled={submitting || !newBrandName.trim()}
                            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50 font-medium"
                        >
                            {submitting ? '...' : 'Add'}
                        </button>
                    </form>

                    {/* List */}
                    <div className="max-h-96 overflow-y-auto pr-2">
                        {brands.length === 0 ? (
                            <p className="text-gray-400 italic">No brands found.</p>
                        ) : (
                            <ul className="space-y-2">
                                {brands.map(brand => (
                                    <li key={brand.id} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded border border-gray-100">
                                        <span className="font-medium text-gray-700">{brand.name}</span>
                                        <span className="text-xs text-gray-400">ID: {brand.id}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </section>

            </div>
        </div>
    );
};

export default GlobalTaxonomyManager;