// src/pages/DropshipperOrdersPage.tsx
import { useState, useEffect, useCallback, type JSX } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  fetchMyOrders, 
  payOnHoldOrder, 
  completeOrder, 
  fetchOrderDetails, // [NEW] Import this
  type DropshipperOrder,
  type OrderDetailsResponse // [NEW] Import this
} from '../services/orderService';
import axios from 'axios';

const ORDER_STATUSES = [
  { value: '', label: 'All Orders' },
  { value: 'on-hold', label: 'On Hold (Payment Pending)' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

function DropshipperOrdersPage() {
  const [orders, setOrders] = useState<DropshipperOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isPaying, setIsPaying] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState<string | null>(null);

  // [NEW] Modal State
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<OrderDetailsResponse | null>(null);

  const auth = useAuth();
  const isDropshipper = auth.user?.role === 'dropshipper';

  const loadOrders = useCallback(async () => {
    if (!auth.token || !isDropshipper) {
      setError('Access denied. You must be a logged-in Dropshipper.');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const data = await fetchMyOrders(statusFilter);
      setOrders(data);
    } catch (err) {
      const msg = axios.isAxiosError(err) && err.response?.data?.message
        ? err.response.data.message
        : 'Failed to load order history.';
      setError(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, [auth.token, isDropshipper, statusFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // [NEW] View Details Handler
  const handleViewDetails = async (orderId: number) => {
      setViewModalOpen(true);
      setSelectedOrderDetails(null); // Clear previous
      try {
          const details = await fetchOrderDetails(orderId);
          setSelectedOrderDetails(details);
      } catch (err) {
          console.error("Failed to load details:", err);
          alert("Could not load order details.");
          setViewModalOpen(false);
      }
  };

  const handlePayNow = async (orderId: string, totalAmount: number) => {
    if (!window.confirm(`Pay RM ${totalAmount.toFixed(2)}?`)) return;
    setIsPaying(orderId);
    try {
      await payOnHoldOrder(orderId);
      alert(`Payment successful!`);
      await loadOrders();
    } catch (err) {
      interface ApiError { response?: { data?: { message?: string } } }
      const apiError = err as ApiError;
      alert(`Payment Error: ${apiError.response?.data?.message || "Failed"}`);
    } finally {
      setIsPaying(null);
    }
  };

  const handleMarkAsReceived = async (orderId: string) => {
    if (!window.confirm("Confirm receipt? This releases funds to supplier.")) return;
    setIsCompleting(orderId);
    try {
      await completeOrder(orderId);
      loadOrders(); 
    } catch (err) {
      console.error(err);
      alert("Failed to complete order.");
    } finally {
      setIsCompleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-MY', { 
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const getStatusBadge = (status: string): JSX.Element => {
    let color = 'bg-gray-100 text-gray-800';
    if (status === 'on-hold') color = 'bg-yellow-100 text-yellow-800';
    if (status === 'processing') color = 'bg-blue-100 text-blue-800';
    if (status === 'shipped') color = 'bg-purple-100 text-purple-800';
    if (status === 'completed') color = 'bg-green-100 text-green-800';
    if (status === 'cancelled') color = 'bg-red-100 text-red-800';
    return (
      <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium capitalize ${color}`}>
        {status.replace(/-/g, ' ')}
      </span>
    );
  };

  if (loading && orders.length === 0) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-red-600 font-bold">{error}</div>;

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <h1 className="text-3xl font-bold mb-6">My Order History</h1>

      <div className="mb-6">
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-2 border border-gray-300 rounded-md"
        >
          {ORDER_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex justify-between items-start border-b pb-3 mb-3">
              <div>
                <p className="text-gray-500 text-sm">Order <span className="font-bold text-gray-800">#{order.id}</span></p>
                <p className="text-gray-400 text-xs">{formatDate(order.order_date)}</p>
              </div>
              {getStatusBadge(order.status)}
            </div>

            <div className="flex justify-between items-center">
              <div>
                <p className="text-lg font-bold text-gray-900">RM {order.total_amount.toFixed(2)}</p>
                {order.tracking_number && (
                   <p className="text-xs text-purple-700 font-mono mt-1">Tracking: {order.tracking_number}</p>
                )}
              </div>

              <div className="flex gap-2">
                {/* [NEW] View Details Button */}
                <button 
                  onClick={() => handleViewDetails(order.id)}
                  className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded border border-blue-200"
                >
                  View Items
                </button>

                {order.status === 'on-hold' && (
                  <button
                    onClick={() => handlePayNow(order.id.toString(), order.total_amount)}
                    disabled={isPaying !== null}
                    className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    {isPaying === order.id.toString() ? '...' : 'Pay Now'}
                  </button>
                )}

                {order.status === 'shipped' && (
                  <button
                    onClick={() => handleMarkAsReceived(order.id.toString())}
                    disabled={isCompleting !== null}
                    className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    Confirm Receipt
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {orders.length === 0 && <p className="text-gray-500 text-center py-8">No orders found.</p>}
      </div>

      {/* [NEW] Order Details Modal */}
      {viewModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg w-full max-w-2xl shadow-xl max-h-[80vh] flex flex-col">
            <div className="p-5 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
              <h3 className="text-lg font-bold">Order Details #{selectedOrderDetails?.order.id}</h3>
              <button onClick={() => setViewModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {!selectedOrderDetails ? (
                <div className="text-center py-10 text-gray-400">Loading details...</div>
              ) : (
                <table className="min-w-full text-left">
                  <thead>
                    <tr className="text-xs text-gray-500 uppercase border-b">
                      <th className="pb-2">Product</th>
                      <th className="pb-2">SKU</th>
                      <th className="pb-2">Options</th>
                      <th className="pb-2 text-right">Price</th>
                      <th className="pb-2 text-right">Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {selectedOrderDetails.items.map((item, idx) => (
                      <tr key={idx} className="text-sm">
                        <td className="py-3 font-medium text-gray-800">{item.productName}</td>
                        <td className="py-3 text-gray-500">{item.productSku}</td>
                        <td className="py-3">
                          {item.options && item.options.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {item.options.map((opt, i) => (
                                <span key={i} className="bg-gray-100 border border-gray-200 text-gray-600 px-2 py-0.5 rounded text-xs">
                                  {opt.name}: {opt.value}
                                </span>
                              ))}
                            </div>
                          ) : <span className="text-gray-300">-</span>}
                        </td>
                        <td className="py-3 text-right">RM {item.unit_price.toFixed(2)}</td>
                        <td className="py-3 text-right font-bold">{item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
            <div className="p-4 border-t bg-gray-50 rounded-b-lg flex justify-end">
              <button onClick={() => setViewModalOpen(false)} className="px-5 py-2 bg-gray-200 hover:bg-gray-300 rounded font-medium text-gray-700">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DropshipperOrdersPage;