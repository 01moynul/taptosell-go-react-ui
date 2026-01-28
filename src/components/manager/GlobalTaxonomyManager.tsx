// src/components/manager/GlobalTaxonomyManager.tsx
import React, { useEffect, useState } from 'react';
import { 
    fetchCategories, createCategory, deleteCategory,
    fetchBrands, createBrand, deleteBrand 
} from '../../services/taxonomyService';
// We use 'import type' because of the verbatimModuleSyntax rule
import type { Category, Brand } from '../../types/CoreTypes';

// --- Recursive Component for Category Tree ---
// This component calls itself to render children (sub-categories)
const CategoryNode = ({ 
    category, 
    level = 0, 
    onDelete 
}: { 
    category: Category; 
    level?: number; 
    onDelete: (id: number) => void;
}) => {
    return (
        <div className="mb-1">
            <div 
                className="flex items-center justify-between p-2 bg-white border rounded hover:bg-gray-50 transition-colors"
                style={{ marginLeft: `${level * 24}px` }} // Indent based on depth
            >
                <div className="flex items-center gap-2">
                    {/* Visual indicator for child items */}
                    {level > 0 && <span className="text-gray-400">└─</span>}
                    <span className="font-medium text-gray-800">{category.name}</span>
                    <span className="text-xs text-gray-400">({category.slug})</span>
                </div>
                <button 
                    onClick={() => onDelete(category.id)}
                    className="text-red-500 hover:text-red-700 text-sm px-2 py-1 rounded hover:bg-red-50"
                >
                    Delete
                </button>
            </div>
            
            {/* Recursively render children if they exist */}
            {category.children && category.children.length > 0 && (
                <div className="border-l-2 border-gray-100 ml-3">
                    {category.children.map(child => (
                        <CategoryNode 
                            key={child.id} 
                            category={child} 
                            level={level + 1} 
                            onDelete={onDelete} 
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// --- Main Component ---
export default function GlobalTaxonomyManager() {
    const [activeTab, setActiveTab] = useState<'categories' | 'brands'>('categories');
    
    // Data State
    const [categories, setCategories] = useState<Category[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [newCatName, setNewCatName] = useState('');
    const [newCatParent, setNewCatParent] = useState<number | null>(null);
    const [newBrandName, setNewBrandName] = useState('');

    // --- Data Fetching ---
    const loadData = async () => {
        setLoading(true);
        try {
            const [catsData, brandsData] = await Promise.all([
                fetchCategories(),
                fetchBrands()
            ]);
            setCategories(catsData);
            setBrands(brandsData);
            setError(null);
        } catch (err) {
            console.error(err);
            // We set a generic error, but check console for details (recurring error fix)
            setError("Failed to load taxonomy data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // --- Category Handlers ---

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCatName.trim()) return;

        try {
            await createCategory({ name: newCatName, parentId: newCatParent });
            setNewCatName('');
            setNewCatParent(null);
            await loadData(); // Refresh tree to show new item
        } catch (err) {
            console.error("Create category failed", err);
            alert("Failed to create category");
        }
    };

    const handleDeleteCategory = async (id: number) => {
        if (!window.confirm("Are you sure? If this category has sub-categories, they will become root categories.")) return;
        try {
            await deleteCategory(id);
            await loadData();
        } catch (err) {
            console.error("Delete category failed", err);
            alert("Failed to delete category");
        }
    };

    // --- Brand Handlers ---

    const handleAddBrand = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newBrandName.trim()) return;

        try {
            await createBrand({ name: newBrandName });
            setNewBrandName('');
            await loadData();
        } catch (err) {
            console.error("Create brand failed", err);
            alert("Failed to create brand");
        }
    };

    const handleDeleteBrand = async (id: number) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await deleteBrand(id);
            await loadData();
        } catch (err) {
            console.error("Delete brand failed", err);
            alert("Failed to delete brand");
        }
    };

    // --- Helper: Flatten Categories for Dropdown ---
    // The "Parent" dropdown cannot be a tree; it must be a flat list of options.
    // We flatten the recursive structure here.
    const getFlatCategories = (cats: Category[], prefix = ''): {id: number, name: string}[] => {
        let flat: {id: number, name: string}[] = [];
        cats.forEach(c => {
            flat.push({ id: c.id, name: prefix + c.name });
            if (c.children) {
                flat = [...flat, ...getFlatCategories(c.children, prefix + '-- ' + c.name + ' > ')];
            }
        });
        return flat;
    };
    const flatCatList = getFlatCategories(categories);

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800">Global Taxonomy Manager</h2>

            {/* Tabs */}
            <div className="flex space-x-4 border-b">
                <button 
                    onClick={() => setActiveTab('categories')}
                    className={`pb-2 px-4 ${activeTab === 'categories' ? 'border-b-2 border-blue-600 text-blue-600 font-bold' : 'text-gray-500'}`}
                >
                    Categories
                </button>
                <button 
                    onClick={() => setActiveTab('brands')}
                    className={`pb-2 px-4 ${activeTab === 'brands' ? 'border-b-2 border-blue-600 text-blue-600 font-bold' : 'text-gray-500'}`}
                >
                    Brands
                </button>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-3 rounded">{error}</div>}

            {/* --- CATEGORIES TAB --- */}
            {activeTab === 'categories' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Form */}
                    <div className="bg-gray-50 p-4 rounded-lg h-fit">
                        <h3 className="font-semibold mb-4">Add New Category</h3>
                        <form onSubmit={handleAddCategory} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Category Name</label>
                                <input 
                                    type="text" 
                                    className="w-full mt-1 p-2 border rounded"
                                    value={newCatName}
                                    onChange={e => setNewCatName(e.target.value)}
                                    placeholder="e.g., Electronics"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Parent Category (Optional)</label>
                                <select 
                                    className="w-full mt-1 p-2 border rounded"
                                    value={newCatParent || ''}
                                    onChange={e => setNewCatParent(e.target.value ? Number(e.target.value) : null)}
                                >
                                    <option value="">(None - Root Category)</option>
                                    {flatCatList.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? 'Processing...' : 'Create Category'}
                            </button>
                        </form>
                    </div>

                    {/* Right: Tree View */}
                    <div className="lg:col-span-2">
                        <div className="bg-white border rounded-lg p-4 min-h-[400px]">
                            {loading && categories.length === 0 ? (
                                <p className="text-gray-500">Loading...</p>
                            ) : categories.length === 0 ? (
                                <p className="text-gray-500">No categories found.</p>
                            ) : (
                                categories.map(cat => (
                                    <CategoryNode 
                                        key={cat.id} 
                                        category={cat} 
                                        onDelete={handleDeleteCategory} 
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- BRANDS TAB --- */}
            {activeTab === 'brands' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Form */}
                    <div className="bg-gray-50 p-4 rounded-lg h-fit">
                        <h3 className="font-semibold mb-4">Add New Brand</h3>
                        <form onSubmit={handleAddBrand} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Brand Name</label>
                                <input 
                                    type="text" 
                                    className="w-full mt-1 p-2 border rounded"
                                    value={newBrandName}
                                    onChange={e => setNewBrandName(e.target.value)}
                                    placeholder="e.g., Nike"
                                />
                            </div>
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? 'Processing...' : 'Create Brand'}
                            </button>
                        </form>
                    </div>

                    {/* Right: List View */}
                    <div className="lg:col-span-2">
                        <div className="bg-white border rounded-lg p-4">
                            {brands.length === 0 ? (
                                <p className="text-gray-500">No brands found.</p>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {brands.map(brand => (
                                        <div key={brand.id} className="flex justify-between items-center p-3 border rounded bg-gray-50">
                                            <span className="font-medium">{brand.name}</span>
                                            <button 
                                                onClick={() => handleDeleteBrand(brand.id)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}