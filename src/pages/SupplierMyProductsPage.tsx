import { useState, useEffect, useCallback, type JSX } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { SupplierProduct, InventoryItem } from '../services/supplierProductService';
import { 
  fetchMyProducts, 
  fetchPrivateInventory, 
  deleteProduct, 
  deleteInventoryItem,
  promoteInventoryItem 
} from '../services/supplierProductService';
import { fetchSupplierSales, updateOrderTracking, fetchSupplierOrderDetails, type SupplierOrderItem } from '../services/orderService';

// [FIX] Strict interface to replace 'any'
interface SupplierSale {
  id: number;
  status: string;
  total_amount: number; 
  order_date: string;   
  tracking_number?: string | null; 
}

// [FIX] Integrated in Marketplace Tab to satisfy linter
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
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'marketplace' | 'private' | 'sales'>(() => {
    const params = new URLSearchParams(location.search);
    const view = params.get('view');
    if (view === 'private') return 'private';
    if (view === 'sales') return 'sales';
    return 'marketplace';
  });

  // Data States
  const [marketProducts, setMarketProducts] = useState<SupplierProduct[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [sales, setSales] = useState<SupplierSale[]>([]); 
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>(''); 
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  // Shipment Modal State
  const [processingOrderId, setProcessingOrderId] = useState<number | null>(null);
  const [trackingNumber, setTrackingNumber] = useState<string>('');

  // [NEW] View Order Details Modal State
  const [viewOrderModalOpen, setViewOrderModalOpen] = useState(false);
  const [selectedOrderItems, setSelectedOrderItems] = useState<SupplierOrderItem[]>([]);
  const [viewingOrderId, setViewingOrderId] = useState<number | null>(null);

  const handleTabSwitch = (tab: 'marketplace' | 'private' | 'sales') => {
    setActiveTab(tab);
    navigate(`?view=${tab}`, { replace: true });
  };
  
  const loadData = useCallback(async () => {
    if (!auth.token || !isSupplier) return;
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'marketplace') {
        const data = await fetchMyProducts(statusFilter);
        setMarketProducts(data);
      } else if (activeTab === 'private') {
        const data = await fetchPrivateInventory();
        setInventoryItems(data);
      } else if (activeTab === 'sales') {
        const data = await fetchSupplierSales();
        setSales(data);
      }
    } catch (err) {
      console.error("Dashboard Load Error:", err);
      setError('Failed to load dashboard data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [auth.token, isSupplier, activeTab, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (id: number, name: string, isMarketplace: boolean) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      if (isMarketplace) await deleteProduct(id);
      else await deleteInventoryItem(id);
      loadData();
    } catch (err) { 
      console.error("Delete Error:", err);
      alert("Failed to delete item."); 
    }
  };

  const handlePromote = async (id: number, name: string) => {
    if (!window.confirm(`Promote "${name}" to Marketplace?`)) return;
    try {
        setLoading(true);
        await promoteInventoryItem(id);
        alert(`Success! "${name}" promoted.`);
        handleTabSwitch('marketplace'); 
    } catch (err) {
        interface ApiError { response?: { data?: { error?: string } } };
        const apiError = err as ApiError;
        console.error("Promotion Error:", err);
        alert("Failed: " + (apiError.response?.data?.error || "Unknown Error"));
        setLoading(false);
    }
  };

  const handleShipOrder = async () => {
    if (!processingOrderId || !trackingNumber) return;
    try {
      setLoading(true);
      await updateOrderTracking(processingOrderId, trackingNumber); 
      alert(`Order #${processingOrderId} has been shipped!`);
      setProcessingOrderId(null);
      setTrackingNumber('');
      loadData();
    } catch (err) {
      console.error("Shipment Error:", err); 
      alert("Failed to update shipment status.");
    } finally {
      setLoading(false);
    }
  };

  // [NEW] Function to open Details Modal
  const handleViewDetails = async (orderId: number) => {
      setViewingOrderId(orderId);
      setViewOrderModalOpen(true);
      setSelectedOrderItems([]); // Clear previous
      
      try {
          const items = await fetchSupplierOrderDetails(orderId);
          setSelectedOrderItems(items);
      } catch (err) {
          console.error("Failed to fetch details:", err);
          alert("Could not load order details.");
          setViewOrderModalOpen(false);
      }
  };

  const getStatusBadge = (status: string): JSX.Element => {
    const styles: Record<string, string> = {
      published: 'bg-green-100 text-green-800 border-green-200',
      active: 'bg-green-100 text-green-800 border-green-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      processing: 'bg-blue-100 text-blue-800 border-blue-200',
      shipped: 'bg-purple-100 text-purple-800 border-purple-200',
      on_hold: 'bg-orange-100 text-orange-800 border-orange-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      draft: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    const key = status.replace(/-/g, '_');
    const className = styles[key] || styles.draft;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border ${className}`}>
        {status.replace(/-/g, ' ')}
      </span>
    );
  };

  if (!isSupplier) return <div className="p-8 text-red-600 font-bold text-center">Unauthorized.</div>;

  return (
    <div className="container mx-auto p-4 max-w-6xl relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Supplier Dashboard</h1>
          <p className="text-gray-500 text-sm">Manage inventory and fulfill marketplace sales.</p>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button onClick={() => handleTabSwitch('marketplace')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'marketplace' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>Marketplace</button>
          <button onClick={() => handleTabSwitch('private')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'private' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>Inventory</button>
          <button onClick={() => handleTabSwitch('sales')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'sales' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500'}`}>My Sales</button>
        </div>

        {activeTab !== 'sales' && (
          <Link to={activeTab === 'marketplace' ? "/supplier/products/add" : "/supplier/inventory/add"}>
            <button className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 font-semibold shadow-sm">+ Add Item</button>
          </Link>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex justify-between items-center">
          <p className="text-sm">{error}</p>
          <button onClick={() => setError('')} className="text-red-500 font-bold">×</button>
        </div>
      )}

      {activeTab === 'marketplace' && (
        <div className="mb-4">
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 border border-gray-300 rounded-md text-sm bg-white focus:ring-blue-500"
          >
            {PRODUCT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      )}

      {loading ? <div className="py-12 text-center text-gray-400">Loading dashboard...</div> : (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          {/* TAB 1: MARKETPLACE */}
          {activeTab === 'marketplace' && (
            <table className="min-w-full divide-y divide-gray-200">
               <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {marketProducts.length === 0 ? (
                  <tr><td colSpan={4} className="py-10 text-center text-gray-400">No marketplace products.</td></tr>
                ) : marketProducts.map((p) => (
                  <tr key={p.id}>
                    <td className="px-6 py-4 text-sm font-medium">{p.name}</td>
                    <td className="px-6 py-4">{getStatusBadge(p.status)}</td>
                    <td className="px-6 py-4 text-right text-sm">RM {p.price.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right text-sm space-x-3">
                      <Link to={`/supplier/products/edit/${p.id}`} className="text-blue-600">Edit</Link>
                      <button onClick={() => handleDelete(p.id, p.name, true)} className="text-red-600">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* TAB 2: PRIVATE INVENTORY */}
          {activeTab === 'private' && (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stock</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {inventoryItems.length === 0 ? (
                  <tr><td colSpan={4} className="py-10 text-center text-gray-400">No inventory items.</td></tr>
                ) : inventoryItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium">{item.name}</td>
                    <td className="px-6 py-4 text-sm">{item.sku || '-'}</td>
                    <td className="px-6 py-4 text-right text-sm">{item.stock}</td>
                    <td className="px-6 py-4 text-right text-sm space-x-3">
                      <button onClick={() => handlePromote(item.id, item.name)} className="text-green-600 font-bold hover:underline">Promote ↗</button>
                      <Link to={`/supplier/inventory/edit/${item.id}`} className="text-blue-600">Edit</Link>
                      <button onClick={() => handleDelete(item.id, item.name, false)} className="text-red-600">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* TAB 3: MY SALES (UPDATED) */}
          {activeTab === 'sales' && (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tracking</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sales.length === 0 ? (
                  <tr><td colSpan={4} className="py-10 text-center text-gray-400">No marketplace sales yet.</td></tr>
                ) : sales.map((o) => (
                  <tr key={o.id}>
                    <td className="px-6 py-4 text-sm font-bold">#{o.id}</td>
                    <td className="px-6 py-4">{getStatusBadge(o.status)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                        {o.tracking_number || <span className="text-gray-400 italic">Not available</span>}
                      </td>
                    <td className="px-6 py-4 text-right text-sm font-bold">RM {o.total_amount?.toFixed(2) || "0.00"}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {/* [NEW] View Details Button */}
                      <button 
                        onClick={() => handleViewDetails(o.id)}
                        className="text-blue-600 hover:underline text-sm font-medium"
                      >
                        View Items
                      </button>

                      {o.status === 'processing' && (
                        <button 
                          onClick={() => setProcessingOrderId(o.id)}
                          className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 shadow-sm"
                        >
                          Ship
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Shipment Modal */}
      {processingOrderId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold mb-4">Ship Order #{processingOrderId}</h3>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Number</label>
            <input 
              type="text" 
              className="w-full p-2 border border-gray-300 rounded-md mb-4 focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="e.g. J&T: JT12345678"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setProcessingOrderId(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
              <button 
                onClick={handleShipOrder} 
                disabled={!trackingNumber}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300"
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* [NEW] Order Details Modal */}
      {viewOrderModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg w-full max-w-2xl shadow-2xl max-h-[80vh] flex flex-col">
            <div className="p-6 border-b flex justify-between items-center">
                <h3 className="text-xl font-bold">Packing List: Order #{viewingOrderId}</h3>
                <button onClick={() => setViewOrderModalOpen(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
                {selectedOrderItems.length === 0 ? (
                    <div className="text-center text-gray-400 py-4">Loading details...</div>
                ) : (
                    <table className="min-w-full text-left">
                        <thead>
                            <tr className="border-b text-sm text-gray-500">
                                <th className="pb-2">Product</th>
                                <th className="pb-2">SKU</th>
                                <th className="pb-2">Options</th>
                                <th className="pb-2 text-right">Qty</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {selectedOrderItems.map((item, idx) => (
                                <tr key={idx} className="text-sm">
                                    <td className="py-3 font-medium">{item.productName}</td>
                                    <td className="py-3 text-gray-500">{item.sku}</td>
                                    <td className="py-3">
                                        {item.options && item.options.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                                {item.options.map((opt, i) => (
                                                    <span key={i} className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded text-xs">
                                                        {opt.name}: {opt.value}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : <span className="text-gray-400 italic">-</span>}
                                    </td>
                                    <td className="py-3 text-right font-bold text-lg">{item.quantity}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            
            <div className="p-4 border-t bg-gray-50 flex justify-end">
                <button 
                    onClick={() => setViewOrderModalOpen(false)} 
                    className="px-6 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-medium"
                >
                    Close
                </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default SupplierMyProductsPage;