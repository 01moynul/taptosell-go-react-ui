import React, { useState, useEffect, useMemo } from 'react';
import { X, ShoppingCart } from 'lucide-react'; 
// [Fix 1] Use 'import type' for interfaces
import type { Product, ProductVariant, ProductVariantOption } from '../../types/CoreTypes';
import { useAuth } from '../../hooks/useAuth';

// [Fix 2] Import everything as an object to fix "no exported member" error
import * as cartService from '../../services/cartService'; 

import toast from 'react-hot-toast';

interface ProductDetailsModalProps {
  product: Product | null; // Allow null
  isOpen: boolean;
  onClose: () => void;
}

const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({ product, isOpen, onClose }) => {
  const { token, user } = useAuth();
  const isDropshipper = user?.role === 'dropshipper';

  // --- Image Handling ---
  const [activeImage, setActiveImage] = useState<string>('');
  
  // --- Variation State ---
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [currentVariant, setCurrentVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  // Initialize Image safely on open
  useEffect(() => {
    // [Fix 3] Null Check: If product is missing, do nothing
    if (!product || !isOpen) return;

    if (product.images) {
      let imgs: string[] = [];
      // Handle potential JSON string from backend
      if (Array.isArray(product.images)) {
        imgs = product.images;
      } else if (typeof product.images === 'string') {
        try {
          imgs = JSON.parse(product.images);
        } catch (e) {
          console.error("Failed to parse product images:", e);
          imgs = [];
        }
      }
      if (imgs.length > 0) setActiveImage(imgs[0]);
    }
    // Reset state
    setSelectedOptions({});
    setCurrentVariant(null);
    setQuantity(1);
  }, [isOpen, product]);

  // --- 1. CALCULATE TOTAL STOCK (Fix for "Accumulated Stock") ---
  const totalStock = useMemo(() => {
    // [Fix 3] Null Check: Prevent crash if product is null
    if (!product) return 0;

    if (product.isVariable && product.variants && product.variants.length > 0) {
      // Sum up the stock of ALL variants (e.g. 1 + 3 + 1 + 1 = 6)
      return product.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
    }
    // Fallback for simple products
    return product.stock || 0;
  }, [product]);

  // --- Helper: Extract Variation Groups (Color, Size) safely ---
  const getVariationGroups = () => {
    if (!product || !product.variants) return {}; // Null check
    const groups: Record<string, Set<string>> = {};

    product.variants.forEach((v) => {
      let opts: ProductVariantOption[] = [];
      
      // Robust parsing for options (can be object or string)
      if (typeof v.options === 'string') {
        try {
          opts = JSON.parse(v.options);
        } catch (e) { 
            console.error("Error parsing variant options:", e);
            return; 
        }
      } else if (Array.isArray(v.options)) {
          opts = v.options;
      }

      if (Array.isArray(opts)) {
        opts.forEach((opt) => {
          if (!groups[opt.name]) groups[opt.name] = new Set();
          groups[opt.name].add(opt.value);
        });
      }
    });
    return groups;
  };

  const variationGroups = getVariationGroups();

  // --- Handle Option Click & Image Swap ---
  const handleOptionSelect = (groupName: string, value: string) => {
    if (!product) return; // Null check

    const newOptions = { ...selectedOptions, [groupName]: value };
    setSelectedOptions(newOptions);

    // --- 2. IMAGE SWAPPING LOGIC ---
    // Safely parse variationImages map
    let varImages: Record<string, string> = {};
    if (product.variationImages) {
        if (typeof product.variationImages === 'string') {
            try {
                varImages = JSON.parse(product.variationImages);
            } catch (e) {
                console.error("Error parsing variationImages:", e);
            }
        } else {
            varImages = product.variationImages as Record<string, string>;
        }
    }

    // Check if the selected value (e.g. "Choklet") has a specific image
    if (varImages && varImages[value]) {
        setActiveImage(varImages[value]);
    }

    // --- Find Matching Variant ---
    if (product.variants) {
      const found = product.variants.find((v) => {
        let vOpts: ProductVariantOption[] = [];
        if (typeof v.options === 'string') {
          try { vOpts = JSON.parse(v.options); } catch (e) { console.error(e); return false; }
        } else if (Array.isArray(v.options)) {
            vOpts = v.options;
        }
        
        // Check if this variant matches ALL selected options
        if (Array.isArray(vOpts)) {
          return vOpts.every((opt) => newOptions[opt.name] === opt.value);
        }
        return false;
      });

      // Only set current variant if ALL groups are selected
      const allGroupsSelected = Object.keys(variationGroups).every(g => newOptions[g]);
      
      if (allGroupsSelected && found) {
        setCurrentVariant(found);
      } else {
        setCurrentVariant(null);
      }
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    if (!token || !isDropshipper) {
      toast.error("Please login as a dropshipper");
      return;
    }

    if (product.isVariable && !currentVariant) {
      toast.error("Please select all options");
      return;
    }

    // Use variant stock if variable, otherwise product stock
    const availableStock = currentVariant ? currentVariant.stock : product.stock;
    if (quantity > availableStock) {
        toast.error(`Only ${availableStock} units available`);
        return;
    }

    setIsAdding(true);
    try {
      await cartService.addToCart(product.id, quantity, currentVariant?.id);
      toast.success("Added to cart");
      onClose();
    } catch (err: unknown) { // [Fix: Recurring Error 3] Avoid 'any'
        // Define local interface for type casting
        interface ApiError {
            response?: {
                data?: {
                    error?: string;
                };
            };
        }
        const apiError = err as ApiError;
        
        // [Fix: Recurring Error 2] Log error to satisfy 'no-unused-vars'
        console.error("Cart API Error:", err);

        const msg = apiError.response?.data?.error || "Failed to add to cart";
        toast.error(msg);
    } finally {
      setIsAdding(false);
    }
  };

  // If closed or no product, render nothing
  if (!isOpen || !product) return null;

  // --- 3. DYNAMIC PRICE & STOCK DISPLAY ---
  const displayPrice = currentVariant ? currentVariant.price : product.price;
  // If variant selected -> Show variant stock. If not -> Show calculated Total Stock.
  const displayStock = currentVariant ? currentVariant.stock : totalStock;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col md:flex-row relative">
        
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 z-10">
          <X size={20} />
        </button>

        {/* Left: Image Gallery */}
        <div className="w-full md:w-1/2 p-6 bg-gray-50 flex flex-col items-center justify-center">
          <div className="w-full h-80 md:h-96 mb-4">
            <img 
              src={activeImage || 'https://via.placeholder.com/400'} 
              alt={product.name} 
              className="w-full h-full object-contain rounded-lg"
            />
          </div>
          {/* Thumbnails */}
          <div className="flex gap-2 overflow-x-auto w-full px-2">
             {/* Main Images */}
             {product.images && (typeof product.images === 'string' ? JSON.parse(product.images) : product.images).map((img: string, idx: number) => (
                <button key={idx} onClick={() => setActiveImage(img)} className={`w-16 h-16 border rounded overflow-hidden flex-shrink-0 ${activeImage === img ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}`}>
                  <img src={img} className="w-full h-full object-cover" />
                </button>
             ))}
          </div>
        </div>

        {/* Right: Details & Options */}
        <div className="w-full md:w-1/2 p-6 flex flex-col">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{product.name}</h2>
          
          <div className="flex items-end gap-3 mb-6">
            <span className="text-3xl font-bold text-blue-600">RM {displayPrice.toFixed(2)}</span>
            {product.srp > displayPrice && (
                <span className="text-sm text-gray-400 line-through mb-1">SRP: RM {product.srp.toFixed(2)}</span>
            )}
          </div>

          {/* Variants */}
          {Object.entries(variationGroups).map(([groupName, values]) => (
            <div key={groupName} className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase mb-2">{groupName}</h3>
              <div className="flex flex-wrap gap-2">
                {Array.from(values as Set<string>).map((val) => {
                  const isSelected = selectedOptions[groupName] === val;
                  return (
                    <button
                      key={val}
                      onClick={() => handleOptionSelect(groupName, val)}
                      className={`px-4 py-2 rounded text-sm font-medium border transition-all
                        ${isSelected 
                          ? 'bg-blue-600 text-white border-blue-600' 
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                        }`}
                    >
                      {val}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="mt-auto pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between mb-4">
               <span className="text-gray-600 font-medium">Quantity</span>
               {/* Stock Display Logic */}
               <div className="text-right">
                   <div className="flex items-center gap-3">
                        <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 rounded bg-gray-100 hover:bg-gray-200 text-gray-600">-</button>
                        <span className="font-semibold w-8 text-center">{quantity}</span>
                        <button onClick={() => setQuantity(Math.min(displayStock, quantity + 1))} className="w-8 h-8 rounded bg-gray-100 hover:bg-gray-200 text-gray-600">+</button>
                   </div>
                   <p className={`text-xs mt-1 ${displayStock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                       {displayStock > 0 ? `${displayStock} units available` : 'Out of Stock'}
                   </p>
               </div>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={displayStock === 0 || isAdding}
              className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 font-bold text-lg transition-colors
                ${displayStock > 0 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
            >
              {isAdding ? 'Adding...' : (
                <>
                  <ShoppingCart size={20} />
                  Add to Cart
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProductDetailsModal;