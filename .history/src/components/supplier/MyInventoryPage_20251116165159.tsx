// src/components/supplier/MyInventoryPage.tsx

import React, { useEffect, useState } from 'react';
import type { InventoryItem } from '../../types/CoreTypes';
import { getMyInventory } from '../../api/InventoryHandlers';

/**
 * The main component for the Supplier's Private Inventory dashboard.
 * Corresponds to Phase 6.5: Standalone Inventory UI.
 */
const MyInventoryPage: React.FC = () => {
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchInventory() {
            try {
                setIsLoading(true);
                const items = await getMyInventory();
                setInventoryItems(items);
            } catch (err) {
                // In a real app, we would check the error status (e.g., 401, 500)
                setError("Failed to load inventory. Please try again.");
            } finally {
                setIsLoading(false);
            }
        }

        fetchInventory();
    }, []);

    // --- RENDERING LOGIC ---

    if (isLoading) {
        return <div className="taptosell-container"><h2>My Private Inventory</h2><p>Loading private inventory...</p></div>;
    }

    if (error) {
        return <div className="taptosell-container"><h2>My Private Inventory</h2><p className="error-message">{error}</p></div>;
    }

    return (
        <div className="taptosell-container">
            <header className="page-header">
                <h2>My Private Inventory</h2>
                <button className="button-primary">
                    + Add New Private Item
                </button>
            </header>
            
            <p className="description">
                Manage products you keep private before promoting them to the public marketplace. 
                Total Items: <strong>{inventoryItems.length}</strong>
            </p>

            {inventoryItems.length === 0 ? (
                <div className="empty-state">
                    <p>You currently have no private inventory items. Click "Add New Private Item" to begin.</p>
                </div>
            ) : (
                <div className="inventory-list">
                    {/* Placeholder for the table/list view */}
                    <h3>Inventory List (Display Placeholder)</h3>
                    <ul>
                        {inventoryItems.map(item => (
                            <li key={item.id} style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>
                                <strong>{item.name}</strong> (SKU: {item.sku}) - Price: ${item.price} - Stock: {item.stockQuantity}
                                <span style={{ marginLeft: '15px', color: item.status === 'promoted' ? 'green' : item.status === 'ready' ? 'blue' : 'gray' }}>
                                    Status: {item.status}
                                </span>
                                <button className="button-secondary" style={{ float: 'right' }}>
                                    Promote
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default MyInventoryPage;