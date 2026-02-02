import { useState, useEffect } from 'react';
import apiClient from '../services/api';
import toast from 'react-hot-toast'; // Ensure this is installed

// 1. Define the specific shape for History
interface WithdrawalHistoryItem {
  id: number;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
}

interface WalletData {
  availableBalance: number;
  pendingBalance: number;
  history: WithdrawalHistoryItem[];
}

function SupplierWalletPage() {
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // --- NEW: Withdrawal Form State ---
  const [amount, setAmount] = useState('');
  const [bankDetails, setBankDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadWallet = async () => {
    try {
      const response = await apiClient.get<WalletData>('/supplier/wallet');
      setData(response.data);
    } catch (err) {
      interface ApiError {
        response?: { data?: { error?: string } };
      }
      const apiError = err as ApiError;
      console.error("Failed to load wallet:", err);
      toast.error(apiError.response?.data?.error || "Failed to load wallet data");
    } finally {
      setLoading(false);
    }
  };

  // --- NEW: Withdrawal Handler ---
  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.confirm(`Request withdrawal of RM ${parseFloat(amount).toFixed(2)}?`)) return;

    setIsSubmitting(true);
    try {
      // Endpoint verified in withdrawal_handlers.go [cite: 1416]
      await apiClient.post('/supplier/wallet/request-withdrawal', {
        amount: parseFloat(amount),
        bankDetails
      });
      
      toast.success("Withdrawal request submitted!");
      setAmount('');
      setBankDetails('');
      loadWallet(); // Refresh balances immediately
    } catch (err) {
      interface ApiError { response?: { data?: { error?: string } } }
      const apiError = err as ApiError;
      toast.error(apiError.response?.data?.error || "Withdrawal failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    loadWallet();
  }, []);

  if (loading) return <div className="p-6">Loading Wallet...</div>;
  if (!data) return <div className="p-6">Error: Could not retrieve wallet data.</div>;

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">💰 My Wallet</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700 font-semibold uppercase">Available Balance</p>
          <p className="text-3xl font-bold text-green-900">
            RM {(data.availableBalance || 0).toFixed(2)}
          </p>
          <p className="text-xs text-green-600 mt-1">Ready for withdrawal</p>
        </div>

        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-700 font-semibold uppercase">Pending Balance</p>
          <p className="text-3xl font-bold text-yellow-900">
            RM {(data.pendingBalance || 0).toFixed(2)}
          </p>
          <p className="text-xs text-yellow-600 mt-1">From shipped orders (awaiting completion)</p>
        </div>
      </div>

      <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
      <div className="overflow-x-auto mb-10">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {(data.history || []).map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-2 text-sm text-gray-600">
                  {new Date(item.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-2 text-sm font-semibold text-gray-900">
                  RM {item.amount.toFixed(2)}
                </td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                    item.status === 'approved' ? 'bg-green-100 text-green-800' : 
                    item.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!data.history || data.history.length === 0) && (
          <p className="text-center py-4 text-gray-500">No recent transactions.</p>
        )}
      </div>

      {/* --- NEW: Withdrawal Form UI --- */}
      <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
        <h3 className="text-lg font-bold mb-4">📤 Request Withdrawal</h3>
        <form onSubmit={handleWithdrawal} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Amount (RM)</label>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Bank Details (Bank, Account No, Name)</label>
            <textarea
              required
              value={bankDetails}
              onChange={(e) => setBankDetails(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
              rows={3}
              placeholder="e.g. Maybank - 1234567890 - John Doe"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !amount}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 font-bold transition"
          >
            {isSubmitting ? "Processing..." : "Submit Withdrawal Request"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default SupplierWalletPage;