import React, { useRef, useState } from 'react';
import { uploadService } from '../../services/uploadService';

interface VideoUploaderProps {
  videoUrl?: string;
  onChange: (newUrl: string) => void;
}

const VideoUploader: React.FC<VideoUploaderProps> = ({ videoUrl, onChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Reset Error
    setError(null);

    // 2. Validate Format (MP4)
    if (file.type !== 'video/mp4') {
      setError('Only MP4 format is supported.');
      return;
    }

    // 3. Validate Size (Max 30MB)
    const maxSize = 30 * 1024 * 1024; // 30MB in bytes
    if (file.size > maxSize) {
      setError('Video size must not exceed 30MB.');
      return;
    }

    setIsUploading(true);

    try {
      const url = await uploadService.uploadFile(file);
      onChange(url);
    } catch (err) {
      console.error("Video upload failed:", err);
      setError("Failed to upload video. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    onChange('');
    setError(null);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Product Video <span className="text-gray-400 text-xs">(Optional, Max 30MB, MP4)</span>
      </label>

      <div className="flex items-start space-x-4">
        {/* 1. Video Preview Area */}
        {videoUrl ? (
          <div className="relative w-32 h-32 bg-black rounded-lg overflow-hidden group border border-gray-200">
            <video src={videoUrl} className="w-full h-full object-cover" controls />
            
            {/* Remove Button */}
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        ) : (
          /* 2. Upload Button */
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-red-500 hover:bg-red-50 transition-colors"
          >
            {isUploading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500"></div>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="text-xs text-red-500 font-medium">Add Video</span>
              </>
            )}
          </div>
        )}

        {/* Helper Text / Error Message */}
        <div className="flex-1 text-xs text-gray-500 py-2">
          {error ? (
            <div className="text-red-600 font-medium">{error}</div>
          ) : (
            <ul className="list-disc pl-4 space-y-1">
              <li>Size: Max 30Mb</li>
              <li>Format: MP4</li>
              <li>Duration: 10s-60s (Recommended)</li>
            </ul>
          )}
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="video/mp4"
        onChange={handleFileSelect}
      />
    </div>
  );
};

export default VideoUploader;