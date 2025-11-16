// src/pages/SupplierMyProductsPage.tsx
import { useState, useEffect, useCallback, type JSX } from 'react';
import { useAuth } from '../hooks/useAuth';
import { fetchMyProducts, type SupplierProduct } from '../services/supplierProductService';
import { Link } from 'react-router-dom';
import axios from 'axios';

// Define product status options for the filter dropdown
const PRODUCT_STATUSES = [
  { value: '', label: 'All Products' },
  { value: 'published', label: 'Published (Live)' },
  { value: 'pending', label: 'Pending Approval' },
  { value: 'draft', label: 'Draft' },
  { value: 'rejected', label: 'Rejected' },
];

function SupplierMyProductsPage() {
  const [products, setProducts] = useState<SupplierProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  const auth = useAuth();
  // We check for 'supplier' role here
  const isSupplier = auth.user?.role === 'supplier';
  // Note: Admins/Managers should also see this, but for now we focus on the core 'supplier' role.

  const loadProducts = useCallback(async () => {
    if (!auth.token || !isSupplier) {
      setError('Access denied. You must be a logged-in Supplier to view this page.');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      // Fetch products using the current status filter
      const data = await fetchMyProducts(statusFilter);
      setProducts(data);
    } catch (err) {
      const msg = axios.isAxiosError(err) && err.response?.data?.message
        ? err.response.data.message
        : 'Failed to load your product list.';
      setError(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, [auth.token, isSupplier, statusFilter]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Helper function to get status badge color and text
  const getStatusBadge = (status: SupplierProduct['status']): JSX.Element => {
    let color = '';
    switch (status) {
      case 'published': color = 'bg-green-100 text-green-800'; break;
      case 'pending': color = 'bg-yellow-100 text-yellow-800'; break;
      case 'rejected': color = 'bg-red-100 text-red-800'; break;
      case 'draft': color = 'bg-gray-100 text-gray-800'; break;
      default: color = 'bg-gray-100 text-gray-800';
    }
    return (
      <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium capitalize ${color}`}>
        {status.replace(/-/g, ' ')}
      </span>
    );
  };
  
  // Placeholder for future delete logic (DELETE /v1/products/:id)
  const handleDeleteProduct = (productId: number, productName: string) => {
    if (window.confirm(`Are you sure you want to permanently delete the product: "${productName}"?`)) {
      // Implementation of DELETE /v1/products/:id goes here
      alert(`Delete not yet implemented, but would delete product ID: ${productId}`);
      // After successful delete, call loadProducts()
    }
  };

  // --- Rendering Logic ---

  if (loading) return <h1 className="text-xl font-bold">Loading Your Products...</h1>;
  if (error) return <h1 className="text-xl text-red-600">{error}</h1>;
  if (!isSupplier) return <h1 className="text-xl text-red-600">Unauthorized access. This page is for Suppliers only.</h1>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">My Marketplace Products ({products.length})</h1>

      <div className="flex justify-between items-center mb-6">
        {/* Filter Dropdown */}
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        >
          {PRODUCT_STATUSES.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        
        {/* Add New Product Button */}
        <Link to="/supplier/products/add">
          <button className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 font-semibold transition duration-200">
            + Add New Product
          </button>
        </Link>
      </div>

      {/* Product List */}
      {products.length === 0 ? (
        <p className="text-gray-600">You have no products listed under the current filter.</p>
      ) : (
        <div className="space-y-4">
          {products.map((product) => (
            <div key={product.id} className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center border border-gray-200">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold">{product.name}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Base Price: RM {product.price.toFixed(2)} | Stock: {product.stock} | Type: {product.is_variable ? 'Variable' : 'Simple'}
                </p>
                {product.status === 'rejected' && product.reason && (
                    <p className="text-xs text-red-500 mt-1">Rejection Reason: {product.reason}</p>
                )}
              </div>

              <div className="flex items-center space-x-4">
                {getStatusBadge(product.status)}
                
                {/* Action Buttons */}
                <Link to={`/supplier/products/edit/${product.id}`}>
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Edit
                  </button>
                </Link>

                <button 
                  onClick={() => handleDeleteProduct(product.id, product.name)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SupplierMyProductsPage;