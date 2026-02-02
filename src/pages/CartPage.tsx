// src/pages/CartPage.tsx
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { fetchCart, updateCartItem, removeFromCart } from '../services/cartService';
import type { CartResponse } from '../services/cartService';
import { Link } from 'react-router-dom';
import axios from 'axios';

interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  lineTotal: number;
  stock: number;
  // [NEW] To display "Color: Red"
  options?: { name: string; value: string }[]; 
}

function CartPage() {
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const auth = useAuth();
  
  const isDropshipper = auth.user?.role === 'dropshipper';

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
      console.error("Failed to load cart:", err);
      const msg = axios.isAxiosError(err) && err.response?.data?.message
        ? err.response.data.message
        : 'Failed to load cart.';
      setError(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, [auth.token, isDropshipper]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const handleUpdateQuantity = async (item: CartItem, newQuantity: number) => {
    if (newQuantity < 1 || isUpdating) return;
    setIsUpdating(true);
    try {
      await updateCartItem(item.productId, newQuantity);
      await loadCart();
    } catch (err) {
      console.error("Update quantity failed:", err);
      alert("Failed to update quantity.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveItem = async (productId: number, productName: string) => {
    if (!window.confirm(`Remove "${productName}"?`)) return;
    setIsUpdating(true);
    try {
      await removeFromCart(productId);
      await loadCart();
    } catch (err) {
      console.error("Remove item failed:", err);
      alert("Failed to remove item.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) return <div className="p-8 text-center font-bold animate-pulse">Loading Cart...</div>;
  if (error) return <div className="p-8 text-center text-red-600 font-bold">{error}</div>;
  
  const items = (cart?.items as unknown as CartItem[]) || [];

  if (items.length === 0) {
    return (
      <div className="p-10 text-center bg-white shadow-md rounded-lg max-w-4xl mx-auto mt-10">
        <h1 className="text-2xl font-semibold mb-4">Your Shopping Cart</h1>
        <p className="text-gray-500 mb-6">Your cart is currently empty.</p>
        <Link to="/catalog" className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700">
          Go Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Your Shopping Cart</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-3/4 space-y-4">
          {items.map((item, idx) => (
            <div key={`${item.productId}-${idx}`} className="p-4 border rounded-lg flex flex-col sm:flex-row items-center justify-between shadow-sm bg-white gap-4">
              
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-lg font-bold text-gray-800">{item.name}</h3>
                
                {/* [NEW] Display Variant Options (e.g. Size: M) */}
                {item.options && item.options.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1 justify-center sm:justify-start">
                    {item.options.map((opt, i) => (
                      <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded border">
                        {opt.name}: {opt.value}
                      </span>
                    ))}
                  </div>
                )}
                
                <p className="text-sm text-gray-500 mt-1">Unit Cost: RM {(item.price || 0).toFixed(2)}</p>
              </div>

              <div className="flex items-center space-x-6">
                <div className="flex items-center border rounded overflow-hidden">
                  <button onClick={() => handleUpdateQuantity(item, item.quantity - 1)} className="px-3 py-1 bg-gray-100 hover:bg-gray-200">-</button>
                  <span className="px-4 py-1 font-medium">{item.quantity}</span>
                  <button onClick={() => handleUpdateQuantity(item, item.quantity + 1)} className="px-3 py-1 bg-gray-100 hover:bg-gray-200">+</button>
                </div>

                <div className="min-w-[100px] text-right">
                  <span className="text-lg font-bold text-indigo-600">RM {(item.lineTotal || 0).toFixed(2)}</span>
                </div>

                <button onClick={() => handleRemoveItem(item.productId, item.name)} className="text-red-500 hover:text-red-700 font-medium text-sm">Remove</button>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:w-1/4">
          <div className="bg-gray-50 p-6 rounded-lg shadow border border-gray-200 sticky top-4">
            <h2 className="text-xl font-bold mb-4 border-b pb-2">Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Items:</span>
                <span className="font-medium">{cart?.total_items || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-bold text-xl text-indigo-600">RM {(cart?.subtotal || 0).toFixed(2)}</span>
              </div>
              <Link to="/checkout" className="block w-full mt-4">
                <button className="w-full bg-green-600 text-white py-3 rounded-md hover:bg-green-700 font-bold shadow-lg transition-transform active:scale-95">
                  Proceed to Checkout
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartPage;