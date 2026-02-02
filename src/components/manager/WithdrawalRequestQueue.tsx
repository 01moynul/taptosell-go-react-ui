// src/components/manager/WithdrawalRequestQueue.tsx

import React, { useState, useEffect } from 'react';
import type { WithdrawalRequest, ProcessWithdrawalPayload } from '../../types/CoreTypes';
import { getWithdrawalRequests, processWithdrawalRequest } from '../../services/managerService';

const WithdrawalRequestQueue: React.FC = () => {
    const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // State for the modal
    const [modalRequest, setModalRequest] = useState<WithdrawalRequest | null>(null);
    const [action, setAction] = useState<'approve' | 'reject'>('approve');
    const [reason, setReason] = useState('');

/**
     * Fetches the list of pending withdrawal requests.
     */
    const fetchRequests = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getWithdrawalRequests();
            // FIXED: Changed 'wd-pending' to 'pending' to match DB Enum [cite: 935]
            setRequests(data.filter(r => r.status === 'pending')); 
        } catch (err) {
            console.error('Error fetching withdrawal requests:', err);
            setError('Failed to load withdrawal requests. Check API connection.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    // Function to open the processing modal
    const openProcessModal = (request: WithdrawalRequest, initialAction: 'approve' | 'reject') => {
        setModalRequest(request);
        setAction(initialAction);
        setReason(''); // Clear any previous reason
    };

    /**
     * Handles the final submission (Approve/Reject) from the modal.
     */
    const handleProcessSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!modalRequest) return;

        if (action === 'reject' && !reason.trim()) {
            alert('A rejection requires a reason.');
            return;
        }

        setIsSubmitting(true);

        const payload: ProcessWithdrawalPayload = {
            action: action,
            rejectionReason: action === 'reject' ? reason.trim() : undefined,
        };

        try {
            await processWithdrawalRequest(modalRequest.id, payload);
            alert(`Withdrawal request ID ${modalRequest.id} ${action}d successfully.`);
            
            // Close modal and refresh list
            setModalRequest(null);
            fetchRequests();
        } catch (err) { 
            // Log the error to satisfy the linter and for crucial debugging
            console.error(`Error processing withdrawal request ID ${modalRequest.id}:`, err); 
            alert(`Processing failed for request ID ${modalRequest.id}.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <div className="p-4 text-center">Loading withdrawal requests...</div>;
    }

    if (error) {
        return <div className="p-4 text-red-500 text-center">{error}</div>;
    }

    // Modal Component for processing a request
    const ProcessModal: React.FC = () => {
        if (!modalRequest) return null;

        return (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                    <h3 className="text-xl font-bold mb-4">
                        Process Withdrawal #{modalRequest.id}
                    </h3>

                    <p className="mb-4 text-lg">
                        Supplier: <span className="font-semibold text-indigo-700">{modalRequest.supplierName}</span>
                    </p>
                    <p className="mb-4 text-2xl font-extrabold text-green-700">
                        Amount: RM {modalRequest.amount.toFixed(2)}
                    </p>
                    <p className="mb-6 text-sm text-gray-600">
                        Bank Details: {modalRequest.bankDetails}
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
                                    <span className="ml-2 text-green-600 font-medium">Approve (Transfer Funds)</span>
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
                                    <span className="ml-2 text-red-600 font-medium">Reject (Refund Wallet)</span>
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
                                onClick={() => setModalRequest(null)}
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
            <h2 className="text-2xl font-bold mb-6">Withdrawal Request Queue ({requests.length})</h2>

            {requests.length === 0 ? (
                <div className="p-10 text-center text-gray-500 border border-dashed rounded-lg">
                    ✅ No pending withdrawal requests requiring attention.
                </div>
            ) : (
                <div className="overflow-x-auto shadow-md sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request ID / Supplier</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (RM) / Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank Details</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {requests.map((request) => (
                                <tr key={request.id} className="hover:bg-yellow-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        #{request.id}
                                        <div className="text-xs text-indigo-600 font-semibold mt-1">By: {request.supplierName}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="font-bold text-green-700">RM {request.amount.toFixed(2)}</div>
                                        <div className="text-xs text-yellow-600 font-semibold">{request.status.toUpperCase()}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                        {request.bankDetails}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                        <button
                                            onClick={() => openProcessModal(request, 'approve')}
                                            disabled={isSubmitting}
                                            className="text-white bg-green-600 hover:bg-green-700 py-1 px-3 rounded text-xs mr-2 disabled:opacity-50"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => openProcessModal(request, 'reject')}
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

            {modalRequest && <ProcessModal />}
        </div>
    );
};

export default WithdrawalRequestQueue;