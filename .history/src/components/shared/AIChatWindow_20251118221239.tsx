// src/components/shared/AIChatWindow.tsx
import React, { useState, useRef, useEffect } from 'react';
// Strict Type-Only Import [cite: 176]
import type { AIChatMessage } from '../../types/CoreTypes'; 
import { sendMessageToAI } from '../../services/aiService';

export const AIChatWindow: React.FC = () => {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<AIChatMessage[]>([
        {
            id: 'welcome',
            role: 'ai',
            text: "Hello! I'm your TapToSell AI Assistant. I can help you analyze data or perform actions. How can I help you today?",
            timestamp: new Date(),
        }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [creditsInfo, setCreditsInfo] = useState<string | null>(null); // To show cost after a query

    // Auto-scroll to bottom of chat
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        // 1. Add User Message to State
        const userMsg: AIChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            text: input,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);
        setCreditsInfo(null);

        try {
            // 2. Call API
            const data = await sendMessageToAI(userMsg.text);

            // 3. Add AI Response to State
            const aiMsg: AIChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'ai',
                text: data.response,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMsg]);
            
            // 4. Update Credit Info (Billing Feedback) [cite: 101]
            setCreditsInfo(`Cost: RM ${data.creditsUsed.toFixed(4)} | Remaining: RM ${data.creditsRemaining.toFixed(2)}`);

        } catch (err: any) {
            // Standard Fix: Log error 
            console.error("Chat Error:", err);

            let errorText = "Sorry, something went wrong. Please try again.";
            
            // Specific handling for 402 Payment Required 
            if (err.response && err.response.status === 402) {
                errorText = "⛔ Insufficient AI Credits. Please contact your manager to top up your balance.";
            }

            const errorMsg: AIChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'ai',
                text: errorText,
                timestamp: new Date(),
                isError: true
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle Enter key
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-[500px] bg-white border rounded-lg shadow-lg">
            {/* Header */}
            <div className="p-4 bg-indigo-600 text-white rounded-t-lg flex justify-between items-center">
                <h3 className="font-bold">AI Assistant 🤖</h3>
                {creditsInfo && <span className="text-xs bg-indigo-800 px-2 py-1 rounded">{creditsInfo}</span>}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.map((msg) => (
                    <div 
                        key={msg.id} 
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div 
                            className={`max-w-[80%] p-3 rounded-lg text-sm whitespace-pre-wrap ${
                                msg.role === 'user' 
                                    ? 'bg-indigo-500 text-white rounded-br-none' 
                                    : msg.isError 
                                        ? 'bg-red-100 text-red-700 border border-red-200'
                                        : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                            }`}
                        >
                            {msg.text}
                            <div className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-indigo-200' : 'text-gray-400'}`}>
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-200 p-3 rounded-lg rounded-bl-none animate-pulse text-sm text-gray-500">
                            Thinking...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t bg-white rounded-b-lg">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask me to approve a product or analyze sales..."
                        disabled={isLoading}
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:bg-gray-400 text-sm font-medium transition-colors"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
};