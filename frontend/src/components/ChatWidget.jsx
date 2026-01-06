import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';

// Chat bubble icon
const ChatIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z" clipRule="evenodd" />
    </svg>
);

// Close icon
const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
    </svg>
);

// Back arrow icon
const BackIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M7.72 12.53a.75.75 0 010-1.06l7.5-7.5a.75.75 0 111.06 1.06L9.31 12l6.97 6.97a.75.75 0 11-1.06 1.06l-7.5-7.5z" clipRule="evenodd" />
    </svg>
);

// Send icon
const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
);

export default function ChatWidget() {
    const {
        conversations,
        currentConversation,
        messages,
        unreadCount,
        loading,
        chatOpen,
        setChatOpen,
        fetchConversations,
        sendMessage,
        selectConversation
    } = useChat();

    const [messageInput, setMessageInput] = useState('');
    const [sending, setSending] = useState(false);
    const [view, setView] = useState('list'); // 'list' or 'chat'
    const messagesEndRef = useRef(null);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Fetch conversations when chat opens
    useEffect(() => {
        if (chatOpen) {
            fetchConversations();
        }
    }, [chatOpen, fetchConversations]);

    // Handle send message
    const handleSend = async (e) => {
        e.preventDefault();
        if (!messageInput.trim() || sending) return;

        setSending(true);
        try {
            await sendMessage(messageInput);
            setMessageInput('');
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setSending(false);
        }
    };

    // Handle conversation select
    const handleSelectConversation = (conv) => {
        selectConversation(conv);
        setView('chat');
    };

    // Handle back to list
    const handleBack = () => {
        setView('list');
    };

    // Format time
    const formatTime = (date) => {
        const d = new Date(date);
        const now = new Date();
        const diff = now - d;

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return d.toLocaleDateString();
    };

    const currentUserId = localStorage.getItem('userId');

    return (
        <>
            {/* Floating Chat Button */}
            <button
                onClick={() => setChatOpen(!chatOpen)}
                className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
            >
                <ChatIcon />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Chat Panel */}
            {chatOpen && (
                <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 h-[500px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden animate-slideUp">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white">
                        {view === 'chat' && currentConversation ? (
                            <>
                                <button onClick={handleBack} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                                    <BackIcon />
                                </button>
                                <div className="flex-1 ml-2 truncate">
                                    <h3 className="font-semibold truncate">
                                        {currentConversation.otherParticipant?.name || 'Chat'}
                                    </h3>
                                </div>
                            </>
                        ) : (
                            <h3 className="font-semibold">Messages</h3>
                        )}
                        <button onClick={() => setChatOpen(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                            <CloseIcon />
                        </button>
                    </div>

                    {/* Content */}
                    {view === 'list' ? (
                        /* Conversation List */
                        <div className="flex-1 overflow-y-auto">
                            {conversations.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 p-4">
                                    <ChatIcon />
                                    <p className="mt-2 text-sm">No conversations yet</p>
                                    <p className="text-xs text-center mt-1">Start chatting by clicking on a user in the dashboard</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {conversations.map((conv) => (
                                        <button
                                            key={conv._id}
                                            onClick={() => handleSelectConversation(conv)}
                                            className="w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white font-semibold">
                                                {(conv.otherParticipant?.name || 'U')[0].toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium text-gray-900 dark:text-white truncate">
                                                        {conv.otherParticipant?.name || 'Unknown'}
                                                    </span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        {formatTime(conv.lastMessageAt)}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                                    {conv.lastMessage || 'No messages'}
                                                </p>
                                            </div>
                                            {conv.unreadCount > 0 && (
                                                <span className="flex items-center justify-center min-w-[20px] h-5 px-1 text-xs font-bold text-white bg-rose-500 rounded-full">
                                                    {conv.unreadCount}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Chat View */
                        <>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {loading && messages.length === 0 ? (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                                        <p className="text-sm">No messages yet</p>
                                        <p className="text-xs">Send a message to start the conversation</p>
                                    </div>
                                ) : (
                                    messages.map((msg) => {
                                        const isOwn = msg.senderId === currentUserId;
                                        return (
                                            <div
                                                key={msg._id}
                                                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div
                                                    className={`max-w-[75%] px-4 py-2 rounded-2xl ${isOwn
                                                            ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-br-md'
                                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md'
                                                        }`}
                                                >
                                                    <p className="text-sm break-words">{msg.content}</p>
                                                    <p className={`text-xs mt-1 ${isOwn ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}`}>
                                                        {formatTime(msg.createdAt)}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Message Input */}
                            <form onSubmit={handleSend} className="p-3 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        placeholder="Type a message..."
                                        className="flex-1 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
                                        disabled={sending}
                                    />
                                    <button
                                        type="submit"
                                        disabled={!messageInput.trim() || sending}
                                        className="p-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 text-white hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        <SendIcon />
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            )}

            {/* Animation styles */}
            <style>{`
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-slideUp {
                    animation: slideUp 0.2s ease-out;
                }
            `}</style>
        </>
    );
}
