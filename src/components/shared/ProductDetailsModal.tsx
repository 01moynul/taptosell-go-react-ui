// src/components/shared/ProductDetailsModal.tsx
import React, { useState } from 'react';
import type { Product, ProductVariant } from '../../types/CoreTypes';
import { addToCart } from '../../services/cartService';

interface ProductDetailsModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({ product, isOpen, onClose }) => {
  
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [currentVariant, setCurrentVariant] = useState<ProductVariant | null>(null);
  const [statusMsg, setStatusMsg] = useState('');

  // Safe Image Initialization
  const [activeImage, setActiveImage] = useState<string>(() => {
    if (!product || !product.images) return '';
    if (Array.isArray(product.images) && product.images.length > 0) return product.images[0];
    if (typeof product.images === 'string') {
        try {
            const parsed = JSON.parse(product.images);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
        } catch (e) {
            // [FIX] Log error to satisfy linter
            console.error("Failed to parse init image:", e);
        }
    }
    return '';
  });

  if (!isOpen || !product) return null;

  // 1. Extract Variation Groups
  const getVariationGroups = () => {
    if (!product.variants) return {};
    const groups: Record<string, Set<string>> = {};
    
    product.variants.forEach(v => {
      v.options.forEach(opt => {
        if (!groups[opt.name]) groups[opt.name] = new Set();
        groups[opt.name].add(opt.value);
      });
    });
    return groups;
  };

  const variationGroups = getVariationGroups();

  // 2. Handle Option Click
  const handleOptionSelect = (groupName: string, value: string) => {
    const newOptions = { ...selectedOptions, [groupName]: value };
    setSelectedOptions(newOptions);

    // Try to find matching variant
    if (product.variants) {
      const match = product.variants.find(v => 
        v.options.every(o => newOptions[o.name] === o.value) &&
        v.options.length === Object.keys(newOptions).length
      );
      setCurrentVariant(match || null);
    }

    // Check if there is a specific image for this option (e.g. "Red")
    let varImages: Record<string, string> = {};
    
    // [FIX] Handle JSON parsing safely with logging
    if (typeof product.variation_images === 'string') {
        try { 
            varImages = JSON.parse(product.variation_images); 
        } catch (e) {
            console.error("Failed to parse variation images:", e);
        }
    } else if (typeof product.variation_images === 'object') {
        varImages = product.variation_images as Record<string, string>;
    }

    if (varImages && varImages[value]) {
        setActiveImage(varImages[value]);
    }
  };

  // 3. Add To Cart Logic
  const handleAddToCart = async () => {
    if (product.is_variable && !currentVariant) {
        setStatusMsg("Please select all options first.");
        return;
    }

    // Use Variant ID if found, otherwise Product ID
    const idToAdd = currentVariant ? currentVariant.id : product.id; 
    
    try {
        await addToCart(idToAdd, 1); 
        setStatusMsg("Added to cart successfully!");
        setTimeout(onClose, 1000);
    } catch (err) {
        console.error("Cart error:", err);
        setStatusMsg("Failed to add to cart.");
    }
  };

  const displayPrice = currentVariant ? currentVariant.price : product.price;
  const displayStock = currentVariant ? currentVariant.stock : product.stock;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg w-full max-w-2xl overflow-hidden shadow-xl relative flex flex-col md:flex-row max-h-[90vh] md:h-auto animate-fade-in">
        
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-2 right-2 z-10 bg-gray-100 rounded-full p-2 hover:bg-gray-200">
            ✕
        </button>

        {/* Left: Image */}
        <div className="w-full md:w-1/2 bg-gray-100 flex items-center justify-center min-h-[300px]">
            {activeImage ? (
                <img src={activeImage} alt={product.name} className="w-full h-full object-contain" />
            ) : (
                <div className="flex flex-col items-center text-gray-400">
                    <span className="text-4xl">🖼️</span>
                    <span className="text-sm">No Image</span>
                </div>
            )}
        </div>

        {/* Right: Details */}
        <div className="w-full md:w-1/2 p-6 flex flex-col">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{product.name}</h2>
            <div className="text-3xl font-bold text-blue-600 mb-4">RM {displayPrice.toFixed(2)}</div>
            
            {/* Variation Selectors */}
            <div className="flex-grow space-y-4">
                {Object.keys(variationGroups).map(groupName => (
                    <div key={groupName}>
                        <label className="block text-sm font-medium text-gray-700 mb-2 uppercase">{groupName}</label>
                        <div className="flex flex-wrap gap-2">
                            {Array.from(variationGroups[groupName]).map(val => (
                                <button
                                    key={val}
                                    onClick={() => handleOptionSelect(groupName, val)}
                                    className={`px-4 py-2 text-sm border rounded hover:border-blue-500 transition-colors ${
                                        selectedOptions[groupName] === val 
                                        ? 'bg-blue-600 text-white border-blue-600' 
                                        : 'bg-white text-gray-700 border-gray-300'
                                    }`}
                                >
                                    {val}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Stock & Add Button */}
            <div className="mt-8 pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-500">Stock Availability:</span>
                    <span className={`font-bold ${displayStock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {displayStock > 0 ? `${displayStock} units` : 'Out of Stock'}
                    </span>
                </div>

                {statusMsg && <div className="mb-2 text-center text-sm font-semibold text-blue-600">{statusMsg}</div>}

                <button 
                    onClick={handleAddToCart}
                    disabled={displayStock === 0 || (product.is_variable && !currentVariant)}
                    className={`w-full py-3 rounded font-bold text-lg transition-all ${
                        displayStock === 0 || (product.is_variable && !currentVariant)
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
                    }`}
                >
                    {displayStock === 0 ? 'Sold Out' : 'Add to Cart'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsModal;