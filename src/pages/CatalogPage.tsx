// src/pages/CatalogPage.tsx
import { useEffect, useState } from 'react';
import apiClient from '../services/api';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth'; // 1. Import useAuth
import { addToCart } from '../services/cartService'; // 2. Import cart service

// Define the shape of a single product based on the Go models
interface Product {
  id: number;
  name: string;
  price: number; // Supplier Price
  tts_price: number; // TapToSell Price (Supplier Price + Commission)
  stock: number;
  // Add other required fields later (image, description, etc.)
}

function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const auth = useAuth(); // 3. Use the auth hook
  const isDropshipper = auth.user?.role === 'dropshipper';
  const [statusMessage, setStatusMessage] = useState<string>('');


  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // API Blueprint: GET /v1/products/search (public endpoint)
        const response = await apiClient.get<{ products: Product[] }>('/products/search');
        setProducts(response.data.products);
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
  }, []); // Run only once on component mount

  // --- NEW HANDLER FUNCTION ---
  const handleAddToCart = async (productId: number, productName: string) => {
    if (!auth.token || !isDropshipper) {
      setStatusMessage('Error: You must be a logged-in Dropshipper to add items to the cart.');
      return;
    }

    try {
      await addToCart(productId, 1); // Add 1 unit
      setStatusMessage(`Success: Added 1 unit of "${productName}" to your cart!`);
    } catch (err) {
      const msg = axios.isAxiosError(err) && err.response?.data?.message 
        ? err.response.data.message 
        : `Failed to add "${productName}" to cart.`;
      setStatusMessage(`Error: ${msg}`);
    } finally {
      // Clear status message after 5 seconds
      setTimeout(() => setStatusMessage(''), 5000);
    }
  };
  // --- END NEW HANDLER FUNCTION ---

  if (loading) {
    return <h1>Loading Product Catalog...</h1>;
  }

  if (error) {
    return <h1 style={{ color: 'red' }}>Error: {error}</h1>;
  }

  return (
    <div>
      <h1>Product Catalog ({products.length} Items)</h1>
      <p>This page shows all published products from our marketplace.</p>
      
      {/* Role-based warning */}
      {!auth.token && <p style={{ color: 'orange' }}>**Please log in as a Dropshipper to use the cart.**</p>}
      {auth.token && !isDropshipper && <p style={{ color: 'red' }}>**Only Dropshippers can use the cart. Your role is: {auth.user?.role}.**</p>}

      {/* Status Message Display */}
      {statusMessage && (
        <div style={{ padding: '10px', backgroundColor: statusMessage.startsWith('Error') ? '#fdd' : '#dfd', border: statusMessage.startsWith('Error') ? '1px solid red' : '1px solid green', marginBottom: '20px' }}>
          {statusMessage}
        </div>
      )}

      {/* Product Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        {products.map(product => (
          <div key={product.id} style={{ border: '1px solid #ccc', padding: '15px' }}>
            <h3>{product.name}</h3>
            <p>Price (Dropshipper Cost): **RM {product.tts_price.toFixed(2)}**</p>
            <p>Stock: {product.stock}</p>
            <button 
              onClick={() => handleAddToCart(product.id, product.name)}
              disabled={!isDropshipper || product.stock === 0} // Disable if not Dropshipper or out of stock
            >
              {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CatalogPage;