// src/components/manager/UserManagementPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import type { User, UpdatePenaltyPayload } from '../../types/CoreTypes';
import { getUsers, updateUserPenalty } from '../../services/managerService';

const UserManagementPage: React.FC = () => {
    // Data State
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    
    // UI State
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

    /**
     * Fetches the latest list of users.
     */
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getUsers();
            setUsers(data);
            setFilteredUsers(data);
        } catch (err) {
            console.error('Error loading users:', err);
            setError('Failed to load users.');
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial Load
    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Handle Search Filtering
    useEffect(() => {
        const lowerQuery = searchQuery.toLowerCase();
        const filtered = users.filter(user => 
            user.fullName.toLowerCase().includes(lowerQuery) ||
            user.email.toLowerCase().includes(lowerQuery) ||
            user.role.toLowerCase().includes(lowerQuery)
        );
        setFilteredUsers(filtered);
    }, [searchQuery, users]);

    /**
     * Handles updating a user's penalty strikes.
     * @param userId - The ID of the user to update.
     * @param action - 'increment', 'decrement', or 'reset'.
     */
    const handlePenaltyAction = async (userId: number, action: UpdatePenaltyPayload['action']) => {
        if (action === 'reset' && !window.confirm('Are you sure you want to RESET all strikes for this user?')) {
            return;
        }

        setActionLoadingId(userId);
        try {
            await updateUserPenalty(userId, { action });
            // Refresh list to show new strike count
            await fetchUsers(); 
        } catch (err) {
            console.error(`Failed to ${action} penalty:`, err);
            alert(`Failed to update penalty strikes.`);
        } finally {
            setActionLoadingId(null);
        }
    };

    if (loading && users.length === 0) {
        return <div className="p-8 text-center text-gray-500">Loading User Directory...</div>;
    }

    return (
        <div className="p-4 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
                
                {/* Search Bar */}
                <input 
                    type="text" 
                    placeholder="Search by name, email, or role..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border border-gray-300 rounded px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {error && (
                <div className="p-4 mb-4 bg-red-50 text-red-700 border border-red-200 rounded">
                    {error}
                    <button onClick={fetchUsers} className="ml-4 underline font-bold">Retry</button>
                </div>
            )}

            {/* Users Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Details</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Penalty Strikes</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500 italic">
                                    No users found matching your search.
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map((user) => (
                                <tr key={user.id} className={user.status === 'suspended' ? 'bg-red-50' : ''}>
                                    {/* User Details */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-900">{user.fullName}</span>
                                            <span className="text-sm text-gray-500">{user.email}</span>
                                            {user.companyName && (
                                                <span className="text-xs text-gray-400 mt-1">{user.companyName}</span>
                                            )}
                                        </div>
                                    </td>

                                    {/* Role */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                                        {user.role}
                                    </td>

                                    {/* Status */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                            ${user.status === 'active' ? 'bg-green-100 text-green-800' : 
                                            user.status === 'suspended' ? 'bg-red-100 text-red-800' : 
                                            'bg-yellow-100 text-yellow-800'}`}>
                                            {user.status}
                                        </span>
                                    </td>

                                    {/* Penalty Strikes */}
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <div className="flex items-center justify-center">
                                            <span className={`text-lg font-bold ${user.penaltyStrikes > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                                {user.penaltyStrikes}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Actions */}
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {actionLoadingId === user.id ? (
                                            <span className="text-gray-400">Updating...</span>
                                        ) : (
                                            <div className="flex justify-end space-x-2">
                                                <button 
                                                    onClick={() => handlePenaltyAction(user.id, 'increment')}
                                                    title="Add Strike"
                                                    className="text-red-600 hover:text-red-900 bg-red-50 px-2 py-1 rounded border border-red-200"
                                                >
                                                    + Strike
                                                </button>
                                                <button 
                                                    onClick={() => handlePenaltyAction(user.id, 'decrement')}
                                                    title="Remove Strike"
                                                    className="text-green-600 hover:text-green-900 bg-green-50 px-2 py-1 rounded border border-green-200"
                                                    disabled={user.penaltyStrikes <= 0}
                                                >
                                                    - Strike
                                                </button>
                                                {user.penaltyStrikes > 0 && (
                                                    <button 
                                                        onClick={() => handlePenaltyAction(user.id, 'reset')}
                                                        title="Reset Strikes"
                                                        className="text-gray-500 hover:text-gray-700 underline text-xs ml-2"
                                                    >
                                                        Reset
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserManagementPage;