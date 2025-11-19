// src/services/aiService.ts
import apiClient from './api';
import type { AIChatResponse } from '../types/CoreTypes';

// Define payload interface locally if not in CoreTypes
interface AIChatPayload {
  message: string;
}

/**
 * Sends a user message to the Hybrid AI backend.
 * Endpoint: POST /v1/ai/chat
 */
export const sendMessageToAI = async (message: string): Promise<AIChatResponse> => {
  const payload: AIChatPayload = { message };
  
  // FIXED: We use '/ai/chat' because apiClient already includes '/v1' in the baseURL.
  const response = await apiClient.post<AIChatResponse>('/ai/chat', payload);
  return response.data;
};