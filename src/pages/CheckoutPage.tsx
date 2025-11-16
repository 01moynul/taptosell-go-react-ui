// src/pages/CheckoutPage.tsx
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { fetchCart, processCheckout, type CartResponse } from '../services/cartService';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function CheckoutPage() {
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [shippingAddress, setShippingAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  
  const auth = useAuth();
  const navigate = useNavigate();

  const isDropshipper = auth.user?.role === 'dropshipper';

  // 1. Fetch Cart Data
  const loadCart = useCallback(async () => {
    if (!auth.token || !isDropshipper) {
      setError('You must be a logged-in Dropshipper to checkout.');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const data = await fetchCart();
      
      // If cart is empty, redirect user back to catalog
      if (data.items.length === 0) {
        navigate('/catalog', { state: { message: 'Cannot checkout with an empty cart.' } });
        return;
      }
      setCart(data);
    } catch (err) {
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
  
  // 2. Process Checkout
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

      // Success logic: Navigate based on order status
      if (response.status === 'processing') {
        // Payment successful (wallet balance was sufficient)
        navigate(`/orders/${response.order_id}/success`, { state: { message: 'Your order was placed successfully!' } });
      } else if (response.status === 'on-hold') {
        // Payment pending (wallet balance was insufficient)
        navigate(`/orders/${response.order_id}/on-hold`, { state: { message: 'Order placed, but payment is on-hold due to insufficient wallet balance.', onHold: true } });
      }

    } catch (err) {
      const msg = axios.isAxiosError(err) && err.response?.data?.message
        ? err.response.data.message
        : 'Checkout failed. Please check your wallet balance and try again.';
      setError(`Error: ${msg}`);
    } finally {
      setIsProcessing(false);
    }
  };


  // --- Rendering Logic ---

  if (loading) return <h1 className="text-xl font-bold">Loading Checkout Summary...</h1>;
  if (error && !cart) return <h1 className="text-xl text-red-600">{error}</h1>;
  if (!cart) return null; // Should be handled by loading or error states

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>

      <form onSubmit={handleCheckout} className="flex flex-col lg:flex-row gap-8">
        {/* Shipping & Payment (Left Side) */}
        <div className="lg:w-2/3 bg-white p-6 rounded-lg shadow-md space-y-6">
          <h2 className="text-2xl font-semibold border-b pb-2">Delivery Details</h2>
          
          {error && <p className="text-red-600 font-medium bg-red-100 p-3 rounded">{error}</p>}
          
          <div className="space-y-4">
            <label htmlFor="shippingAddress" className="block text-sm font-medium text-gray-700">Shipping Address</label>
            <textarea
              id="shippingAddress"
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              rows={4}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-green-500 focus:border-green-500"
              placeholder="Enter full shipping address here..."
              disabled={isProcessing}
            />
          </div>

          <h2 className="text-2xl font-semibold border-b pb-2 pt-4">Payment Method (Wallet)</h2>
          <p className="text-gray-600">
            Payment will be deducted automatically from your Dropshipper Wallet. If funds are insufficient, your order will be placed on **Hold**.
          </p>
        </div>

        {/* Order Summary (Right Side) */}
        <div className="lg:w-1/3">
          <div className="bg-gray-50 p-6 rounded-lg shadow-lg sticky top-4">
            <h2 className="text-xl font-bold mb-4 border-b pb-2">Order Summary ({cart.total_items} Items)</h2>
            
            {/* Item List Summary */}
            <div className="max-h-60 overflow-y-auto mb-4 border-b pb-4 space-y-2">
                {cart.items.map(item => (
                    <div key={item.product_id} className="flex justify-between text-sm text-gray-700">
                        <span className="truncate pr-2">{item.product_name} x {item.quantity}</span>
                        <span>RM {item.subtotal.toFixed(2)}</span>
                    </div>
                ))}
            </div>

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-lg font-semibold border-t pt-2">
                <span>Total Cost:</span>
                <span>RM {cart.subtotal.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="text-2xl font-extrabold text-green-600 mt-4 pt-4 border-t-2 border-green-200">
                <div className="flex justify-between">
                    <span>Grand Total:</span>
                    <span>RM {cart.grand_total.toFixed(2)}</span>
                </div>
            </div>

            <button 
              type="submit"
              className="w-full mt-6 bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 font-semibold transition duration-200 disabled:bg-blue-400"
              disabled={isProcessing || cart.grand_total === 0}
            >
              {isProcessing ? 'Processing Order...' : `Place Order (RM ${cart.grand_total.toFixed(2)})`}
            </button>
            <p className="text-center text-sm text-gray-500 mt-2">
                You will be charged RM {cart.grand_total.toFixed(2)} from your wallet.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}

export default CheckoutPage;