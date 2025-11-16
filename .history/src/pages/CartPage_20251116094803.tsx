// src/pages/CartPage.tsx
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { fetchCart, updateCartItem, removeFromCart, CartResponse, CartItem } from '../services/cartService';
import { Link } from 'react-router-dom'; // Assuming you use react-router-dom for navigation
import axios from 'axios';

function CartPage() {
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const auth = useAuth();
  
  const isDropshipper = auth.user?.role === 'dropshipper';

  // Function to load the cart data
  const loadCart = useCallback(async () => {
    if (!auth.token || !isDropshipper) {
      setError('You must be a logged-in Dropshipper to view the cart.');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const data = await fetchCart();
      setCart(data);
    } catch (err) {
      const msg = axios.isAxiosError(err) && err.response?.data?.message
        ? err.response.data.message
        : 'Failed to load cart. Please try logging in again.';
      setError(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, [auth.token, isDropshipper]); // Re-run if token or role changes

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  // Handler for quantity change
  const handleUpdateQuantity = async (item: CartItem, newQuantity: number) => {
    if (newQuantity < 1 || isUpdating) return;
    
    setIsUpdating(true);
    try {
      // 1. Call the API to update the quantity
      await updateCartItem(item.product_id, newQuantity);
      
      // 2. Reload the entire cart to get the new calculated totals from the backend
      await loadCart();

    } catch (err) {
      const msg = axios.isAxiosError(err) && err.response?.data?.message
        ? err.response.data.message
        : 'Failed to update quantity.';
      alert(`Update Error: ${msg}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handler for item removal
  const handleRemoveItem = async (productId: number, productName: string) => {
    if (!window.confirm(`Are you sure you want to remove "${productName}" from your cart?`)) {
      return;
    }

    setIsUpdating(true);
    try {
      // 1. Call the API to remove the item
      await removeFromCart(productId);

      // 2. Reload the cart
      await loadCart();

    } catch (err) {
      const msg = axios.isAxiosError(err) && err.response?.data?.message
        ? err.response.data.message
        : 'Failed to remove item.';
      alert(`Removal Error: ${msg}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // --- Rendering Logic ---

  if (loading) return <h1 className="text-xl font-bold">Loading Cart...</h1>;
  if (error) return <h1 className="text-xl text-red-600">{error}</h1>;
  if (!cart || cart.items.length === 0) {
    return (
      <div className="p-6 bg-white shadow-md rounded-lg">
        <h1 className="text-2xl font-semibold mb-4">Your Shopping Cart</h1>
        <p className="text-gray-600">Your cart is currently empty. Start browsing the <Link to="/catalog" className="text-blue-500 hover:underline">Product Catalog</Link> to find items.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Your Shopping Cart</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart Items List */}
        <div className="lg:w-3/4">
          <div className="space-y-4">
            {cart.items.map((item) => (
              <div key={item.product_id} className="p-4 border rounded-lg flex items-center justify-between shadow-sm bg-white">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold">{item.product_name}</h3>
                  <p className="text-sm text-gray-500">Your Cost: RM {item.unit_price.toFixed(2)}</p>
                </div>

                <div className="flex items-center space-x-4">
                  {/* Quantity Control */}
                  <div className="flex items-center border rounded">
                    <button 
                      onClick={() => handleUpdateQuantity(item, item.quantity - 1)}
                      disabled={isUpdating || item.quantity === 1}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                    >
                      -
                    </button>
                    <input 
                      type="number" 
                      value={item.quantity}
                      onChange={(e) => handleUpdateQuantity(item, parseInt(e.target.value) || 1)}
                      min="1"
                      className="w-16 text-center border-x outline-none"
                      disabled={isUpdating}
                    />
                    <button 
                      onClick={() => handleUpdateQuantity(item, item.quantity + 1)}
                      disabled={isUpdating}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>

                  {/* Subtotal */}
                  <div className="min-w-[100px] text-right">
                    <span className="text-lg font-bold">RM {item.subtotal.toFixed(2)}</span>
                  </div>

                  {/* Remove Button */}
                  <button 
                    onClick={() => handleRemoveItem(item.product_id, item.product_name)}
                    disabled={isUpdating}
                    className="text-red-500 hover:text-red-700 disabled:opacity-50"
                    aria-label={`Remove ${item.product_name}`}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cart Summary */}
        <div className="lg:w-1/4">
          <div className="bg-gray-50 p-6 rounded-lg shadow-lg sticky top-4">
            <h2 className="text-xl font-bold mb-4 border-b pb-2">Cart Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Items:</span>
                <span className="font-medium">{cart.total_items}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold border-t pt-2">
                <span>Subtotal:</span>
                <span>RM {cart.subtotal.toFixed(2)}</span>
              </div>
              {/* Note: Tax/Shipping will be calculated later in Checkout */}
            </div>
            
            <div className="text-2xl font-extrabold text-green-600 mt-4 pt-4 border-t-2 border-green-200">
                <div className="flex justify-between">
                    <span>Grand Total:</span>
                    <span>RM {cart.grand_total.toFixed(2)}</span>
                </div>
            </div>

            <Link to="/checkout">
              <button 
                className="w-full mt-6 bg-green-500 text-white py-3 rounded-md hover:bg-green-600 font-semibold transition duration-200"
                disabled={isUpdating}
              >
                Proceed to Checkout
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartPage;