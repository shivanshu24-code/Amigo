import { create } from 'zustand';
import api from '../services/api.js';
import { getSocket } from '../socket/socket.js';

export const useChatStore = create((set, get) => ({
    /* ===================== STATE ===================== */
    conversations: [],
    currentChat: null,
    messages: [],
    unreadCount: 0,
    loading: false,
    messagesLoading: false,
    error: null,
    isTyping: false,
    typingUserId: null,

    /* ===================== SET CURRENT CHAT ===================== */
    setCurrentChat: (friend) => {
        set({ currentChat: friend, messages: [] });
        if (friend) {
            get().fetchMessages(friend._id);
        }
    },

    /* ===================== FETCH CONVERSATIONS ===================== */
    fetchConversations: async () => {
        set({ loading: true });
        try {
            const res = await api.get('/chat/conversations');
            set({ conversations: res.data.data, loading: false });
        } catch (err) {
            console.error('Failed to fetch conversations:', err);
            set({ loading: false });
        }
    },

    /* ===================== FETCH MESSAGES ===================== */
    fetchMessages: async (friendId) => {
        set({ messagesLoading: true, error: null });
        try {
            const res = await api.get(`/chat/messages/${friendId}`);
            set({ messages: res.data.data, messagesLoading: false });
        } catch (err) {
            set({
                messagesLoading: false,
                error: err.response?.data?.message || 'Failed to fetch messages',
            });
        }
    },

    /* ===================== SEND MESSAGE ===================== */
    sendMessage: async (text) => {
        const { currentChat, messages } = get();
        if (!currentChat || !text.trim()) return;

        // Optimistically add message to UI
        const tempId = `temp-${Date.now()}`;
        const optimisticMessage = {
            _id: tempId,
            text: text.trim(),
            sender: { _id: 'me' },
            receiver: currentChat._id,
            createdAt: new Date().toISOString(),
            read: false,
            sending: true,
        };

        set({ messages: [...messages, optimisticMessage] });

        try {
            const res = await api.post(`/chat/send/${currentChat._id}`, { text });
            const newMessage = res.data.data;

            // Replace optimistic message with real one
            set((state) => ({
                messages: state.messages.map((msg) =>
                    msg._id === tempId ? { ...newMessage, sending: false } : msg
                ),
            }));

            // Update conversation list
            get().updateConversationWithMessage(newMessage);

            return true;
        } catch (err) {
            // Remove failed message
            set((state) => ({
                messages: state.messages.filter((msg) => msg._id !== tempId),
                error: err.response?.data?.message || 'Failed to send message',
            }));
            return false;
        }
    },

    /* ===================== UPDATE CONVERSATION WITH NEW MESSAGE ===================== */
    updateConversationWithMessage: (message) => {
        set((state) => {
            const conversations = [...state.conversations];
            const convoIndex = conversations.findIndex(
                (c) => c.friend?._id === message.sender._id || c.friend?._id === message.receiver
            );

            if (convoIndex !== -1) {
                const convo = conversations[convoIndex];
                conversations.splice(convoIndex, 1);
                conversations.unshift({
                    ...convo,
                    lastMessage: message,
                });
            }

            return { conversations };
        });
    },

    /* ===================== RECEIVE MESSAGE (from socket) ===================== */
    receiveMessage: (message) => {
        const { currentChat, messages } = get();

        // Add to messages if chat is open
        if (currentChat && message.sender._id === currentChat._id) {
            set({ messages: [...messages, message] });
        }

        // Update conversation list
        get().updateConversationWithMessage(message);
    },

    /* ===================== MARK AS READ ===================== */
    markAsRead: async (friendId) => {
        try {
            await api.put(`/chat/read/${friendId}`);
        } catch (err) {
            console.error('Failed to mark as read:', err);
        }
    },

    /* ===================== RESET ===================== */
    reset: () => set({
        conversations: [],
        currentChat: null,
        messages: [],
        unreadCount: 0,
        loading: false,
        error: null,
    }),
}));
