// src/pages/SupplierMyProductsPage.tsx

import { useState, useEffect, useCallback, type JSX } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  fetchMyProducts, 
  fetchPrivateInventory, 
  deleteProduct, 
  deleteInventoryItem,
  promoteInventoryItem, // [CRITICAL] Import for the button
  type SupplierProduct, 
  type InventoryItem 
} from '../services/supplierProductService';

// Filter options for Marketplace products
const PRODUCT_STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'published', label: 'Live (Published)' },
  { value: 'pending', label: 'Pending Review' },
  { value: 'draft', label: 'Drafts' },
  { value: 'rejected', label: 'Rejected' },
];

function SupplierMyProductsPage() {
  const auth = useAuth();
  const isSupplier = auth.user?.role === 'supplier';
  
  // Navigation Hooks
  const location = useLocation();
  const navigate = useNavigate();

  // 1. Tab State with URL Persistence
  // If URL is /supplier/products?view=private, default to 'private'
  const [activeTab, setActiveTab] = useState<'marketplace' | 'private'>(() => {
    const params = new URLSearchParams(location.search);
    return params.get('view') === 'private' ? 'private' : 'marketplace';
  });

  // Helper to switch tabs and update URL
  const handleTabSwitch = (tab: 'marketplace' | 'private') => {
    setActiveTab(tab);
    navigate(`?view=${tab}`, { replace: true });
  };

  // State for Data
  const [marketProducts, setMarketProducts] = useState<SupplierProduct[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  
  // State for UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Unified Loader
  const loadData = useCallback(async () => {
    if (!auth.token || !isSupplier) return;
    
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'marketplace') {
        const data = await fetchMyProducts(statusFilter);
        setMarketProducts(data);
      } else {
        const data = await fetchPrivateInventory();
        setInventoryItems(data);
      }
    } catch (err) {
      console.error("Failed to load products:", err);
      setError('Failed to load your products. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [auth.token, isSupplier, activeTab, statusFilter]);

  // Load data when tab or filter changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- HANDLERS ---

  const handleDelete = async (id: number, name: string, isMarketplace: boolean) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      if (isMarketplace) {
        await deleteProduct(id);
      } else {
        await deleteInventoryItem(id);
      }
      loadData(); // Refresh list
    } catch (err) {
      alert("Failed to delete item.");
      console.error(err);
    }
  };

  // [FIXED] Promote Handler
  const handlePromote = async (id: number, name: string) => {
    if (!window.confirm(`Promote "${name}" to the Marketplace?\n\nThis will create a draft/pending product that Managers can review.`)) return;

    try {
        setLoading(true); // Show loading state
        await promoteInventoryItem(id);
        alert(`Success! "${name}" has been promoted.`);
        
        // Switch to marketplace tab to see the result
        handleTabSwitch('marketplace'); 
    } catch (err) {
        // Strict Type Check for Error
        interface ApiError { message?: string; }
        const apiError = err as ApiError;

        alert("Failed to promote item: " + (apiError.message || "Unknown Error"));
        setLoading(false); // Only stop loading on error (success triggers tab switch reload)
    }
  };

  // --- UI HELPERS ---

  const getStatusBadge = (status: string): JSX.Element => {
    const styles: Record<string, string> = {
      published: 'bg-green-100 text-green-800 border-green-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      draft: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    const className = styles[status] || styles.draft;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border ${className}`}>
        {status.replace(/-/g, ' ')}
      </span>
    );
  };

  const Thumbnail = ({ src, alt }: { src?: string, alt: string }) => (
    <div className="h-12 w-12 flex-shrink-0 rounded bg-gray-100 overflow-hidden border border-gray-200">
      {src ? (
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs">No Img</div>
      )}
    </div>
  );

  if (!isSupplier) return <div className="p-8 text-red-600">Unauthorized access.</div>;

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Supplier Dashboard</h1>
          <p className="text-gray-500 text-sm">Manage your public listing and private inventory.</p>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => handleTabSwitch('marketplace')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'marketplace' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Marketplace Products
          </button>
          <button
            onClick={() => handleTabSwitch('private')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'private' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Private Inventory
          </button>
        </div>

        <Link to={activeTab === 'marketplace' ? "/supplier/products/add" : "/supplier/inventory/add"}>
          <button className="w-full md:w-auto bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 font-semibold shadow-sm flex items-center justify-center gap-2">
            <span className="text-lg font-light">+</span> 
            {activeTab === 'marketplace' ? 'Add to Marketplace' : 'Add Private Item'}
          </button>
        </Link>
      </div>

      {/* Toolbar (Filters) - Only for Marketplace */}
      {activeTab === 'marketplace' && (
        <div className="flex items-center mb-4">
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            {PRODUCT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      )}

      {/* Content Area */}
      {loading ? (
        <div className="py-12 text-center text-gray-500">Loading data...</div>
      ) : error ? (
        <div className="bg-red-50 p-4 text-red-700 rounded-md">{error}</div>
      ) : (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          
          {/* VIEW A: MARKETPLACE LIST */}
          {activeTab === 'marketplace' && (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stock</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {marketProducts.length === 0 ? (
                   <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No marketplace products found.</td></tr>
                ) : marketProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Thumbnail src={p.images?.[0]} alt={p.name} />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{p.name}</div>
                          <div className="text-xs text-gray-500">{p.is_variable ? 'Variable Matrix' : 'Simple Product'}</div>
                          {p.status === 'rejected' && <div className="text-xs text-red-500 mt-0.5">Reason: {p.reason}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(p.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">RM {p.price.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">{p.stock}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <Link to={`/supplier/products/edit/${p.id}`} className="text-blue-600 hover:text-blue-900">Edit</Link>
                      <button onClick={() => handleDelete(p.id, p.name, true)} className="text-red-600 hover:text-red-900">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* VIEW B: PRIVATE INVENTORY LIST */}
          {activeTab === 'private' && (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stock</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inventoryItems.length === 0 ? (
                   <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No private items found.</td></tr>
                ) : inventoryItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.sku || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">RM {item.price.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">{item.stock}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      
                      {/* [WIRED UP] The Promote Button */}
                      <button 
                          onClick={() => handlePromote(item.id, item.name)}
                          className="text-green-600 hover:text-green-900 font-semibold" 
                          title="Promote to Marketplace"
                      >
                        Promote ↗
                      </button>

                      <Link to={`/supplier/inventory/edit/${item.id}`} className="text-blue-600 hover:text-blue-900">Edit</Link>
                      <button onClick={() => handleDelete(item.id, item.name, false)} className="text-red-600 hover:text-red-900">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          
        </div>
      )}
    </div>
  );
}

export default SupplierMyProductsPage;