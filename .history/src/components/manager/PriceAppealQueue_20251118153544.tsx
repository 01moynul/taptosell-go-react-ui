// src/components/manager/PriceAppealQueue.tsx

import React, { useState, useEffect } from 'react';
import type { PriceAppeal, ProcessPriceAppealPayload } from '../../types/CoreTypes';
import { getPriceAppeals, processPriceAppeal } from '../../services/managerService';

const PriceAppealQueue: React.FC = () => {
    const [appeals, setAppeals] = useState<PriceAppeal[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // State for the modal
    const [modalAppeal, setModalAppeal] = useState<PriceAppeal | null>(null);
    const [action, setAction] = useState<'approve' | 'reject'>('approve');
    const [reason, setReason] = useState('');

    /**
     * Fetches the list of pending price appeals.
     */
    const fetchAppeals = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getPriceAppeals();
            setAppeals(data.filter(a => a.status === 'pending')); // Filter to show only pending
        } catch (err) {
            console.error('Error fetching price appeals:', err);
            setError('Failed to load price appeals. Check API connection.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppeals();
    }, []);

    // Function to open the processing modal
    const openProcessModal = (appeal: PriceAppeal, initialAction: 'approve' | 'reject') => {
        setModalAppeal(appeal);
        setAction(initialAction);
        setReason(''); // Clear any previous reason
    };

    /**
     * Handles the final submission (Approve/Reject) from the modal.
     */
    const handleProcessSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!modalAppeal) return;

        if (action === 'reject' && !reason.trim()) {
            alert('A rejection requires a reason.');
            return;
        }

        setIsSubmitting(true);

        const payload: ProcessPriceAppealPayload = {
            action: action,
            rejectionReason: action === 'reject' ? reason.trim() : undefined,
        };

        try {
            await processPriceAppeal(modalAppeal.id, payload);
            alert(`Price appeal ID ${modalAppeal.id} ${action}d successfully.`);
            
            // Close modal and refresh list
            setModalAppeal(null);
            fetchAppeals();
        } catch (err) {
            console.error(`Error processing price appeal ID ${modalAppeal.id}:`, err);
            alert(`Processing failed for appeal ID ${modalAppeal.id}.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <div className="p-4 text-center">Loading price appeals...</div>;
    }

    if (error) {
        return <div className="p-4 text-red-500 text-center">{error}</div>;
    }

    // Modal Component for processing an appeal
    const ProcessModal: React.FC = () => {
        if (!modalAppeal) return null;

        return (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
                    <h3 className="text-xl font-bold mb-4">
                        Process Price Appeal #{modalAppeal.id}
                    </h3>

                    <p className="mb-4 text-lg">
                        Product: <span className="font-semibold text-indigo-700">{modalAppeal.productName}</span>
                    </p>

                    <div className="flex justify-between mb-6 p-3 border rounded-lg bg-yellow-50">
                        <div className="text-center">
                            <div className="text-sm text-gray-500">Old Price</div>
                            <div className="text-xl font-bold text-red-600">RM {modalAppeal.oldPrice.toFixed(2)}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-sm text-gray-500">New Price Requested</div>
                            <div className="text-2xl font-extrabold text-green-700">RM {modalAppeal.newPrice.toFixed(2)}</div>
                        </div>
                    </div>
                    
                    <p className="mb-4 text-sm text-gray-600">
                        **Supplier Reason:** {modalAppeal.reason}
                    </p>

                    <form onSubmit={handleProcessSubmit}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Action:</label>
                            <div className="flex items-center space-x-4">
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        name="action"
                                        value="approve"
                                        checked={action === 'approve'}
                                        onChange={() => setAction('approve')}
                                        className="h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
                                        disabled={isSubmitting}
                                    />
                                    <span className="ml-2 text-green-600 font-medium">Approve (Apply New Price)</span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        name="action"
                                        value="reject"
                                        checked={action === 'reject'}
                                        onChange={() => setAction('reject')}
                                        className="h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500"
                                        disabled={isSubmitting}
                                    />
                                    <span className="ml-2 text-red-600 font-medium">Reject (Keep Old Price)</span>
                                </label>
                            </div>
                        </div>

                        {action === 'reject' && (
                            <div className="mb-4">
                                <label htmlFor="reason" className="block text-sm font-medium text-gray-700">Rejection Reason</label>
                                <textarea
                                    id="reason"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    rows={3}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>
                        )}

                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => setModalAppeal(null)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className={`px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-50 ${action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Processing...' : `Confirm ${action === 'approve' ? 'Approval' : 'Rejection'}`}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-6">Price Appeal Queue ({appeals.length})</h2>

            {appeals.length === 0 ? (
                <div className="p-10 text-center text-gray-500 border border-dashed rounded-lg">
                    ✨ No pending price appeals requiring attention.
                </div>
            ) : (
                <div className="overflow-x-auto shadow-md sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Appeal ID / Product</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Old Price (RM)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New Price (RM)</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {appeals.map((appeal) => (
                                <tr key={appeal.id} className="hover:bg-yellow-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        #{appeal.id}
                                        <div className="text-xs text-indigo-600 font-semibold mt-1">{appeal.productName}</div>
                                        <div className="text-xs text-gray-500">By: {appeal.supplierName}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                                        RM {appeal.oldPrice.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-700">
                                        RM {appeal.newPrice.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                        <button
                                            onClick={() => openProcessModal(appeal, 'approve')}
                                            disabled={isSubmitting}
                                            className="text-white bg-green-600 hover:bg-green-700 py-1 px-3 rounded text-xs mr-2 disabled:opacity-50"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => openProcessModal(appeal, 'reject')}
                                            disabled={isSubmitting}
                                            className="text-white bg-red-600 hover:bg-red-700 py-1 px-3 rounded text-xs disabled:opacity-50"
                                        >
                                            Reject
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table >
                </div>
            )}

            {modalAppeal && <ProcessModal />}
        </div>
    );
};

export default PriceAppealQueue;