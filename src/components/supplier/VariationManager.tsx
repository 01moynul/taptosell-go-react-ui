import React, { useState, useEffect } from 'react';
import { uploadService } from '../../services/uploadService';

// --- Types ---
export interface VariationGroup {
  id: string;
  name: string;
  options: string[];
}

export interface VariationOption {
  id: string;
  option1: string; 
  option2?: string; 
  price: number;
  stock: number;
  sku: string;
}

// NEW: Size Chart Type Definition
export interface SizeChartData {
  type: 'template' | 'image';
  url?: string;
  templateId?: string;
}

interface VariationManagerProps {
  groups: VariationGroup[];
  options: VariationOption[];
  variationImages: Record<string, string>; 
  // NEW PROPS
  sizeChart: SizeChartData | null;
  onSizeChartChange: (data: SizeChartData | null) => void;
  
  onChange: (groups: VariationGroup[], options: VariationOption[], images: Record<string, string>) => void;
}

const VariationManager: React.FC<VariationManagerProps> = ({ 
  groups, 
  options, 
  variationImages, 
  sizeChart, 
  onSizeChartChange, 
  onChange 
}) => {
  
  const [bulkPrice, setBulkPrice] = useState('');
  const [bulkStock, setBulkStock] = useState('');
  const [bulkSku, setBulkSku] = useState('');
  const [newOptionInputs, setNewOptionInputs] = useState<string[]>(['', '']); 

  // Logic to detect if we need a Size Chart
  const hasSizeVariation = groups.some(g => g.name.toLowerCase() === 'size');

  // --- Matrix Generation ---
  useEffect(() => {
    if (groups.length === 0) return;

    const group1 = groups[0];
    const group2 = groups[1];
    
    if (group1.options.length === 0) {
        if (options.length > 0) onChange(groups, [], variationImages);
        return;
    }

    let newOptions: VariationOption[] = [];

    if (!group2) {
      newOptions = group1.options.map(opt1 => {
        const existing = options.find(o => o.option1 === opt1 && !o.option2);
        return existing || { id: opt1, option1: opt1, price: 0, stock: 0, sku: '' };
      });
    } 
    else if (group2 && group2.options.length > 0) {
      group1.options.forEach(opt1 => {
        group2.options.forEach(opt2 => {
          const id = `${opt1}-${opt2}`;
          const existing = options.find(o => o.id === id);
          newOptions.push(existing || { id, option1: opt1, option2: opt2, price: 0, stock: 0, sku: '' });
        });
      });
    }
    else if (group2) {
        newOptions = [];
    }

    if (JSON.stringify(newOptions) !== JSON.stringify(options)) {
      onChange(groups, newOptions, variationImages);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups]); 

  // --- Handlers ---
  const handleAddGroup = () => {
    if (groups.length < 2) {
      const newGroups = [...groups, { id: Date.now().toString(), name: groups.length === 0 ? 'Color' : 'Size', options: [] }];
      onChange(newGroups, options, variationImages);
    }
  };

  const handleRemoveGroup = (index: number) => {
    const newGroups = groups.filter((_, i) => i !== index);
    onChange(newGroups, [], {}); 
  };

  const handleGroupNameChange = (index: number, val: string) => {
    const newGroups = [...groups];
    newGroups[index].name = val;
    onChange(newGroups, options, variationImages);
  };

  const handleAddOption = (groupIndex: number) => {
    const val = newOptionInputs[groupIndex].trim();
    if (!val) return;
    
    const newGroups = [...groups];
    if (newGroups[groupIndex].options.includes(val)) {
        alert("Option already exists!");
        return;
    }
    newGroups[groupIndex].options.push(val);
    
    const newInputs = [...newOptionInputs];
    newInputs[groupIndex] = '';
    setNewOptionInputs(newInputs);

    onChange(newGroups, options, variationImages);
  };

  const handleRemoveOption = (groupIndex: number, optionName: string) => {
    const newGroups = [...groups];
    newGroups[groupIndex].options = newGroups[groupIndex].options.filter(o => o !== optionName);
    
    const newImages = { ...variationImages };
    if (groupIndex === 0) {
        delete newImages[optionName];
    }
    
    onChange(newGroups, options, newImages);
  };

  const handleTableChange = (index: number, field: keyof VariationOption, value: string | number) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    onChange(groups, newOptions, variationImages);
  };

  const handleBulkApply = () => {
    const newOptions = options.map(opt => ({
      ...opt,
      price: bulkPrice ? parseFloat(bulkPrice) : opt.price,
      stock: bulkStock ? parseInt(bulkStock) : opt.stock,
      sku: bulkSku ? bulkSku : opt.sku,
    }));
    onChange(groups, newOptions, variationImages);
  };

  const handleImageUpload = async (optionName: string, file: File) => {
    try {
      const url = await uploadService.uploadFile(file);
      const newImages = { ...variationImages, [optionName]: url };
      onChange(groups, options, newImages);
    } catch (err) {
      console.error("Variation image upload error:", err);
      alert("Failed to upload image");
    }
  };

  const group1 = groups[0];
  const group2 = groups[1];

  return (
    <div className="space-y-8">
      
      {/* 1. Group Definitions */}
      <div className="space-y-4 bg-gray-50 p-4 rounded border border-gray-200">
        <h4 className="font-semibold text-gray-700">Variation Types</h4>
        {groups.map((g, idx) => (
          <div key={g.id} className="bg-white p-4 rounded border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-3">
               <div className="flex items-center gap-2">
                 <label className="text-sm font-medium text-gray-600">Name:</label>
                 <input 
                   className="border p-1 rounded text-sm font-bold text-gray-800"
                   value={g.name}
                   onChange={(e) => handleGroupNameChange(idx, e.target.value)}
                 />
               </div>
               <button onClick={() => handleRemoveGroup(idx)} className="text-xs text-red-500 hover:underline">Remove</button>
            </div>

            {/* Options List */}
            <div className="flex flex-wrap gap-2 mb-3">
              {g.options.map(opt => (
                <div key={opt} className="flex items-center bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
                   {idx === 0 && variationImages[opt] && (
                     <img src={variationImages[opt]} alt="" className="w-6 h-6 rounded-full object-cover mr-2 border" />
                   )}
                   <span className="text-sm font-medium text-blue-700">{opt}</span>
                   <button onClick={() => handleRemoveOption(idx, opt)} className="ml-2 text-blue-400 hover:text-red-600">×</button>
                </div>
              ))}
            </div>

            {/* Add Option Input */}
            <div className="flex gap-2">
                <input 
                    type="text" 
                    placeholder={`Add ${g.name} (e.g. ${idx === 0 ? 'Red' : 'S'})...`}
                    className="border p-2 rounded text-sm flex-1"
                    value={newOptionInputs[idx]}
                    onChange={(e) => {
                        const newInputs = [...newOptionInputs];
                        newInputs[idx] = e.target.value;
                        setNewOptionInputs(newInputs);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddOption(idx)}
                />
                <button 
                    onClick={() => handleAddOption(idx)}
                    className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded hover:bg-gray-200"
                >
                    Add
                </button>
            </div>
          </div>
        ))}

        {groups.length < 2 && (
            <button onClick={handleAddGroup} className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded hover:border-blue-400 hover:text-blue-500 transition-colors">
                + Add Variation Layer (e.g. Size)
            </button>
        )}
      </div>

      {/* 2. Bulk Edit Toolbar */}
      {options.length > 0 && (
        <div className="bg-blue-50 p-3 rounded border border-blue-100 flex flex-wrap items-end gap-4">
            <div>
                <label className="block text-xs text-gray-500 mb-1">Bulk Price</label>
                <input type="number" placeholder="RM" className="w-24 p-1 border rounded text-sm" value={bulkPrice} onChange={e => setBulkPrice(e.target.value)} />
            </div>
            <div>
                <label className="block text-xs text-gray-500 mb-1">Bulk Stock</label>
                <input type="number" placeholder="Qty" className="w-24 p-1 border rounded text-sm" value={bulkStock} onChange={e => setBulkStock(e.target.value)} />
            </div>
            <div>
                <label className="block text-xs text-gray-500 mb-1">Bulk SKU</label>
                <input type="text" placeholder="SKU" className="w-32 p-1 border rounded text-sm" value={bulkSku} onChange={e => setBulkSku(e.target.value)} />
            </div>
            <button onClick={handleBulkApply} className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 shadow-sm">
                Apply To All
            </button>
        </div>
      )}

      {/* 3. The Matrix Table */}
      {options.length > 0 && (
        <div className="border rounded overflow-hidden">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-700 font-semibold">
                    <tr>
                        <th className="p-3 border-b">{group1.name}</th>
                        {group2 && <th className="p-3 border-b">{group2.name}</th>}
                        <th className="p-3 border-b">Price (RM)</th>
                        <th className="p-3 border-b">Stock</th>
                        <th className="p-3 border-b">SKU</th>
                    </tr>
                </thead>
                <tbody>
                    {options.map((row, rowIndex) => {
                        const spanCount = group2 ? group2.options.length : 1;
                        const isFirstInSpan = rowIndex % spanCount === 0;

                        return (
                            <tr key={row.id} className="hover:bg-gray-50 border-b last:border-b-0">
                                {isFirstInSpan && (
                                    <td className="p-3 border-r bg-white align-top" rowSpan={spanCount}>
                                        <div className="flex flex-col gap-2">
                                            <span className="font-medium">{row.option1}</span>
                                            <div className="relative w-12 h-12 border border-dashed rounded hover:bg-gray-50 flex items-center justify-center cursor-pointer">
                                                {variationImages[row.option1] ? (
                                                    <img src={variationImages[row.option1]} alt="" className="w-full h-full object-cover rounded" />
                                                ) : (
                                                    <span className="text-[10px] text-gray-400 text-center leading-tight">Add<br/>Img</span>
                                                )}
                                                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(row.option1, e.target.files[0])} />
                                            </div>
                                        </div>
                                    </td>
                                )}
                                {group2 && (
                                    <td className="p-3 border-r">{row.option2}</td>
                                )}
                                <td className="p-3">
                                    <div className="relative">
                                        <span className="absolute left-2 top-1.5 text-gray-400 text-xs">RM</span>
                                        <input 
                                            type="number" 
                                            className="w-24 pl-8 p-1 border rounded" 
                                            value={row.price} 
                                            onChange={(e) => handleTableChange(rowIndex, 'price', parseFloat(e.target.value))}
                                        />
                                    </div>
                                </td>
                                <td className="p-3">
                                    <input 
                                        type="number" 
                                        className="w-20 p-1 border rounded" 
                                        value={row.stock} 
                                        onChange={(e) => handleTableChange(rowIndex, 'stock', parseInt(e.target.value))}
                                    />
                                </td>
                                <td className="p-3">
                                    <input 
                                        type="text" 
                                        className="w-32 p-1 border rounded" 
                                        value={row.sku} 
                                        onChange={(e) => handleTableChange(rowIndex, 'sku', e.target.value)}
                                    />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
      )}

      {/* 4. Size Chart Section (NEW) */}
      {hasSizeVariation && (
        <div className="bg-white p-4 rounded border border-gray-200 shadow-sm space-y-4">
            <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                Size Chart <span className="text-red-500 text-xs">*Required for Size variations</span>
            </h4>
            
            <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                        type="radio" 
                        name="sc_type" 
                        checked={!sizeChart || sizeChart.type === 'template'} 
                        onChange={() => onSizeChartChange({ type: 'template' })}
                    />
                    <span>Use Template</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                        type="radio" 
                        name="sc_type" 
                        checked={sizeChart?.type === 'image'} 
                        onChange={() => onSizeChartChange({ type: 'image', url: '' })}
                    />
                    <span>Upload Image</span>
                </label>
            </div>

            {/* Content based on selection */}
            {(!sizeChart || sizeChart.type === 'template') ? (
                <select className="w-full border p-2 rounded text-sm bg-gray-50">
                    <option>Standard T-Shirt Size Chart</option>
                    <option>Jeans Size Chart</option>
                    <option>Shoes Size Chart</option>
                </select>
            ) : (
                <div className="border-2 border-dashed border-gray-300 rounded p-4 flex flex-col items-center justify-center gap-2">
                    {sizeChart.url ? (
                        <div className="relative group">
                            <img src={sizeChart.url} alt="Size Chart" className="max-h-64 rounded border" />
                            <button 
                                onClick={() => onSizeChartChange({ ...sizeChart, url: '' })}
                                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                ×
                            </button>
                        </div>
                    ) : (
                        <div className="text-center">
                            <p className="text-sm text-gray-500 mb-2">Upload a size guide image</p>
                            <input 
                                type="file" 
                                accept="image/*" 
                                onChange={async (e) => {
                                    if (e.target.files?.[0]) {
                                        try {
                                            const url = await uploadService.uploadFile(e.target.files[0]);
                                            onSizeChartChange({ type: 'image', url });
                                        } catch (err) {
                                            console.error("Size chart upload error:", err);
                                            alert("Upload failed");
                                        }
                                    }
                                }}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default VariationManager;