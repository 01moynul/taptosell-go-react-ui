// src/components/manager/GlobalSettingsPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth'; // To get the user role for Maintenance Mode visibility
import type { GetSettingsResponse, UpdateSettingsPayload } from '../../types/CoreTypes';
import { getGlobalSettings, updateGlobalSettings } from '../../services/managerService';

const GlobalSettingsPage: React.FC = () => {
    const { user } = useAuth(); // Assuming useAuth provides the user object including role
    //const [settings, setSettings] = useState<GetSettingsResponse['settings']>({});
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state initialized from fetched settings (or defaults)
    const [commissionRate, setCommissionRate] = useState('');
    const [regKey, setRegKey] = useState('');
    const [maintenanceMode, setMaintenanceMode] = useState(false);

    /**
     * Fetches the current platform settings.
     */
    const fetchSettings = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { settings: fetchedSettings } = await getGlobalSettings();
            // Remove this line: setSettings(fetchedSettings);
            
            // Initialize form state from fetched data
            setCommissionRate(fetchedSettings['default_commission_rate'] || '5');
            setRegKey(fetchedSettings['supplier_registration_key'] || 'GENERATED-KEY');
            setMaintenanceMode(fetchedSettings['maintenance_mode'] === 'true');

        } catch (err) {
            console.error('Error fetching settings:', err);
            setError('Failed to load settings. Check API connection.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    /**
     * Handles the form submission for general settings.
     */
    const handleSubmitGeneral = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Basic validation
        if (isNaN(parseFloat(commissionRate)) || parseFloat(commissionRate) <= 0) {
            alert('Commission rate must be a positive number.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        const payload: UpdateSettingsPayload = {
            default_commission_rate: commissionRate,
            supplier_registration_key: regKey, // We update the key field, even if it's read-only for regeneration
        };

        try {
            await updateGlobalSettings(payload);
            alert('General settings updated successfully!');
            // Re-fetch to confirm and update UI
            await fetchSettings();
        } catch (err) {
            console.error('Error updating general settings:', err);
            setError('Failed to save settings.');
        } finally {
            setIsSubmitting(false);
        }
    };

    /**
     * Handles the Maintenance Mode toggle action (Super Admin only).
     */
    const handleMaintenanceToggle = async (newMode: boolean) => {
        if (!user || user.role !== 'administrator') return;

        if (!window.confirm(`Are you sure you want to ${newMode ? 'ACTIVATE' : 'DEACTIVATE'} maintenance mode?`)) {
            return;
        }

        setIsSubmitting(true);
        setError(null);

        const payload: UpdateSettingsPayload = {
            maintenance_mode: newMode ? 'true' : 'false',
        };

        try {
            await updateGlobalSettings(payload);
            setMaintenanceMode(newMode); // Optimistic UI update
            alert(`Maintenance Mode ${newMode ? 'Activated' : 'Deactivated'} successfully.`);
        } catch (err) {
            console.error('Error toggling maintenance mode:', err);
            setError('Failed to toggle maintenance mode.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <div className="p-4 text-center">Loading platform settings...</div>;
    }

    if (error) {
        return <div className="p-4 text-red-500 text-center">{error}</div>;
    }

    // Determine if the current user is a Super Admin
    const isSuperAdmin = user?.role === 'administrator';

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Global Platform Settings</h2>
            
            {/* 1. Maintenance Mode (Super Admin Only) */}
            {isSuperAdmin && (
                <section className="mb-8 p-6 bg-red-50 border border-red-300 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold mb-3 text-red-800 flex items-center">
                        <span className="mr-2">🚧</span> Maintenance Mode Control
                    </h3>
                    <p className="mb-4 text-sm text-red-700">
                        When **ACTIVE**, all user-facing pages (Dropshipper/Supplier/Public Catalog) will be inaccessible. Only Admin/Manager routes will remain open.
                    </p>
                    <div className="flex items-center justify-between">
                        <span className={`text-lg font-bold ${maintenanceMode ? 'text-red-700' : 'text-green-700'}`}>
                            Status: {maintenanceMode ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                        <button
                            type="button"
                            onClick={() => handleMaintenanceToggle(!maintenanceMode)}
                            disabled={isSubmitting}
                            className={`px-6 py-2 text-white font-medium rounded-md transition disabled:opacity-50 
                                ${maintenanceMode ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                        >
                            {isSubmitting ? 'Updating...' : maintenanceMode ? 'Deactivate Mode' : 'Activate Mode'}
                        </button>
                    </div>
                </section>
            )}

            {/* 2. General Settings Form (Manager/Admin) */}
            <form onSubmit={handleSubmitGeneral} className="space-y-6 p-6 border rounded-lg bg-white shadow-md">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">General Platform Configuration</h3>

                {/* Platform Commission Rate */}
                <div>
                    <label htmlFor="commission" className="block text-sm font-medium text-gray-700">
                        Default Platform Commission Rate (%)
                    </label>
                    <input
                        type="number"
                        id="commission"
                        value={commissionRate}
                        onChange={(e) => setCommissionRate(e.target.value)}
                        required
                        min="0"
                        step="0.01"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        disabled={isSubmitting}
                    />
                    <p className="mt-2 text-xs text-gray-500">
                        This rate is applied by default to all new supplier products.
                    </p>
                </div>

                {/* Supplier Registration Key */}
                <div>
                    <label htmlFor="regKey" className="block text-sm font-medium text-gray-700">
                        Supplier Registration Key
                    </label>
                    <input
                        type="text"
                        id="regKey"
                        value={regKey}
                        readOnly
                        className="mt-1 block w-full border border-gray-300 bg-gray-100 rounded-md shadow-sm p-2 cursor-not-allowed"
                        disabled={isSubmitting}
                    />
                    <div className="mt-2 flex justify-between items-center">
                        <p className="text-xs text-gray-500">
                            This key is required for new suppliers to access the registration form.
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                // In a real app, this would be an API call to a specific /regenerate-key endpoint
                                const newKey = 'TTS-' + Math.random().toString(36).substring(2, 10).toUpperCase();
                                setRegKey(newKey);
                                // The new key will be submitted and saved when the main form is saved.
                                alert('New key generated locally. Click "Save Settings" to apply it.');
                            }}
                            className="text-xs bg-indigo-500 hover:bg-indigo-600 text-white py-1 px-3 rounded-md disabled:opacity-50"
                            disabled={isSubmitting}
                        >
                            Regenerate Key
                        </button>
                    </div>
                </div>

                <div className="pt-4 border-t">
                    <button
                        type="submit"
                        className="w-full px-4 py-2 text-white font-semibold bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Saving...' : 'Save General Settings'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default GlobalSettingsPage;