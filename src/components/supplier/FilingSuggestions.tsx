// src/components/supplier/FilingSuggestions.tsx
import React, { useMemo } from 'react';
import type { ProductFormData } from './ProductForm';

interface FilingSuggestionsProps {
  data: ProductFormData;
}

const FilingSuggestions: React.FC<FilingSuggestionsProps> = ({ data }) => {

  // --- 1. Re-implement the Logic from your old file ---
  const suggestions = useMemo(() => [
    {
      id: 'name',
      text: 'Product Name (min 10 chars)',
      isComplete: (data.name || '').trim().length > 10,
    },
    {
      id: 'category',
      text: 'Category selected',
      isComplete: (data.category || '') !== '',
    },
    {
      id: 'description',
      text: 'Description (min 50 chars)',
      isComplete: (data.description || '').trim().length > 50,
    },
    {
      id: 'price',
      text: 'Price is set',
      isComplete: data.price > 0,
    },
    {
      id: 'stock',
      text: 'Stock is set',
      isComplete: data.stock > 0,
    },
    {
      id: 'weight',
      text: 'Weight is set',
      isComplete: data.weight > 0,
    },
    {
      id: 'dimensions',
      text: 'Package Dimensions set',
      isComplete: data.pkg_length > 0 && data.pkg_width > 0 && data.pkg_height > 0,
    },
  ], [data]);

  // --- 2. Calculate Score ---
  const completedCount = suggestions.filter(s => s.isComplete).length;
  const totalCount = suggestions.length;
  const score = Math.round((completedCount / totalCount) * 100);

  // --- 3. Determine Color based on Score ---
  const getScoreColor = () => {
    if (score < 30) return 'bg-red-500';
    if (score < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="bg-white p-5 rounded shadow border border-gray-200">
      <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
        Listing Quality
      </h2>

      {/* Score Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-end mb-1">
          <span className="text-sm font-medium text-gray-600">Completion Score</span>
          <span className="text-lg font-bold text-blue-600">{score}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className={`h-2.5 rounded-full transition-all duration-500 ${getScoreColor()}`} 
            style={{ width: `${score}%` }}
          ></div>
        </div>
      </div>

      {/* Suggestions List */}
      <ul className="space-y-3">
        {suggestions.map((item) => (
          <li key={item.id} className="flex items-start text-sm">
            <span className="mr-2.5 flex-shrink-0 text-base">
              {item.isComplete ? '✅' : '⬜'}
            </span>
            <span className={`${item.isComplete ? 'text-gray-400 line-through decoration-gray-400' : 'text-gray-700'}`}>
              {item.text}
            </span>
          </li>
        ))}
      </ul>

      {/* Static Tips (Ported from old file) */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Pro Tips</h3>
        <p className="text-xs text-gray-500 mb-2">
          • <strong>Variations:</strong> Adding 2 tiers (e.g. Size + Color) generates a combined stock table.
        </p>
        <p className="text-xs text-gray-500">
          • <strong>Images:</strong> Use high-quality 3:4 aspect ratio images.
        </p>
      </div>
    </div>
  );
};

export default FilingSuggestions;