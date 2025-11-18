// src/components/manager/ProductApprovalQueue.tsx

import React, { useState, useEffect } from 'react';
import type { PendingProduct, RejectProductPayload } from '../../types/CoreTypes';
import { getPendingProducts, approveProduct, rejectProduct } from '../../services/managerService';

// Assume a generic button/table styling exists, using Tailwind CSS classes for structure.

const ProductApprovalQueue: React.FC = () => {
    const [products, setProducts] = useState<PendingProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [rejectionProductId, setRejectionProductId] = useState<number | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    /**
     * Fetches the list of pending products from the backend.
     */
    const fetchProducts = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getPendingProducts();
            setProducts(data);
        } catch (err) { 
            console.error('Error fetching pending products:', err); // Now using 'err'
            setError('Failed to load pending products. Check API connection.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    /**
     * Handles the product approval action.
     * @param id Product ID to approve.
     */
    const handleApprove = async (id: number) => {
        if (!window.confirm(`Are you sure you want to approve product ID ${id}? This will set it to 'published' and notify the supplier.`)) {
            return;
        }
        setIsSubmitting(true);
        try {
            await approveProduct(id);
            alert('Product approved successfully!');
            fetchProducts(); // Refresh the list
        } catch () {
            alert('Approval failed.');
        } finally {
            setIsSubmitting(false);
        }
    };

    /**
     * Handles the rejection form submission.
     */
    const handleRejectSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!rejectionProductId || !rejectionReason.trim()) {
            alert('Please provide a reason for rejection.');
            return;
        }

        setIsSubmitting(true);
        const payload: RejectProductPayload = { reason: rejectionReason.trim() };

        try {
            await rejectProduct(rejectionProductId, payload);
            alert('Product rejected successfully!');
            
            // Reset state and refresh
            setRejectionProductId(null);
            setRejectionReason('');
            fetchProducts();
        } catch () {
            alert('Rejection failed.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <div className="p-4 text-center">Loading pending products...</div>;
    }

    if (error) {
        return <div className="p-4 text-red-500 text-center">{error}</div>;
    }
    
    // Simple Modal for Rejection
    const RejectionModal: React.FC = () => (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <h3 className="text-lg font-bold mb-4">Reject Product ID: {rejectionProductId}</h3>
                <form onSubmit={handleRejectSubmit}>
                    <label htmlFor="reason" className="block text-sm font-medium text-gray-700">Rejection Reason (Required)</label>
                    <textarea
                        id="reason"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={4}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        required
                        disabled={isSubmitting}
                    />
                    <div className="mt-4 flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={() => setRejectionProductId(null)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Submitting...' : 'Confirm Rejection'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-6">Product Approval Queue ({products.length})</h2>
            
            {products.length === 0 ? (
                <div className="p-10 text-center text-gray-500 border border-dashed rounded-lg">
                    🎉 No pending products requiring approval.
                </div>
            ) : (
                <div className="overflow-x-auto shadow-md sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID / Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name / Supplier</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price (RM) / Comm.</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {products.map((product) => (
                                <tr key={product.id} className="hover:bg-yellow-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        #{product.id}
                                        <div className="text-xs text-yellow-600 font-semibold mt-1">{product.status}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="font-semibold">{product.name}</div>
                                        <div className="text-xs text-indigo-600">By: {product.supplierName}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        RM {product.price.toFixed(2)}
                                        <div className="text-xs text-green-600">{product.commissionRate}% Commission</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleApprove(product.id)}
                                            disabled={isSubmitting}
                                            className="text-white bg-green-600 hover:bg-green-700 py-1 px-3 rounded text-xs mr-2 disabled:opacity-50"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => {
                                                setRejectionProductId(product.id);
                                                setRejectionReason(''); // Clear previous reason
                                            }}
                                            disabled={isSubmitting}
                                            className="text-white bg-red-600 hover:bg-red-700 py-1 px-3 rounded text-xs disabled:opacity-50"
                                        >
                                            Reject
                                        </button>
                                        {/* TODO: Add View Details Button here to show full product info */}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table >
                </div>
            )}
            
            {rejectionProductId !== null && <RejectionModal />}
        </div>
    );
};

export default ProductApprovalQueue;