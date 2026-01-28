// src/components/manager/GlobalSettingsPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import type { GetSettingsResponse, UpdateSettingsPayload } from '../../types/CoreTypes';
import { getGlobalSettings, updateGlobalSettings } from '../../services/managerService';

const GlobalSettingsPage: React.FC = () => {
    const { user } = useAuth();
    
    // UI State
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // --- Form State ---
    
    // 1. General Settings
    const [commissionRate, setCommissionRate] = useState('');
    const [regKey, setRegKey] = useState('');
    
    // 2. Super Admin Settings (Maintenance & AI)
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [aiModel, setAiModel] = useState('gemini-pro');
    const [aiPrice, setAiPrice] = useState('0.00'); // Selling price per 1k tokens

    // Constants for Profit Calculation (Visual only)
    const GOOGLE_BASE_COST = 0.0005; // Example: $0.50 per 1M tokens (approx RM 0.002) - Adjust as needed
    
    /**
     * Fetches the current platform settings.
     */
    const fetchSettings = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { settings }: GetSettingsResponse = await getGlobalSettings();
            
            // General
            setCommissionRate(settings['default_commission_rate']?.value || '5');
            setRegKey(settings['supplier_registration_key']?.value || 'GENERATED-KEY');
            
            // Admin Only
            setMaintenanceMode(settings['maintenance_mode']?.value === 'true');
            setAiModel(settings['ai_model']?.value || 'gemini-pro');
            setAiPrice(settings['ai_price_per_1k_tokens']?.value || '0.02');

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
     * Handles saving ALL settings (General + AI).
     */
    const handleSaveAll = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (isNaN(parseFloat(commissionRate)) || parseFloat(commissionRate) < 0) {
            alert('Commission rate must be a positive number.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        // Build payload dynamically based on role
        const payload: UpdateSettingsPayload = {
            default_commission_rate: commissionRate,
            supplier_registration_key: regKey,
        };

        // If Super Admin, include AI settings
        if (user?.role === 'administrator') {
            payload.ai_model = aiModel;
            payload.ai_price_per_1k_tokens = aiPrice;
        }

        try {
            await updateGlobalSettings(payload);
            alert('Settings updated successfully!');
            await fetchSettings(); // Refresh
        } catch (err) {
            console.error('Error updating settings:', err);
            setError('Failed to save settings.');
        } finally {
            setIsSubmitting(false);
        }
    };

/**
     * specialized handler for Maintenance Mode (Immediate Action)
     */
    const handleMaintenanceToggle = async (newMode: boolean) => {
        if (!user || user.role !== 'administrator') return;

        if (!window.confirm(`DANGER: Are you sure you want to ${newMode ? 'ACTIVATE' : 'DEACTIVATE'} maintenance mode?`)) {
            return;
        }

        setIsSubmitting(true);
        try {
            await updateGlobalSettings({ maintenance_mode: newMode ? 'true' : 'false' });
            setMaintenanceMode(newMode);
            alert(`Maintenance Mode ${newMode ? 'ACTIVATED' : 'DEACTIVATED'}.`);
        } catch (err) {
            // FIX: We must use 'err' to satisfy the linter
            console.error("Maintenance toggle failed:", err);
            alert('Failed to toggle maintenance mode.');
        } finally {
            setIsSubmitting(false);
        }
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Loading configurations...</div>;
    if (error) return <div className="p-4 bg-red-50 text-red-600 border border-red-200 rounded">{error}</div>;

    const isSuperAdmin = user?.role === 'administrator';

    return (
        <div className="p-4 max-w-4xl mx-auto space-y-8">
            <div className="flex justify-between items-center border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-800">Platform Configuration</h2>
                {isSuperAdmin && <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold uppercase">Super Admin Access</span>}
            </div>

            {/* --- SECTION 1: DANGER ZONE (Maintenance) --- */}
            {isSuperAdmin && (
                <section className={`p-6 rounded-lg border-2 ${maintenanceMode ? 'bg-red-50 border-red-500' : 'bg-white border-gray-200'}`}>
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className={`text-lg font-bold flex items-center gap-2 ${maintenanceMode ? 'text-red-700' : 'text-gray-800'}`}>
                                🚧 Maintenance Protocol
                                {maintenanceMode && <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded animate-pulse">ACTIVE</span>}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1 max-w-xl">
                                When active, all Suppliers and Dropshippers will be locked out of the dashboard. Use this only during critical updates.
                            </p>
                        </div>
                        <button
                            onClick={() => handleMaintenanceToggle(!maintenanceMode)}
                            disabled={isSubmitting}
                            className={`px-4 py-2 rounded font-bold text-white transition ${
                                maintenanceMode 
                                ? 'bg-gray-600 hover:bg-gray-700' 
                                : 'bg-red-600 hover:bg-red-700'
                            }`}
                        >
                            {maintenanceMode ? 'Deactivate Maintenance' : 'Activate Maintenance'}
                        </button>
                    </div>
                </section>
            )}

            <form onSubmit={handleSaveAll} className="space-y-8">
                
                {/* --- SECTION 2: AI PROFIT ENGINE (Super Admin Only) --- */}
                {isSuperAdmin && (
                    <section className="bg-white p-6 rounded-lg shadow-sm border border-purple-100">
                        <h3 className="text-lg font-bold text-purple-900 mb-4 flex items-center gap-2">
                            🤖 AI Profit Engine
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">AI Model</label>
                                <select
                                    value={aiModel}
                                    onChange={e => setAiModel(e.target.value)}
                                    className="mt-1 block w-full p-2 border border-gray-300 rounded focus:ring-purple-500 focus:border-purple-500"
                                >
                                    <option value="gemini-pro">Gemini Pro (Standard)</option>
                                    <option value="gemini-ultra">Gemini Ultra (High Cost)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Selling Price (Per 1k Tokens)</label>
                                <div className="relative mt-1 rounded-md shadow-sm">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <span className="text-gray-500 sm:text-sm">RM</span>
                                    </div>
                                    <input
                                        type="number"
                                        step="0.001"
                                        value={aiPrice}
                                        onChange={e => setAiPrice(e.target.value)}
                                        className="block w-full rounded-md border-gray-300 pl-10 p-2 focus:border-purple-500 focus:ring-purple-500"
                                    />
                                </div>
                                {/* Simple Profit Calculator Visual */}
                                <p className="mt-2 text-xs text-gray-500">
                                    Est. Margin: <span className="font-bold text-green-600">
                                        {((parseFloat(aiPrice || '0') - GOOGLE_BASE_COST) / parseFloat(aiPrice || '1') * 100).toFixed(1)}%
                                    </span> (Based on base cost ~RM {GOOGLE_BASE_COST})
                                </p>
                            </div>
                        </div>
                    </section>
                )}

                {/* --- SECTION 3: GENERAL BUSINESS LOGIC --- */}
                <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Business Configuration</h3>
                    
                    <div className="space-y-6">
                        {/* Commission */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Default Commission Rate (%)</label>
                            <div className="mt-1 relative rounded-md shadow-sm max-w-xs">
                                <input
                                    type="number"
                                    value={commissionRate}
                                    onChange={e => setCommissionRate(e.target.value)}
                                    className="block w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="5.00"
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 sm:text-sm">%</span>
                                </div>
                            </div>
                        </div>

                        {/* Reg Key */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Supplier Registration Key</label>
                            <div className="mt-1 flex gap-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={regKey}
                                    className="block w-full p-2 bg-gray-100 border border-gray-300 rounded text-gray-600 font-mono"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newKey = 'TTS-' + Math.random().toString(36).substring(2, 8).toUpperCase();
                                        setRegKey(newKey);
                                    }}
                                    className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    Regenerate
                                </button>
                            </div>
                            <p className="mt-1 text-xs text-gray-500">Share this key with new Suppliers to allow them to register.</p>
                        </div>
                    </div>
                </section>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-blue-600 text-white px-8 py-3 rounded shadow hover:bg-blue-700 disabled:opacity-50 font-bold text-lg"
                    >
                        {isSubmitting ? 'Saving...' : 'Save All Changes'}
                    </button>
                </div>

            </form>
        </div>
    );
};

export default GlobalSettingsPage;