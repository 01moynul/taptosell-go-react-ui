// src/components/supplier/VariationManager.tsx
import { useState, useEffect, useCallback, type JSX } from 'react';
import { type ProductPayload } from '../../services/supplierProductService';

// --- Types for Variation Management ---

// Represents one group (e.g., "Size") and its options ("S", "M")
interface VariationGroup {
    id: string; // Unique ID for React keying
    name: string;
    options: string[]; // List of option values
}

// Represents one final variant combination (e.g., Size: S, Color: Red)
interface Variant {
    combination: Record<string, string>; // { "Size": "S", "Color": "Red" }
    price: number;
    stock: number;
    sku: string;
}

// Define props for the manager component
interface VariationManagerProps {
    // Function to push the final variation data back up to the parent form state (ProductForm.tsx)
    onVariationsChange: (variations: Variant[]) => void; 
    initialVariations?: unknown; // Initial data from ProductPayload (unknown type from service)
    isEditing: boolean;
}


const VariationManager: React.FC<VariationManagerProps> = ({ onVariationsChange, initialVariations, isEditing }) => {
    
    // State for the variation groups (Size, Color, etc.)
    const [groups, setGroups] = useState<VariationGroup[]>([]);
    
    // State for the final variant combinations and their pricing/stock
    const [variants, setVariants] = useState<Variant[]>([]);
    
    const [newGroupName, setNewGroupName] = useState('');
    const [newOptionInput, setNewOptionInput] = useState('');
    
    // --- Lifecycle and Initialization ---
    
    useEffect(() => {
        // If editing and initial data exists, parse it and set initial state
        if (isEditing && initialVariations && typeof initialVariations === 'object') {
            // NOTE: Placeholder for parsing complex initial JSON data from Go API
            // For now, we will assume an empty state or simple hardcoded defaults for development.
        }
    }, [isEditing, initialVariations]);

    // --- Core Logic: Cartesian Product Calculation ---

    // Function to calculate all possible combinations and generate the variants table
    const calculateVariants = useCallback((currentGroups: VariationGroup[]): Variant[] => {
        const groupsWithValidOptions = currentGroups.filter(g => g.options.length > 0);
        
        if (groupsWithValidOptions.length === 0) {
            return [];
        }

        // 1. Calculate the Cartesian product of all options
        const combinations = groupsWithValidOptions.reduce<Record<string, string>[]>(
            (acc, group) => {
                if (acc.length === 0) {
                    return group.options.map(opt => ({ [group.name]: opt }));
                }
                
                return acc.flatMap(existingCombo => 
                    group.options.map(newOpt => ({
                        ...existingCombo,
                        [group.name]: newOpt,
                    }))
                );
            },
            []
        );

        // 2. Map combinations to the Variant structure
        // We reuse existing variant data if the combination still exists (to preserve price/stock)
        const newVariants: Variant[] = combinations.map(combo => {
            const comboKey = JSON.stringify(combo); // Use stringified combination as a unique key

            // Attempt to find an existing variant in the old list (by combination key)
            const existingVariant = variants.find(v => JSON.stringify(v.combination) === comboKey);

            return existingVariant || {
                combination: combo,
                price: 0,
                stock: 0,
                sku: '',
            };
        });

        return newVariants;
    }, [variants]); // Depend on current variants to reuse price/stock data
    
    // Effect to recalculate variants whenever groups change and push data to parent
    useEffect(() => {
        const newVariants = calculateVariants(groups);
        setVariants(newVariants);
        onVariationsChange(newVariants);
    }, [groups, calculateVariants, onVariationsChange]);


    // --- Group Management Handlers ---

    const handleAddGroup = () => {
        if (!newGroupName.trim()) return;
        const newGroup: VariationGroup = {
            id: Date.now().toString(),
            name: newGroupName.trim(),
            options: [],
        };
        setGroups(prev => [...prev, newGroup]);
        setNewGroupName('');
    };

    const handleRemoveGroup = (groupId: string) => {
        setGroups(prev => prev.filter(g => g.id !== groupId));
    };

    // --- Option Management Handlers ---

    // Adds a new option (tag) to a group when Enter is pressed
    const handleAddOption = (groupId: string, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const optionValue = newOptionInput.trim();
            if (!optionValue) return;

            setGroups(prev => prev.map(group => {
                if (group.id === groupId && !group.options.includes(optionValue)) {
                    return { ...group, options: [...group.options, optionValue] };
                }
                return group;
            }));
            setNewOptionInput('');
        }
    };
    
    const handleRemoveOption = (groupId: string, option: string) => {
        setGroups(prev => prev.map(group => {
            if (group.id === groupId) {
                return { ...group, options: group.options.filter(opt => opt !== option) };
            }
            return group;
        }));
    };

    // --- Variant Table Handlers ---
    
    // Updates a price/stock/sku field in the final variants table
    const handleVariantChange = (index: number, field: keyof Variant, value: string | number) => {
        setVariants(prev => prev.map((variant, i) => {
            if (i === index) {
                // Ensure number fields are parsed correctly
                const parsedValue = typeof value === 'string' && field !== 'sku' ? parseFloat(value) : value;
                return { ...variant, [field]: parsedValue };
            }
            return variant;
        }));
    };


    // --- Rendering Logic ---

    // Determine if we have enough data to render the variant table
    const canRenderTable = groups.filter(g => g.options.length > 0).length > 0;

    return (
        <div className="space-y-6">
            <h4 className="text-lg font-semibold border-b pb-2">1. Define Variation Groups</h4>
            
            {/* Variation Group Definition Area */}
            <div className="space-y-4">
                {groups.map(group => (
                    <div key={group.id} className="p-3 border rounded-md bg-gray-50">
                        <div className="flex justify-between items-center mb-2">
                            <h5 className="font-medium">{group.name}</h5>
                            <button type="button" onClick={() => handleRemoveGroup(group.id)} 
                                className="text-red-500 hover:text-red-700 text-sm"
                            >
                                Remove Group
                            </button>
                        </div>
                        
                        {/* Option Tags */}
                        <div className="flex flex-wrap gap-2 mb-2">
                            {group.options.map(option => (
                                <span key={option} className="inline-flex items-center px-3 py-1 text-sm font-medium bg-blue-100 rounded-full">
                                    {option}
                                    <button type="button" onClick={() => handleRemoveOption(group.id, option)}
                                        className="ml-2 text-blue-700 hover:text-blue-900 leading-none"
                                    >
                                        &times;
                                    </button>
                                </span>
                            ))}
                        </div>
                        
                        {/* Add Option Input */}
                        <input type="text" placeholder={`Add options for ${group.name} (Press Enter)`}
                            value={newOptionInput}
                            onChange={(e) => setNewOptionInput(e.target.value)}
                            onKeyDown={(e) => handleAddOption(group.id, e)}
                            className="mt-1 block w-full border border-gray-300 p-2 rounded-md text-sm"
                        />
                    </div>
                ))}
            </div>

            {/* Add New Group Input */}
            <div className="flex space-x-2">
                <input type="text" placeholder="e.g., Size, Color, Material"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="flex-1 border border-gray-300 p-2 rounded-md"
                />
                <button type="button" onClick={handleAddGroup}
                    className="bg-gray-700 text-white py-2 px-4 rounded-md hover:bg-gray-800"
                >
                    Add Group
                </button>
            </div>
            
            {/* Final Variant Table */}
            {canRenderTable && (
                <div className="mt-8">
                    <h4 className="text-lg font-semibold border-b pb-2">2. Variant Combinations ({variants.length})</h4>
                    
                    <div className="overflow-x-auto mt-4">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    {groups.filter(g => g.options.length > 0).map(group => (
                                        <th key={group.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{group.name}</th>
                                    ))}
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price (RM)</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {variants.map((variant, index) => (
                                    <tr key={index}>
                                        {Object.entries(variant.combination).map(([key, value]) => (
                                            <td key={key} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{value}</td>
                                        ))}
                                        
                                        {/* Price Input */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input type="number" value={variant.price} onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                                                min="0" step="0.01" required className="w-24 border border-gray-300 p-1 text-sm rounded"
                                            />
                                        </td>
                                        
                                        {/* SKU Input */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input type="text" value={variant.sku} onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                                                className="w-24 border border-gray-300 p-1 text-sm rounded"
                                            />
                                        </td>

                                        {/* Stock Input */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input type="number" value={variant.stock} onChange={(e) => handleVariantChange(index, 'stock', e.target.value)}
                                                min="0" required className="w-24 border border-gray-300 p-1 text-sm rounded"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                </div>
            )}
        </div>
    );
};

export default VariationManager;