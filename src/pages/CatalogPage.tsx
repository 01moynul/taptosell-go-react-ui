import { useEffect, useState } from 'react';
import apiClient from '../services/api';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { addToCart } from '../services/cartService';
import type { Product } from '../types/CoreTypes';
import ProductDetailsModal from '../components/shared/ProductDetailsModal';

function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const auth = useAuth();
  const isDropshipper = auth.user?.role === 'dropshipper';
  const [statusMessage, setStatusMessage] = useState<string>('');

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await apiClient.get<{ products: Product[] }>('/products/search');
        setProducts(response.data.products || []); 
      } catch (err) {
        if (axios.isAxiosError(err) && err.response) {
          setError(err.response.data.message || 'Failed to load product catalog.');
        } else {
            console.error(err);
            setError('An unexpected network error occurred.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // [FIX] Helper to calculate true stock from variants
  const getProductStock = (product: Product): number => {
    if (product.isVariable && product.variants && product.variants.length > 0) {
        // Sum up the stock of all variants (e.g. 1 + 3 + 1 + 1 = 6)
        return product.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
    }
    // Fallback for simple products
    return product.stock || 0;
  };

  const getThumbnail = (product: Product): string | null => {
    if (!product.images) return null;
    let imageUrl = '';

    if (Array.isArray(product.images) && product.images.length > 0) {
        imageUrl = product.images[0];
    }
    else if (typeof product.images === 'string') {
        try {
            const parsed = JSON.parse(product.images);
            if (Array.isArray(parsed) && parsed.length > 0) {
                imageUrl = parsed[0];
            }
        } catch (e) { console.error("Image parse error", e); }
    }

    if (!imageUrl) return null;
    if (imageUrl.startsWith('/')) {
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8080';
        return `${apiBase}${imageUrl}`;
    }
    return imageUrl;
  };

  const handleAddToCartClick = async (product: Product) => {
    if (!auth.token || !isDropshipper) {
      setStatusMessage('Error: You must be a logged-in Dropshipper.');
      return;
    }

    if (product.isVariable) {
        setSelectedProduct(product);
        setIsModalOpen(true);
        return;
    }

    try {
      await addToCart(product.id, 1);
      setStatusMessage(`Success: Added "${product.name}" to cart!`);
    } catch (err: unknown) {
        // Safe error handling
        interface ApiError { response?: { data?: { message?: string } } }
        const apiError = err as ApiError;
        const msg = apiError.response?.data?.message || 'Failed to add to cart.';
        setStatusMessage(`Error: ${msg}`);
    } finally {
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  if (loading) return <div className="p-8 text-center text-xl">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-600 font-bold">Error: {error}</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Product Catalog ({products.length} Items)</h1>
      
      {statusMessage && (
        <div className={`p-4 mb-6 rounded ${statusMessage.startsWith('Error') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
          {statusMessage}
        </div>
      )}

      {products.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <p className="text-gray-500">No products found.</p>
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {products.map(product => {
              const thumb = getThumbnail(product);
              
              const isVar = product.isVariable;
              
              // [FIX] Use calculated stock instead of static parent stock
              const currentStock = getProductStock(product);
              const isOutOfStock = currentStock === 0;
              
              const buttonText = isOutOfStock ? 'Sold Out' : (isVar ? 'Select Options' : 'Add to Cart');
              const buttonClass = (!isDropshipper || isOutOfStock)
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : (isVar ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-green-600 text-white hover:bg-green-700');

              return (
                <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="h-64 w-full bg-gray-100 relative flex items-center justify-center">
                      {thumb ? (
                          <img 
                              src={thumb} 
                              alt={product.name} 
                              className="w-full h-full object-cover"
                          />
                      ) : (
                          <div className="flex flex-col items-center text-gray-400">
                             <span className="text-4xl opacity-30">🖼️</span>
                             <span className="text-sm font-medium mt-2">No Image</span>
                          </div>
                      )}
                      
                      {isVar && (
                          <span className="absolute top-2 right-2 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded shadow">
                              OPTIONS
                          </span>
                      )}
                  </div>

                  <div className="p-4 flex flex-col flex-grow justify-between">
                      <div>
                          <h3 className="text-lg font-semibold text-gray-800 mb-1 line-clamp-2">{product.name}</h3>
                          <div className="flex justify-between items-center mb-4">
                              <span className="text-gray-500 text-sm">Dropshipper Price:</span>
                              <span className="text-indigo-600 font-bold text-lg"> RM {(product.price || 0).toFixed(2)}</span>
                          </div>
                      </div>
                      
                      <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-100">
                          {/* [FIX] Display calculated stock */}
                          <span className={`text-sm font-medium ${currentStock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {currentStock > 0 ? `${currentStock} in stock` : 'Out of Stock'}
                          </span>
                          
                          <button 
                            onClick={() => handleAddToCartClick(product)}
                            disabled={!isDropshipper || isOutOfStock}
                            className={`py-2 px-4 rounded text-sm font-medium transition-colors ${buttonClass}`}
                          >
                            {buttonText}
                          </button>
                      </div>
                  </div>
                </div>
              );
            })}
          </div>
      )}

      <ProductDetailsModal 
        key={selectedProduct ? selectedProduct.id : 'init'} 
        product={selectedProduct} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}

export default CatalogPage;