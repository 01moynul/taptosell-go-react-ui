import React, { useEffect, useState } from 'react';
import api from '../../services/api';

// Define the shape of the data matching your Go Struct
interface ManagerStats {
    pendingProducts: number;
    withdrawalRequests: number;
    priceAppeals: number;
    totalUsers: number;
}

const ManagerDashboardStats: React.FC = () => {
    const [stats, setStats] = useState<ManagerStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Calls the Go endpoint we just updated
                const response = await api.get('/manager/dashboard-stats');
                setStats(response.data);
            } catch (err) {
                console.error("Failed to fetch manager stats:", err);
                setError('Failed to load dashboard data.');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) return <div className="p-4 text-gray-500 animate-pulse">Loading Stats...</div>;
    if (error) return <div className="p-4 text-red-500 text-sm">{error}</div>;
    if (!stats) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* Card 1: Pending Products */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 border-l-4 border-l-blue-500">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pending Products</h3>
                <p className="text-3xl font-bold text-gray-800 mt-2">{stats.pendingProducts}</p>
                <span className="text-xs text-blue-600 font-medium">Needs Approval</span>
            </div>

            {/* Card 2: Withdrawals */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 border-l-4 border-l-orange-500">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Withdrawals</h3>
                <p className="text-3xl font-bold text-gray-800 mt-2">{stats.withdrawalRequests}</p>
                <span className="text-xs text-orange-600 font-medium">Pending Payout</span>
            </div>

            {/* Card 3: Price Appeals */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 border-l-4 border-l-purple-500">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Price Appeals</h3>
                <p className="text-3xl font-bold text-gray-800 mt-2">{stats.priceAppeals}</p>
                <span className="text-xs text-purple-600 font-medium">Review Prices</span>
            </div>

            {/* Card 4: Total Users */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 border-l-4 border-l-green-500">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Users</h3>
                <p className="text-3xl font-bold text-gray-800 mt-2">{stats.totalUsers}</p>
                <span className="text-xs text-green-600 font-medium">Platform Growth</span>
            </div>
        </div>
    );
};

export default ManagerDashboardStats;