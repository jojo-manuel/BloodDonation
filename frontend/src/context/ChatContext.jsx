/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
    const [conversations, setConversations] = useState([]);
    const [currentConversation, setCurrentConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [chatOpen, setChatOpen] = useState(false);
    const [pollingEnabled, setPollingEnabled] = useState(false);

    // Fetch all conversations
    const fetchConversations = useCallback(async () => {
        try {
            const response = await api.get('/chat/conversations');
            if (response.data.success) {
                setConversations(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
        }
    }, []);

    // Fetch unread count
    const fetchUnreadCount = useCallback(async () => {
        try {
            const response = await api.get('/chat/unread-count');
            if (response.data.success) {
                setUnreadCount(response.data.data.unreadCount);
            }
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    }, []);

    // Fetch messages for a conversation
    const fetchMessages = useCallback(async (conversationId) => {
        if (!conversationId) return;
        setLoading(true);
        try {
            const response = await api.get(`/chat/conversations/${conversationId}/messages`);
            if (response.data.success) {
                setMessages(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Send a message
    const sendMessage = useCallback(async (content) => {
        if (!currentConversation || !content.trim()) return;
        try {
            const response = await api.post(`/chat/conversations/${currentConversation._id}/messages`, { content });
            if (response.data.success) {
                setMessages(prev => [...prev, response.data.data]);
                // Update conversation list
                fetchConversations();
            }
            return response.data;
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    }, [currentConversation, fetchConversations]);

    // Start a new conversation
    const startConversation = useCallback(async (userId) => {
        try {
            const response = await api.post('/chat/conversations', { userId });
            if (response.data.success) {
                setCurrentConversation(response.data.data);
                await fetchConversations();
                await fetchMessages(response.data.data._id);
                setChatOpen(true);
            }
            return response.data;
        } catch (error) {
            console.error('Error starting conversation:', error);
            throw error;
        }
    }, [fetchConversations, fetchMessages]);

    // Select a conversation
    const selectConversation = useCallback((conversation) => {
        setCurrentConversation(conversation);
        fetchMessages(conversation._id);
    }, [fetchMessages]);

    // Poll for new messages
    useEffect(() => {
        if (!pollingEnabled) return;

        const pollInterval = setInterval(() => {
            const token = localStorage.getItem('accessToken');
            if (!token) return; // Don't poll if not logged in

            fetchUnreadCount();
            if (currentConversation) {
                fetchMessages(currentConversation._id);
            }
            if (chatOpen) {
                fetchConversations();
            }
        }, 5000); // Poll every 5 seconds

        return () => clearInterval(pollInterval);
    }, [pollingEnabled, currentConversation, chatOpen, fetchUnreadCount, fetchMessages, fetchConversations]);

    // Initial fetch
    useEffect(() => {
        // Chat disabled for debugging
        /*
        const token = localStorage.getItem('accessToken');
        if (token) {
            fetchUnreadCount();
        }
        */
    }, [fetchUnreadCount]);

    const value = {
        conversations,
        currentConversation,
        messages,
        unreadCount,
        loading,
        chatOpen,
        setChatOpen,
        fetchConversations,
        fetchMessages,
        sendMessage,
        startConversation,
        selectConversation,
        setPollingEnabled
    };

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChat() {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
}

export default ChatContext;
