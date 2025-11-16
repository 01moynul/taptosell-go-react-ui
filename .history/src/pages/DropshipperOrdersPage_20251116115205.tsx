// src/pages/DropshipperOrdersPage.tsx
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { fetchMyOrders, payOnHoldOrder, type DropshipperOrder } from '../services/orderService';
import axios from 'axios';

// Define available status filters for the UI
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
  const [isPaying, setIsPaying] = useState<string | null>(null); // Stores the ID of the order currently being paid

  const auth = useAuth();
  const isDropshipper = auth.user?.role === 'dropshipper';

  // Function to load the orders based on the current filter
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

  // Handler for the "Pay Now" button
  const handlePayNow = async (orderId: string, totalAmount: number) => {
    if (!window.confirm(`Are you sure you want to pay RM ${totalAmount.toFixed(2)} for this order? This will be deducted from your wallet.`)) {
      return;
    }

    setIsPaying(orderId); // Start loading state for this specific order
    setError('');
    
    try {
      // 1. Call the API to process payment
      const response = await payOnHoldOrder(orderId);

      // 2. Display success message based on new status
      alert(`Payment successful! Order status updated to: ${response.new_status.toUpperCase()}`);

      // 3. Reload the orders list to update the status and remove the 'Pay Now' button
      await loadOrders();

    } catch (err) {
      const msg = axios.isAxiosError(err) && err.response?.data?.message
        ? err.response.data.message
        : 'Payment failed. Check your wallet balance.';
      setError(`Payment Error: ${msg}`);
    } finally {
      setIsPaying(null);
    }
  };
  
  // Helper function to format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-MY', { 
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  // Helper function to get status badge color
  const getStatusBadge = (status: DropshipperOrder['status']): JSX.Element => {
    let color = '';
    switch (status) {
      case 'on-hold': color = 'bg-yellow-100 text-yellow-800'; break;
      case 'processing': color = 'bg-blue-100 text-blue-800'; break;
      case 'shipped': color = 'bg-indigo-100 text-indigo-800'; break;
      case 'completed': color = 'bg-green-100 text-green-800'; break;
      case 'cancelled': color = 'bg-red-100 text-red-800'; break;
      default: color = 'bg-gray-100 text-gray-800';
    }
    return (
      <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium capitalize ${color}`}>
        {status.replace(/-/g, ' ')}
      </span>
    );
  };

  // --- Rendering Logic ---

  if (loading) return <h1 className="text-xl font-bold">Loading Your Orders...</h1>;
  if (error) return <h1 className="text-xl text-red-600">{error}</h1>;
  if (!orders && !loading) return <h1 className="text-xl text-red-600">No orders found.</h1>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">My Order History</h1>

      {/* Filter and Messages */}
      <div className="flex justify-between items-center mb-6">
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        >
          {ORDER_STATUSES.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        
        {error && <p className="text-red-600 font-medium bg-red-100 p-3 rounded">Last action error: {error}</p>}
      </div>

      {/* Orders Table/List */}
      {orders.length === 0 ? (
        <p className="text-gray-600">No orders found matching this filter.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              {/* Header Row */}
              <div className="flex justify-between items-start border-b pb-3 mb-3">
                <div className="text-sm">
                  <p className="text-gray-500">Order ID: <span className="text-gray-800 font-medium">{order.id}</span></p>
                  <p className="text-gray-500">Date Placed: <span className="text-gray-800 font-medium">{formatDate(order.order_date)}</span></p>
                </div>
                <div>
                  {getStatusBadge(order.status)}
                </div>
              </div>

              {/* Items Summary */}
              <div className="mb-4">
                <ul className="text-sm space-y-1">
                  {order.items.map(item => (
                    <li key={item.product_id} className="flex justify-between">
                      <span className="text-gray-700">{item.product_name} x {item.quantity}</span>
                      <span className="text-gray-900 font-medium">RM {item.unit_cost.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Footer and Actions */}
              <div className="flex justify-between items-end pt-3 border-t">
                <div>
                  <p className="text-lg font-bold">Total: <span className="text-green-600">RM {order.total_amount.toFixed(2)}</span></p>
                  <p className="text-sm text-gray-500 mt-1">Ship to: {order.shipping_address.substring(0, 40)}...</p>
                </div>
                
                {/* Pay Now Button */}
                {order.status === 'on-hold' && (
                  <button
                    onClick={() => handlePayNow(order.id, order.total_amount)}
                    disabled={isPaying !== null}
                    className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 font-semibold transition duration-200 disabled:bg-gray-400"
                  >
                    {isPaying === order.id ? 'Processing...' : 'Pay Now'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DropshipperOrdersPage;