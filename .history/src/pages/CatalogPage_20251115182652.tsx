// src/pages/CatalogPage.tsx
import { useEffect, useState } from 'react';
import apiClient from '../services/api';
import axios from 'axios';
// import { useAuth } from '../hooks/useAuth'; // We will use this later for context

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
  
  // const auth = useAuth(); // Ready to use the user's role/token

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
      
      {/* Product Grid Placeholder */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        {products.map(product => (
          <div key={product.id} style={{ border: '1px solid #ccc', padding: '15px' }}>
            <h3>{product.name}</h3>
            <p>Price (Dropshipper Cost): **RM {product.tts_price.toFixed(2)}**</p>
            <p>Stock: {product.stock}</p>
            <button>Add to Cart</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CatalogPage;