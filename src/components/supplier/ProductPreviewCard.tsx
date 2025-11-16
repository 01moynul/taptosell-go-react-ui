// src/components/supplier/ProductPreviewCard.tsx
import React from 'react';
import { type ProductPayload } from '../../services/supplierProductService';

interface ProductPreviewProps {
    formData: Partial<ProductPayload>;
}

const ProductPreviewCard: React.FC<ProductPreviewProps> = ({ formData }) => {
    // Determine the price to show (use variation price if available, otherwise simple price)
    const displayPrice = formData.price || 0;
    
    // Placeholder image
    const placeholderImage = 'https://via.placeholder.com/300x300?text=Product+Image';
    
    // Placeholder for product status
    const statusLabel = formData.action === 'submit_for_review' ? 'PENDING' : 'DRAFT';

    return (
        <div className="w-full bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
            <h3 className="text-lg font-bold p-4 bg-gray-50 border-b">Marketplace Preview</h3>
            <div className="p-4">
                <div className="relative">
                    <img className="w-full h-auto object-cover rounded-md" 
                        src={placeholderImage} 
                        alt={formData.name || 'Product Image'} 
                    />
                    <span className={`absolute top-2 right-2 text-xs font-semibold px-2 py-1 rounded ${statusLabel === 'PENDING' ? 'bg-yellow-500 text-white' : 'bg-gray-300'}`}>
                        {statusLabel}
                    </span>
                </div>
                
                <div className="mt-3">
                    <h4 className="text-xl font-bold text-gray-900 truncate">
                        {formData.name || '[Product Title]'}
                    </h4>
                    <p className="text-2xl font-extrabold text-green-600 mt-1">
                        RM {displayPrice.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                        Stock: {formData.stock !== undefined ? formData.stock : '[N/A]'}
                    </p>
                    <button className="w-full mt-4 bg-green-500 text-white py-2 rounded hover:bg-green-600">
                        Buy Now (Placeholder)
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductPreviewCard;