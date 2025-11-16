import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import type { Product } from '../../types/CoreTypes';

// --- API Contract Interface ---

/**
 * Defines the required payload for the POST /v1/products/:id/request-price-change endpoint.
 * Corresponds to Go struct RequestPriceChangeInput.
 */
interface RequestPriceChangePayload {
  newPrice: number;
  reason?: string;
}

// --- Component Props ---

interface RequestPriceChangeModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Modal component for a Supplier to submit a Price Change Request for a Published Product.
 */
const RequestPriceChangeModal: React.FC<RequestPriceChangeModalProps> = ({ product, isOpen, onClose, onSuccess }) => {
  const { authToken } = useAuth();
  const [newPrice, setNewPrice] = useState<string>(product.price.toFixed(2));
  const [reason, setReason] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guard Clause: If modal is closed, return null to prevent unnecessary rendering/state updates
  if (!isOpen) {
    return null;
  }

  // --- Handlers ---

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const priceValue = parseFloat(newPrice);

    if (isNaN(priceValue) || priceValue <= 0) {
      setError('Please enter a valid price greater than zero.');
      setLoading(false);
      return;
    }
    
    if (priceValue === product.price) {
      setError('The new price must be different from the current price.');
      setLoading(false);
      return;
    }

    const payload: RequestPriceChangePayload = {
      newPrice: priceValue,
      reason: reason.trim() || undefined, // Send reason only if not empty
    };

    try {
      const url = `${process.env.REACT_APP_API_URL}/v1/products/${product.id}/request-price-change`;
      await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      // Close the modal and notify parent component of success
      onClose();
      onSuccess();

    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        // Handle specific API errors (e.g., 400 Bad Request, 409 Conflict)
        setError(err.response.data.error || 'Failed to submit price appeal.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // --- JSX Output ---

  return (
    <div className="taptosell-modal-overlay">
      <div className="taptosell-modal-content max-w-lg">
        <h2 className="text-xl font-bold mb-4">Request Price Change for {product.name}</h2>
        <button className="taptosell-modal-close" onClick={onClose}>&times;</button>
        
        <p className="text-sm text-gray-500 mb-4">
          Price changes for 'published' products require Manager approval. Your request will be reviewed.
        </p>

        <form onSubmit={handleSubmit}>
          
          <div className="mb-4">
            <label className="form-label">Current Price (TTS Cost)</label>
            <p className="text-xl font-semibold mb-2">RM {product.price.toFixed(2)}</p>
          </div>
          
          <div className="mb-4">
            <label htmlFor="newPrice" className="form-label required">New Price (RM)</label>
            <input
              id="newPrice"
              type="number"
              step="0.01"
              min="0.01"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              className="form-control"
              placeholder="e.g., 55.00"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="reason" className="form-label">Reason for Change (Optional)</label>
            <textarea
              id="reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="form-control"
              placeholder="Briefly explain why the price needs to be updated (e.g., material cost increase)."
            ></textarea>
          </div>
          
          {error && <div className="error-message mb-4">{error}</div>}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="button button-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button button-primary"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Price Appeal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequestPriceChangeModal;