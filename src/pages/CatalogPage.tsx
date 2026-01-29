// src/pages/CatalogPage.tsx
import { useEffect, useState } from 'react';
import apiClient from '../services/api';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { addToCart } from '../services/cartService';

interface Product {
  id: number;
  name: string;
  price: number;     // Matches `json:"price"` in Go
  srp: number;       // Matches `json:"srp"` in Go
  stock: number;     // Matches `json:"stock"` in Go
}

function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const auth = useAuth();
  const isDropshipper = auth.user?.role === 'dropshipper';
  const [statusMessage, setStatusMessage] = useState<string>('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await apiClient.get<{ products: Product[] }>('/products/search');
        // FIX: Ensure we default to [] if backend returns null
        setProducts(response.data.products || []); 
      } catch (err) {
        if (axios.isAxiosError(err) && err.response) {
          setError(err.response.data.message || 'Failed to load product catalog.');
        } else {
          setError('An unexpected network error occurred.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleAddToCart = async (productId: number, productName: string) => {
    if (!auth.token || !isDropshipper) {
      setStatusMessage('Error: You must be a logged-in Dropshipper to add items to the cart.');
      return;
    }

    try {
      await addToCart(productId, 1);
      setStatusMessage(`Success: Added 1 unit of "${productName}" to your cart!`);
    } catch (err) {
      const msg = axios.isAxiosError(err) && err.response?.data?.message 
        ? err.response.data.message 
        : `Failed to add "${productName}" to cart.`;
      setStatusMessage(`Error: ${msg}`);
    } finally {
      setTimeout(() => setStatusMessage(''), 5000);
    }
  };

  if (loading) return <div className="p-8 text-center text-xl">Loading Product Catalog...</div>;
  if (error) return <div className="p-8 text-center text-red-600 font-bold">Error: {error}</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Product Catalog ({products.length} Items)</h1>
      
      {/* Status Messages */}
      {statusMessage && (
        <div className={`p-4 mb-6 rounded ${statusMessage.startsWith('Error') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
          {statusMessage}
        </div>
      )}

      {products.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <p className="text-gray-500">No products found. Suppliers need to publish products first.</p>
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {products.map(product => (
              <div key={product.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-between">
                <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">{product.name}</h3>
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-gray-500 text-sm">Dropshipper Cost:</span>
                        <span className="text-indigo-600 font-bold text-lg"> RM {(product.price || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-gray-500 text-sm">Stock:</span>
                        <span className={`font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {product.stock} units
                        </span>
                    </div>
                </div>
                <button 
                  onClick={() => handleAddToCart(product.id, product.name)}
                  disabled={!isDropshipper || product.stock === 0}
                  className={`w-full py-2 px-4 rounded font-medium transition-colors ${
                      !isDropshipper || product.stock === 0 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
              </div>
            ))}
          </div>
      )}
    </div>
  );
}

export default CatalogPage;