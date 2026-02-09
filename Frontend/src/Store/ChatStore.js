import { create } from "zustand";
import api from "../Services/Api.js";
import { getSocket } from "../Socket/Socket.js";

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
    isMobileChatOpen: false, // Track if mobile chat is open

    /* ===================== SET MOBILE CHAT OPEN ===================== */
    setMobileChatOpen: (isOpen) => set({ isMobileChatOpen: isOpen }),

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
            const res = await api.get("/chat/conversations");
            set({ conversations: res.data.data, loading: false });
        } catch (err) {
            console.error("Failed to fetch conversations:", err);
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
                error: err.response?.data?.message || "Failed to fetch messages",
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
            sender: { _id: 'me' }, // Will be replaced when API responds
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
                messages: state.messages.map(msg =>
                    msg._id === tempId ? { ...newMessage, sending: false } : msg
                ),
            }));

            // Update conversation list silently (no loading state)
            get().updateConversationWithMessage(newMessage);

            return true;
        } catch (err) {
            // Remove failed message
            set((state) => ({
                messages: state.messages.filter(msg => msg._id !== tempId),
                error: err.response?.data?.message || "Failed to send message",
            }));
            return false;
        }
    },

    /* ===================== UPDATE CONVERSATION WITH NEW MESSAGE ===================== */
    updateConversationWithMessage: (message) => {
        set((state) => {
            const existingConv = state.conversations.find(
                c => c.friend?._id === message.receiver || c.friend?._id === message.sender?._id
            );

            if (existingConv) {
                // Update existing conversation
                return {
                    conversations: state.conversations.map(c =>
                        c._id === existingConv._id
                            ? { ...c, lastMessage: message, updatedAt: message.createdAt }
                            : c
                    ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
                };
            } else {
                // Fetch fresh conversations if new chat
                get().fetchConversations();
                return state;
            }
        });
    },

    /* ===================== RECEIVE NEW MESSAGE ===================== */
    receiveMessage: (messageData) => {
        const { currentChat } = get();
        const senderId = messageData.message.sender?._id || messageData.message.sender;

        // If this message is from the current chat, add it to messages
        if (currentChat && senderId === currentChat._id) {
            set((state) => ({
                messages: [...state.messages, messageData.message],
            }));
        }

        // Update conversation list silently
        get().updateConversationWithMessage(messageData.message);
    },

    /* ===================== MESSAGE SENT CONFIRMATION (Socket) ===================== */
    messageSentConfirmation: (messageData) => {
        // Only add if not already in messages (avoid duplicates from REST API)
        set((state) => {
            const exists = state.messages.some(m => m._id === messageData.message._id);
            if (exists) return state;
            return {
                messages: [...state.messages, messageData.message],
            };
        });
        get().updateConversationWithMessage(messageData.message);
    },

    /* ===================== UPDATE MESSAGE READ STATUS ===================== */
    updateMessageReadStatus: (conversationId) => {
        set((state) => ({
            messages: state.messages.map(msg => ({
                ...msg,
                read: true,
            })),
        }));
    },

    /* ===================== TYPING INDICATORS ===================== */
    sendTyping: () => {
        const { currentChat } = get();
        if (!currentChat) return;

        const socket = getSocket();
        if (socket) {
            socket.emit("typing", { receiverId: currentChat._id });
        }
    },

    stopTyping: () => {
        const { currentChat } = get();
        if (!currentChat) return;

        const socket = getSocket();
        if (socket) {
            socket.emit("stop-typing", { receiverId: currentChat._id });
        }
    },

    setUserTyping: (userId) => {
        const { currentChat } = get();
        if (currentChat && currentChat._id === userId) {
            set({ isTyping: true, typingUserId: userId });
        }
    },

    setUserStopTyping: (userId) => {
        const { currentChat } = get();
        if (currentChat && currentChat._id === userId) {
            set({ isTyping: false, typingUserId: null });
        }
    },

    /* ===================== MARK AS READ ===================== */
    markAsRead: async (conversationId) => {
        try {
            await api.put(`/chat/read/${conversationId}`);
        } catch (err) {
            console.error("Failed to mark as read:", err);
        }
    },

    /* ===================== FETCH UNREAD COUNT ===================== */
    fetchUnreadCount: async () => {
        try {
            const res = await api.get("/chat/unread");
            set({ unreadCount: res.data.unreadCount });
        } catch (err) {
            console.error("Failed to fetch unread count:", err);
        }
    },

    /* ===================== CLEAR CURRENT CHAT ===================== */
    clearCurrentChat: () => {
        set({ currentChat: null, messages: [] });
    },

    /* ===================== DELETE MESSAGE ===================== */
    deleteMessage: async (messageId, deleteForEveryone = false) => {
        try {
            const res = await api.post(`/chat/message/delete/${messageId}`, { deleteForEveryone });

            if (res.data.success) {
                if (deleteForEveryone) {
                    // Update locally for sender (socket will handle other side if integrated)
                    set((state) => ({
                        messages: state.messages.map(m =>
                            m._id === messageId ? { ...m, isDeletedForEveryone: true } : m
                        )
                    }));
                } else {
                    // Remove from view entirely for "delete for me"
                    set((state) => ({
                        messages: state.messages.filter(m => m._id !== messageId)
                    }));
                }
                return true;
            }
            return false;
        } catch (err) {
            console.error("Failed to delete message:", err);
            return false;
        }
    },

    /* ===================== RECEIVE MESSAGE DELETED FOR EVERYONE ===================== */
    receiveDeletedMessageEveryone: (messageId) => {
        set((state) => ({
            messages: state.messages.map(m =>
                m._id === messageId ? { ...m, isDeletedForEveryone: true } : m
            )
        }));
    },

    /* ===================== RESET STORE (on logout) ===================== */
    resetStore: () => {
        set({
            conversations: [],
            currentChat: null,
            messages: [],
            unreadCount: 0,
            loading: false,
            messagesLoading: false,
            error: null,
            isTyping: false,
            typingUserId: null,
            isMobileChatOpen: false,
        });
    },
}));
