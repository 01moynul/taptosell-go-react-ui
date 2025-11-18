// src/services/aiService.ts
import api from './api';
import type { AIChatPayload, AIChatResponse } from '../types/CoreTypes';

/**
 * Sends a message to the Hybrid AI Assistant.
 * Endpoint: POST /v1/ai/chat
 * * This requires the user to have sufficient 'ai_user_credits'.
 * Returns the AI's response text and the billing metadata (credits used/remaining).
 */
export const sendMessageToAI = async (message: string): Promise<AIChatResponse> => {
    try {
        const payload: AIChatPayload = { message };
        // Type the response to match our core interface
        const response = await api.post<AIChatResponse>('/v1/ai/chat', payload);
        return response.data;
    } catch (err) {
        // Standard Fix: Log the technical error for debugging (Source 196)
        console.error("AI Chat API call failed:", err);
        // We throw the error so the UI component can set the 'isError' flag
        throw err;
    }
};