// src/pages/SupplierInventoryFormPage.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import InventoryForm from '../components/supplier/InventoryForm';
import { fetchPrivateInventory, type InventoryItem } from '../services/supplierProductService';

const SupplierInventoryFormPage = () => {
  const { id } = useParams(); // Gets the ID from URL (e.g., /edit/5)
  const navigate = useNavigate();
  
  const [itemToEdit, setItemToEdit] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(!!id); // Only load if we have an ID (Edit mode)

  useEffect(() => {
    if (id) {
      // Logic: Since we don't have a "Get One" endpoint for private items yet,
      // we fetch the list and find the matching item.
      fetchPrivateInventory()
        .then((items) => {
          const found = items.find((i) => i.id === Number(id));
          if (found) {
            setItemToEdit(found);
          } else {
            console.error(`Inventory item ID ${id} not found.`);
            navigate('/supplier/products?view=private');
          }
        })
        .catch((err) => console.error("Failed to load inventory for editing:", err))
        .finally(() => setLoading(false));
    }
  }, [id, navigate]);

  const handleSuccess = () => {
    // Navigate back to the Private Inventory tab
    navigate('/supplier/products?view=private'); 
  };

  const handleCancel = () => {
    navigate('/supplier/products?view=private');
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading item details...</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <div className="mb-6">
        <button 
          onClick={handleCancel}
          className="text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1"
        >
          ← Back to Inventory
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Render the actual Form Component */}
        <InventoryForm 
          item={itemToEdit}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
};

export default SupplierInventoryFormPage;