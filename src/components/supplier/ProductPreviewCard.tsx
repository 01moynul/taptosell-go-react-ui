// src/components/supplier/ProductPreviewCard.tsx
import React from 'react';
import type { ProductFormData } from './ProductForm';

interface ProductPreviewCardProps {
  data: ProductFormData;
}

const ProductPreviewCard: React.FC<ProductPreviewCardProps> = ({ data }) => {
  // Fallback values for display
  const displayTitle = data.name.trim() || "Product Title";
  const displayPrice = data.price > 0 ? data.price.toFixed(2) : "0.00";
  const displayStock = data.stock > 0 ? data.stock : 0;

  return (
    <div className="bg-white p-4 rounded shadow border border-gray-200">
      <p className="text-xs font-bold text-gray-400 uppercase mb-3 tracking-wider">
        Live Mobile Preview
      </p>

      {/* Mobile Card Container */}
      <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white max-w-[280px] mx-auto lg:max-w-none">
        
        {/* Image Placeholder */}
        <div className="h-40 bg-gray-100 flex flex-col items-center justify-center text-gray-300 relative">
           {/* Simple Icon */}
           <svg className="w-10 h-10 mb-1 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
           </svg>
           <span className="text-[10px] uppercase font-semibold opacity-60">Cover Image</span>
           
           {/* Variable Badge */}
           {data.is_variable && (
             <span className="absolute top-2 right-2 bg-purple-100 text-purple-700 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
               VARIANTS
             </span>
           )}
        </div>

        {/* Card Content */}
        <div className="p-3">
           {/* Tags (Brand/Category) */}
           <div className="flex flex-wrap gap-1 mb-2">
             {data.category && (
               <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded border border-blue-100 truncate max-w-[100px]">
                 {data.category}
               </span>
             )}
             {data.brand && (
               <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded border border-gray-200 truncate max-w-[100px]">
                 {data.brand}
               </span>
             )}
           </div>

           {/* Title */}
           <h4 className="font-medium text-gray-900 text-sm leading-snug line-clamp-2 h-10 mb-1">
             {displayTitle}
           </h4>

           {/* Price & Stock Row */}
           <div className="flex justify-between items-end border-t border-gray-50 pt-2 mt-1">
              <div>
                <p className="text-[10px] text-gray-400 mb-0.5">Supplier Price</p>
                <span className="text-blue-600 font-bold text-lg">RM {displayPrice}</span>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-400 mb-0.5">Stock</p>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  data.stock < 10 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}>
                  {displayStock}
                </span>
              </div>
           </div>
        </div>
      </div>

      <div className="mt-4 text-center">
        <p className="text-xs text-gray-400 italic">
          Preview updates automatically.
        </p>
      </div>
    </div>
  );
};

export default ProductPreviewCard;