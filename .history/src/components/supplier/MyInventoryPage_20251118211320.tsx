// src/components/supplier/MyInventoryPage.tsx

import React, { useEffect, useState, useCallback } from 'react';
import type { InventoryItem } from '../../types/CoreTypes';
import { getMyInventory, deleteInventoryItem } from '../../api/InventoryHandlers';
import InventoryForm from './InventoryForm'; // NEW IMPORT
import { promoteInventoryItem } from '../../api/InventoryHandlers'; // NEW IMPORT

/**
 * The main component for the Supplier's Private Inventory dashboard.
 * It handles listing, creating, editing, and deleting private inventory items.
 */
const MyInventoryPage: React.FC = () => {
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // State to manage the form for creation/editing
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

    // Function to fetch data, wrapped in useCallback to prevent unnecessary re-creation
    const fetchInventory = useCallback(async () => {
        try {
            setIsLoading(true);
            const items = await getMyInventory();
            setInventoryItems(items);
            setError(null);
        } catch (err) {
            console.error("Failed to load inventory:", err);
            setError("Failed to load inventory. Please ensure the API is running.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Initial data fetch and subsequent fetches after CRUD operations
    useEffect(() => {
        fetchInventory();
    }, [fetchInventory]);


    // --- CRUD ACTIONS ---

    const handleCreateNew = () => {
        setEditingItem(null); // Clear any item from previous edits
        setIsFormOpen(true);
    };

    const handleEditItem = (item: InventoryItem) => {
        setEditingItem(item);
        setIsFormOpen(true);
    };

    const handleFormSuccess = () => {
        setIsFormOpen(false);
        setEditingItem(null);
        // Refresh the list after a successful operation
        fetchInventory(); 
    };

    const handleDeleteItem = async (itemId: number, itemName: string) => {
        if (!window.confirm(`Are you sure you want to permanently delete the private item: "${itemName}"? This cannot be undone.`)) {
            return;
        }

        try {
            // Optimistic UI update (optional, but good UX)
            setInventoryItems(prev => prev.filter(item => item.id !== itemId));
            
            // Call the API handler
            await deleteInventoryItem(itemId);
            
            // Re-fetch to confirm deletion and handle any list changes
            await fetchInventory();
        } catch (err) {
            // FIX: Use the 'err' variable by logging it
            console.error("Delete inventory item failed:", err);
            
            setError(`Failed to delete item: ${itemName}. Please try again.`);
            // If deletion failed, re-fetch to restore the list
            fetchInventory();
        }
    };

    // src/components/supplier/MyInventoryPage.tsx

// ... (existing handleFormSuccess and handleDeleteItem functions)

    const handlePromoteItem = async (itemId: number, itemName: string) => {
        if (!window.confirm(`Are you sure you want to promote "${itemName}" to the Marketplace? It will be submitted for manager approval.`)) {
            return;
        }

        try {
            // Optimistic update: temporarily set status to 'processing' or disable button
            // For now, we rely on a full re-fetch for simplicity.
            
            // Call the API handler
            await promoteInventoryItem(itemId);
            
            // Success notification and re-fetch the list
            alert(`Item "${itemName}" successfully promoted! Status is now PENDING Manager Review.`);
            await fetchInventory();
        } catch (err) {
            console.error("Promote inventory item failed:", err);
            setError(`Failed to promote item: ${itemName}. Please check product data.`);
            // Re-fetch to clear the error and check the current item status
            fetchInventory();
        }
    };
    
// ... (continue to rendering logic)


    // --- RENDERING LOGIC ---

    // 1. Render the form if it's open
    if (isFormOpen) {
        return (
            <div className="taptosell-container">
                <InventoryForm 
                    item={editingItem} 
                    onSuccess={handleFormSuccess} 
                    onCancel={() => setIsFormOpen(false)} 
                />
            </div>
        );
    }
    
    // 2. Render the main list view
    if (isLoading) {
        return <div className="taptosell-container"><h2>My Private Inventory</h2><p>Loading private inventory...</p></div>;
    }

    return (
        <div className="taptosell-container">
            <header className="page-header">
                <h2>My Private Inventory</h2>
                <button className="button-primary" onClick={handleCreateNew}>
                    + Add New Private Item
                </button>
            </header>
            
            <p className="description">
                Manage products you keep private before promoting them to the public marketplace. 
                Total Items: <strong>{inventoryItems.length}</strong>
            </p>

            {error && <p className="error-message">{error}</p>}

            {inventoryItems.length === 0 ? (
                <div className="empty-state">
                    <p>You currently have no private inventory items. Click "Add New Private Item" to begin.</p>
                </div>
            ) : (
                <div className="inventory-list">
                    <table className="taptosell-product-list">
                        <thead>
                            <tr>
                                <th>Name / SKU</th>
                                <th>Price (Your Cost)</th>
                                <th>Stock</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inventoryItems.map(item => (
                                <tr key={item.id}>
                                    <td>
                                        <strong>{item.name}</strong>
                                        <p className="small-text">SKU: {item.sku}</p>
                                    </td>
                                    <td>RM {item.price.toFixed(2)}</td>
                                    <td>{item.stockQuantity}</td>
                                    <td>
                                        <span className={`status-badge status-${item.status}`}>
                                            {item.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="actions">
                                        <button 
                                            className="button-link" 
                                            onClick={() => handleEditItem(item)}
                                        >
                                            Edit
                                        </button>
                                        <button 
                                            className="button-link" 
                                            onClick={() => handleDeleteItem(item.id, item.name)}
                                            style={{ color: 'red' }} // Styling for visibility
                                        >
                                            Delete
                                        </button>
                                        <button 
                                            className="button-primary promote-btn" 
                                            disabled={item.status === 'promoted'}
                                        >
                                            {item.status === 'promoted' ? 'Promoted' : 'Promote'}
                                        </button>
                                        <button 
                                            className="button-primary promote-btn" 
                                            // Ensure we only show the button if it's not already promoted
                                            disabled={item.status === 'promoted'}
                                            // ADD the onClick handler here:
                                            onClick={() => handlePromoteItem(item.id, item.name)} 
                                        >
                                            {item.status === 'promoted' ? 'Promoted' : 'Promote'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default MyInventoryPage;