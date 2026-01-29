// src/pages/CheckoutPage.tsx
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { fetchCart, processCheckout } from '../services/cartService';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// ✅ FIX: Define local interfaces that match the actual Go Backend JSON
interface LocalCartItem {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  lineTotal: number; // Synchronized with Backend CartItemResponse
}

interface LocalCartResponse {
  items: LocalCartItem[];
  total_items: number;
  subtotal: number;
  grand_total: number;
}

function CheckoutPage() {
  const [cart, setCart] = useState<LocalCartResponse | null>(null);
  const [shippingAddress, setShippingAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  
  const auth = useAuth();
  const navigate = useNavigate();
  const isDropshipper = auth.user?.role === 'dropshipper';

  const loadCart = useCallback(async () => {
    if (!auth.token || !isDropshipper) {
      setError('You must be a logged-in Dropshipper to checkout.');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const data = await fetchCart();
      // Cast the service response to our local trusted interface
      const trustedData = data as unknown as LocalCartResponse;
      
      if (trustedData.items.length === 0) {
        navigate('/catalog', { state: { message: 'Cannot checkout with an empty cart.' } });
        return;
      }
      setCart(trustedData);
    } catch (err) {
      // ✅ Standard Fix: Log the error for developer debugging
      console.error("Failed to load checkout cart:", err);
      const msg = axios.isAxiosError(err) && err.response?.data?.message
        ? err.response.data.message
        : 'Failed to load cart for checkout.';
      setError(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, [auth.token, isDropshipper, navigate]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);
  
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!cart || !shippingAddress.trim()) {
      setError('Please enter a shipping address.');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await processCheckout(shippingAddress.trim());

      if (response.status === 'processing') {
        navigate(`/dropshipper/orders`, { state: { message: 'Your order was placed successfully!' } });
      } else if (response.status === 'on-hold') {
        navigate(`/dropshipper/orders`, { state: { message: 'Order placed, but payment is on-hold.', onHold: true } });
      }

    } catch (err) {
      // ✅ Standard Fix: Log the error for developer debugging
      console.error("Checkout submission failed:", err);
      const msg = axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : 'Checkout failed. Please check your wallet balance.';
      setError(`Error: ${msg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="p-8 text-center font-bold">Loading Checkout Summary...</div>;
  if (error && !cart) return <div className="p-8 text-center text-red-600 font-bold">{error}</div>;
  if (!cart) return null;

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>

      <form onSubmit={handleCheckout} className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-2/3 bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
          <h2 className="text-2xl font-semibold border-b pb-2">Delivery Details</h2>
          
          {error && <div className="p-4 bg-red-50 text-red-700 rounded-md border border-red-200 font-medium">{error}</div>}
          
          <div className="space-y-2">
            <label htmlFor="shippingAddress" className="block text-sm font-medium text-gray-700">Shipping Address</label>
            <textarea
              id="shippingAddress"
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              rows={4}
              required
              className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter full shipping address..."
              disabled={isProcessing}
            />
          </div>

          <h2 className="text-2xl font-semibold border-b pb-2 pt-4">Payment Method</h2>
          <p className="text-gray-600 bg-blue-50 p-4 rounded-md border border-blue-100">
             Deducted from **Dropshipper Wallet**. Current Total: **RM {(cart.grand_total || 0).toFixed(2)}**
          </p>
        </div>

        <div className="lg:w-1/3">
          <div className="bg-gray-50 p-6 rounded-lg shadow border border-gray-200 sticky top-4">
            <h2 className="text-xl font-bold mb-4 border-b pb-2">Order Summary</h2>
            
            <div className="max-h-60 overflow-y-auto mb-4 border-b pb-4 space-y-3">
                {cart.items.map((item) => (
                // ✅ FIX: Added unique 'key' prop using item.product_id
                <div key={item.product_id} className="flex justify-between text-sm text-gray-700">
                    <span className="truncate pr-4 flex-1">{item.product_name} x {item.quantity}</span>
                    <span className="font-medium whitespace-nowrap">RM {(item.lineTotal || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-xl font-extrabold text-green-600">
                  <span>Grand Total:</span>
                  <span>RM {(cart.grand_total || 0).toFixed(2)}</span>
              </div>

              <button 
                type="submit"
                disabled={isProcessing || cart.total_items === 0}
                className="w-full bg-indigo-600 text-white py-3 rounded-md hover:bg-indigo-700 font-bold shadow transition-transform active:scale-95 disabled:opacity-50"
              >
                {isProcessing ? 'Processing Order...' : `Place Order Now`}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default CheckoutPage;