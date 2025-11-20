import React, { useRef, useState } from 'react';
import { uploadService } from '../../services/uploadService';

interface ImageUploaderProps {
  images: string[]; // The list of URLs
  onChange: (newImages: string[]) => void; // Callback to update parent state
  maxImages?: number;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ images, onChange, maxImages = 9 }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files);
    const remainingSlots = maxImages - images.length;
    
    if (files.length > remainingSlots) {
      alert(`You can only upload ${remainingSlots} more image(s).`);
      return;
    }

    setIsUploading(true);

    try {
      // Upload all selected files in parallel
      const uploadPromises = files.map((file) => uploadService.uploadFile(file));
      const newUrls = await Promise.all(uploadPromises);

      // Update parent state with new URLs appended
      onChange([...images, ...newUrls]);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Failed to upload one or more images.");
    } finally {
      setIsUploading(false);
      // Reset input so we can select the same file again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = (indexToRemove: number) => {
    const updated = images.filter((_, index) => index !== indexToRemove);
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Product Images <span className="text-gray-400">({images.length}/{maxImages})</span>
      </label>

      <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5">
        {/* 1. Existing Images */}
        {images.map((url, index) => (
          <div key={index} className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
            <img src={url} alt={`Product ${index}`} className="w-full h-full object-cover" />
            
            {/* Remove Button (appears on hover) */}
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            {/* Cover Photo Label for first item */}
            {index === 0 && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] text-center py-1">
                Cover Photo
              </div>
            )}
          </div>
        ))}

        {/* 2. Add Button (Show only if under limit) */}
        {images.length < maxImages && (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            {isUploading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs text-red-500 font-medium">Add Image</span>
                <span className="text-[10px] text-gray-400">({images.length}/{maxImages})</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
      />
    </div>
  );
};

export default ImageUploader;