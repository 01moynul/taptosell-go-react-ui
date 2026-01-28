// src/pages/DropshipperWalletPage.tsx
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import apiClient from '../services/api'; // Direct API usage to ensure type safety
import axios from 'axios';

// 1. Define the Interface EXACTLY as the Go Backend sends it
interface WalletTransaction {
    id: number;
    userId: number;
    type: string;
    amount: number;
    details: string;
    createdAt: string; // Go sends 'createdAt', not 'timestamp'
}

interface WalletResponse {
    currentBalance: number; // Go sends 'currentBalance'
    transactions: WalletTransaction[];
}

function DropshipperWalletPage() {
  const [walletData, setWalletData] = useState<WalletResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
  const auth = useAuth();
  const isDropshipper = auth.user?.role === 'dropshipper';

  const loadWalletData = useCallback(async () => {
    if (!auth.token || !isDropshipper) {
      setError('Access denied. You must be a logged-in Dropshipper.');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      // Direct call to ensure we get the shape we expect
      const response = await apiClient.get<WalletResponse>('/dropshipper/wallet');
      setWalletData(response.data);
    } catch (err) {
      const msg = axios.isAxiosError(err) && err.response?.data?.message
        ? err.response.data.message
        : 'Failed to load wallet data.';
      setError(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, [auth.token, isDropshipper]);

  useEffect(() => {
    loadWalletData();
  }, [loadWalletData]);

  // Helper function to format transaction date
  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-MY', { 
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  // Helper function to determine row style based on amount
  const getAmountStyle = (amount: number): string => {
    if (amount > 0) return 'text-green-600 font-semibold';
    if (amount < 0) return 'text-red-600 font-semibold';
    return 'text-gray-500';
  };
  
  // --- Rendering Logic ---

  if (loading) return <h1 className="text-xl font-bold p-6">Loading Wallet Dashboard...</h1>;
  if (error) return <h1 className="text-xl text-red-600 p-6">{error}</h1>;
  if (!walletData) return null;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Dropshipper Wallet</h1>

      {/* Balance Summary Card */}
      <div className="bg-blue-600 text-white p-8 rounded-xl shadow-lg mb-8">
        <p className="text-sm opacity-80">Current Available Balance</p>
        {/* FIX: Use correct camelCase property name */}
        <h2 className="text-5xl font-extrabold mt-1">
          RM {walletData.currentBalance?.toFixed(2) || '0.00'}
        </h2>
        
        {/* REMOVED: "Total Credits Earned" because backend doesn't send it yet */}
        
        <div className="mt-6">
            <button className="bg-yellow-400 text-blue-900 font-bold py-2 px-4 rounded-lg hover:bg-yellow-500 transition duration-200">
                + Top Up Wallet (Placeholder)
            </button>
        </div>
      </div>
      
      {/* Transaction History */}
      <h2 className="text-2xl font-semibold mb-4">Transaction History</h2>
      
      {(!walletData.transactions || walletData.transactions.length === 0) ? (
        <div className="bg-gray-50 p-6 rounded-lg text-center border border-dashed border-gray-300">
            <p className="text-gray-500">No transactions recorded yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (RM)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {walletData.transactions.map((tx) => (
                <tr key={tx.id}>
                  {/* FIX: Use 'createdAt' instead of 'timestamp' */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(tx.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                    {tx.type ? tx.type.replace(/_/g, ' ') : 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-wrap text-sm text-gray-700">
                    {tx.details}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-right text-sm ${getAmountStyle(tx.amount)}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default DropshipperWalletPage;